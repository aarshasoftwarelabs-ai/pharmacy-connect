import pool from '../config/database';
import { NotificationService, NotificationType } from './notificationService';

export class RefillService {
  /**
   * Calculate potential refills for a specific pharmacy
   * This is designed to be called by a cron job or manually triggered
   */
  static async calculateRefillReminders(pharmacyId: number) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Analyze historical purchases to find patterns
      // We look for customers who bought the same medicine at least 2 times
      // and calculate the average interval between purchases
      
      const query = `
        WITH PurchaseHistory AS (
            SELECT 
                b.customer_profile_id,
                bi.medicine_name,
                MAX(b.bill_date) as last_purchase_date,
                COUNT(b.id) as purchase_count,
                MAX(b.bill_date) - MIN(b.bill_date) as total_duration,
                SUM(bi.quantity) as total_quantity
            FROM bills b
            JOIN bill_items bi ON b.id = bi.bill_id
            WHERE b.pharmacy_id = $1 AND b.customer_profile_id IS NOT NULL
            GROUP BY b.customer_profile_id, bi.medicine_name
            HAVING COUNT(b.id) > 1
        ),
        RefillPredictions AS (
            SELECT 
                customer_profile_id,
                medicine_name,
                last_purchase_date,
                purchase_count,
                EXTRACT(EPOCH FROM total_duration)/(24*60*60*(purchase_count - 1)) as avg_days_between_purchases,
                total_quantity / purchase_count as avg_quantity
            FROM PurchaseHistory
            WHERE EXTRACT(EPOCH FROM total_duration)/(24*60*60*(purchase_count - 1)) BETWEEN 5 AND 90
        )
        SELECT * FROM RefillPredictions;
      `;
      
      const predictions = await client.query(query, [pharmacyId]);
      let newRemindersCount = 0;
      
      for (const pred of predictions.rows) {
        // Calculate estimated refill date
        const estimatedDate = new Date(pred.last_purchase_date);
        estimatedDate.setDate(estimatedDate.getDate() + Math.round(pred.avg_days_between_purchases));
        
        // Only create a reminder if the estimated date is in the future or up to 7 days in the past
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        
        const thirtyDaysFuture = new Date();
        thirtyDaysFuture.setDate(today.getDate() + 30);
        
        if (estimatedDate >= sevenDaysAgo && estimatedDate <= thirtyDaysFuture) {
          // Check if a pending or recently completed reminder already exists
          const existingCheck = await client.query(`
            SELECT id FROM customer_refill_reminders 
            WHERE customer_id = $1 AND medicine_name = $2 
              AND (status = 'PENDING' OR status = 'SENT' OR (status = 'COMPLETED' AND estimated_refill_date > CURRENT_DATE - INTERVAL '14 days'))
          `, [pred.customer_profile_id, pred.medicine_name]);
          
          if (existingCheck.rows.length === 0) {
            // Create a new reminder
            await client.query(`
              INSERT INTO customer_refill_reminders 
              (customer_id, pharmacy_id, medicine_name, last_purchase_date, estimated_refill_date, status)
              VALUES ($1, $2, $3, $4, $5, 'PENDING')
            `, [pred.customer_profile_id, pharmacyId, pred.medicine_name, pred.last_purchase_date, estimatedDate]);
            newRemindersCount++;
          }
        }
      }
      
      await client.query('COMMIT');
      return { success: true, count: newRemindersCount };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error calculating refills:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getRemindersForPharmacy(pharmacyId: number, status?: string) {
    let query = `
      SELECT r.*, c.display_name as customer_name, c.phone as customer_phone
      FROM customer_refill_reminders r
      JOIN customer_profiles c ON r.customer_id = c.id
      WHERE r.pharmacy_id = $1
    `;
    const params: any[] = [pharmacyId];
    
    if (status) {
      query += ` AND r.status = $2`;
      params.push(status);
    }
    
    query += ` ORDER BY r.estimated_refill_date ASC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }
  
  static async getRemindersForCustomer(customerId: number) {
    const query = `
      SELECT r.*, p.name as pharmacy_name
      FROM customer_refill_reminders r
      JOIN pharmacies p ON r.pharmacy_id = p.id
      WHERE r.customer_id = $1 AND r.status IN ('PENDING', 'SENT')
      ORDER BY r.estimated_refill_date ASC
    `;
    
    const result = await pool.query(query, [customerId]);
    return result.rows;
  }

  static async updateReminderStatus(reminderId: number, pharmacyId: number, status: string) {
    const result = await pool.query(`
      UPDATE customer_refill_reminders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND pharmacy_id = $3
      RETURNING *
    `, [status, reminderId, pharmacyId]);
    
    if (result.rows.length === 0) {
      throw new Error('Reminder not found');
    }
    
    return result.rows[0];
  }
  
  static async customerDismissReminder(reminderId: number, customerProfileId: number) {
    const result = await pool.query(`
      UPDATE customer_refill_reminders 
      SET status = 'DISMISSED', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND customer_id = $2
      RETURNING *
    `, [reminderId, customerProfileId]);
    
    if (result.rows.length === 0) {
      throw new Error('Reminder not found');
    }
    
    return result.rows[0];
  }
}
