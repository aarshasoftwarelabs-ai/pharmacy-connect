import pool from '../config/database';

export class DistributorService {
  static async getDistributors(pharmacyId: number) {
    const query = `
      SELECT id, name, email, whatsapp_number as "whatsappNumber", address,
             created_at as "createdAt", updated_at as "updatedAt"
      FROM distributors
      WHERE pharmacy_id = $1
      ORDER BY name ASC;
    `;
    const result = await pool.query(query, [pharmacyId]);
    return result.rows;
  }

  static async createDistributor(pharmacyId: number, data: any) {
    const query = `
      INSERT INTO distributors (pharmacy_id, name, email, whatsapp_number, address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, whatsapp_number as "whatsappNumber", address,
                created_at as "createdAt", updated_at as "updatedAt";
    `;
    const values = [pharmacyId, data.name, data.email || null, data.whatsappNumber || null, data.address || null];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateDistributor(id: number, pharmacyId: number, data: any) {
    const query = `
      UPDATE distributors
      SET name = $1,
          email = $2,
          whatsapp_number = $3,
          address = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND pharmacy_id = $6
      RETURNING id, name, email, whatsapp_number as "whatsappNumber", address,
                created_at as "createdAt", updated_at as "updatedAt";
    `;
    const values = [data.name, data.email || null, data.whatsappNumber || null, data.address || null, id, pharmacyId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async deleteDistributor(id: number, pharmacyId: number) {
    const query = `
      DELETE FROM distributors
      WHERE id = $1 AND pharmacy_id = $2
    `;
    await pool.query(query, [id, pharmacyId]);
  }

  // Fetch expiring medicines and batches within specified days
  static async getExpiringMedicines(pharmacyId: number, days: number = 90) {
    const query = `
      SELECT 
        m.id as "medicineId",
        m.name as "medicineName",
        m.generic_name as "genericName",
        m.category,
        m.manufacturer,
        m.current_stock as "currentStock",
        COALESCE(mb.id, 0) as "batchId",
        COALESCE(mb.batch_number, 'BATCH-DEF') as "batchNumber",
        COALESCE(mb.expiry_date, m.expiry_date) as "expiryDate",
        COALESCE(mb.quantity, m.current_stock) as "quantity",
        COALESCE(mb.purchase_price, m.selling_price * 0.7) as "purchasePrice",
        COALESCE(mb.mrp, m.selling_price) as "mrp",
        COALESCE(mb.selling_price, m.selling_price) as "sellingPrice",
        (COALESCE(mb.expiry_date, m.expiry_date) - CURRENT_DATE) as "daysRemaining",
        CASE 
          WHEN COALESCE(mb.expiry_date, m.expiry_date) < CURRENT_DATE THEN 'EXPIRED'
          WHEN (COALESCE(mb.expiry_date, m.expiry_date) - CURRENT_DATE) <= 30 THEN 'CRITICAL_30'
          WHEN (COALESCE(mb.expiry_date, m.expiry_date) - CURRENT_DATE) <= 60 THEN 'WARNING_60'
          ELSE 'UPCOMING_90'
        END as "expiryStatus"
      FROM medicines m
      LEFT JOIN medicine_batches mb ON mb.medicine_id = m.id AND mb.quantity > 0
      WHERE m.pharmacy_id = $1
        AND COALESCE(mb.quantity, m.current_stock) > 0
        AND COALESCE(mb.expiry_date, m.expiry_date) IS NOT NULL
        AND COALESCE(mb.expiry_date, m.expiry_date) <= (CURRENT_DATE + ($2 * INTERVAL '1 day'))
      ORDER BY COALESCE(mb.expiry_date, m.expiry_date) ASC;
    `;
    const result = await pool.query(query, [pharmacyId, days]);
    return result.rows;
  }

  // Create a Return to Distributor Challan
  static async createReturnChallan(pharmacyId: number, data: {
    distributorId?: number;
    supplierId?: number;
    challanNumber?: string;
    returnDate?: string;
    reason?: string;
    items: Array<{
      medicineId: number;
      batchId?: number;
      medicineName: string;
      batchNumber: string;
      expiryDate: string;
      quantity: number;
      purchasePrice: number;
      reason?: string;
    }>;
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const challanNumber = data.challanNumber || `RET-${Date.now().toString().slice(-6)}`;
      const returnDate = data.returnDate || new Date().toISOString().split('T')[0];
      const totalItems = data.items.reduce((sum, it) => sum + (it.quantity || 0), 0);
      const totalAmount = data.items.reduce((sum, it) => sum + ((it.quantity || 0) * (it.purchasePrice || 0)), 0);

      const returnRes = await client.query(`
        INSERT INTO distributor_returns (
          pharmacy_id, distributor_id, supplier_id, challan_number, return_date, 
          total_items, total_amount, status, reason
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8)
        RETURNING *
      `, [
        pharmacyId,
        data.distributorId || null,
        data.supplierId || null,
        challanNumber,
        returnDate,
        totalItems,
        totalAmount,
        data.reason || 'EXPIRED_OR_NEAR_EXPIRY'
      ]);

      const createdReturn = returnRes.rows[0];

      // Insert items and adjust stock
      const insertedItems = [];
      for (const item of data.items) {
        const lineTotal = (item.quantity || 0) * (item.purchasePrice || 0);
        const itemRes = await client.query(`
          INSERT INTO distributor_return_items (
            return_id, medicine_id, medicine_name, batch_number, expiry_date, quantity, purchase_price, total_amount, reason
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `, [
          createdReturn.id,
          item.medicineId || null,
          item.medicineName,
          item.batchNumber,
          item.expiryDate,
          item.quantity,
          item.purchasePrice,
          lineTotal,
          item.reason || data.reason || 'EXPIRED'
        ]);
        insertedItems.push(itemRes.rows[0]);

        // Decrement stock from batch if batchId provided
        if (item.batchId && item.batchId > 0) {
          await client.query(`
            UPDATE medicine_batches 
            SET quantity = GREATEST(0, quantity - $1),
                available_quantity = GREATEST(0, available_quantity - $1)
            WHERE id = $2 AND pharmacy_id = $3
          `, [item.quantity, item.batchId, pharmacyId]);
        }

        // Decrement stock from medicines table
        if (item.medicineId) {
          await client.query(`
            UPDATE medicines
            SET current_stock = GREATEST(0, current_stock - $1)
            WHERE id = $2 AND pharmacy_id = $3
          `, [item.quantity, item.medicineId, pharmacyId]);
        }
      }

      await client.query('COMMIT');
      return {
        ...createdReturn,
        items: insertedItems
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Get past return challans
  static async getReturnChallans(pharmacyId: number) {
    const query = `
      SELECT 
        dr.id, dr.challan_number as "challanNumber", dr.return_date as "returnDate",
        dr.total_items as "totalItems", dr.total_amount as "totalAmount", dr.status,
        dr.credit_note_number as "creditNoteNumber", dr.reason, dr.created_at as "createdAt",
        d.name as "distributorName",
        s.supplier_name as "supplierName",
        (
          SELECT COALESCE(json_agg(
            json_build_object(
              'id', dri.id,
              'medicineName', dri.medicine_name,
              'batchNumber', dri.batch_number,
              'expiryDate', dri.expiry_date,
              'quantity', dri.quantity,
              'purchasePrice', dri.purchase_price,
              'totalAmount', dri.total_amount,
              'reason', dri.reason
            )
          ), '[]'::json)
          FROM distributor_return_items dri
          WHERE dri.return_id = dr.id
        ) as items
      FROM distributor_returns dr
      LEFT JOIN distributors d ON d.id = dr.distributor_id
      LEFT JOIN suppliers s ON s.id = dr.supplier_id
      WHERE dr.pharmacy_id = $1
      ORDER BY dr.created_at DESC;
    `;
    const result = await pool.query(query, [pharmacyId]);
    return result.rows;
  }
}
