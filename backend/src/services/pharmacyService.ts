import pool from '../config/database';

export interface PharmacyProfile {
  id: number;
  ownerId?: number;
  name: string;
  address: string;
  phone: string;
  planType?: string;
  trialStartDate?: string;
  subscriptionEndDate?: string | null;
  createdAt: string;
  updatedAt: string;
  ownerName?: string;
  gstin?: string;
  gstRegistered?: boolean;
  state?: string;
  operationalHours?: {
    mondayToFriday: string;
    saturday: string;
    sunday: string;
  };
}

export class PharmacyService {
  static async getPharmacyById(id: number): Promise<PharmacyProfile | null> {
    const query = `
      SELECT p.id, p.owner_id AS "ownerId", p.name, p.address, p.phone, p.gstin, p.gst_registered AS "gstRegistered", p.state,
             p.plan_type AS "planType", p.trial_start_date AS "trialStartDate", p.subscription_end_date AS "subscriptionEndDate",
             p.created_at AS "createdAt", p.updated_at AS "updatedAt",
             p.operational_hours AS "operationalHours",
             u.name AS "ownerName"
      FROM pharmacies p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    const row = result.rows[0];
    row.isMobileOnly = row.planType === 'MOBILE_YEARLY';
    row.supportsPc = row.planType !== 'MOBILE_YEARLY';
    return row;
  }

  static async getAllPharmacies(): Promise<PharmacyProfile[]> {
    const query = `
      SELECT p.id, p.owner_id AS "ownerId", p.name, p.address, p.phone,
             u.name AS "ownerName"
      FROM pharmacies p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.business_type = 'RETAIL' OR p.business_type IS NULL
      ORDER BY p.id ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async updateSubscriptionPlan(
    id: number,
    planType: string,
    subscriptionEndDate: string | null = null,
    paymentDetails?: {
      amount?: number;
      paymentMethod?: string;
      transactionId?: string;
      upiId?: string;
      agentNote?: string;
      durationMonths?: number;
    }
  ): Promise<{ pharmacy: PharmacyProfile; payment?: any } | null> {
    const query = `
      UPDATE pharmacies
      SET plan_type = $2,
          subscription_end_date = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, owner_id AS "ownerId", name, address, phone, 
                plan_type AS "planType", trial_start_date AS "trialStartDate", subscription_end_date AS "subscriptionEndDate",
                operational_hours AS "operationalHours",
                created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const result = await pool.query(query, [id, planType, subscriptionEndDate]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const pharmacy = result.rows[0];
    let paymentRecord: any = null;

    if (paymentDetails) {
      try {
        const receiptNo = `DS-SUB-${Date.now().toString().slice(-6)}`;
        const amount = paymentDetails.amount || 1499.00;
        const paymentMethod = (paymentDetails.paymentMethod || 'UPI').toUpperCase();
        const transactionId = paymentDetails.transactionId || (paymentMethod === 'UPI' ? `UPI-${Date.now()}` : `CASH-${Date.now().toString().slice(-4)}`);
        const upiId = paymentDetails.upiId || 'lodaliya@ptyes';
        const agentNote = paymentDetails.agentNote || null;
        const durationMonths = paymentDetails.durationMonths || 12;

        const insertPaymentQuery = `
          INSERT INTO subscription_payments (
            pharmacy_id, amount, payment_method, payment_status, 
            transaction_id, receipt_number, upi_id, agent_note, 
            plan_type, duration_months, billing_end_date
          ) VALUES ($1, $2, $3, 'SUCCESS', $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `;
        const paymentRes = await pool.query(insertPaymentQuery, [
          id, amount, paymentMethod, transactionId, receiptNo,
          upiId, agentNote, planType, durationMonths, subscriptionEndDate
        ]);
        paymentRecord = paymentRes.rows[0];
      } catch (payErr) {
        console.error('Error recording subscription payment transaction:', payErr);
      }
    }

    return { pharmacy, payment: paymentRecord };
  }

  static async getSubscriptionPayments(pharmacyId: number): Promise<any[]> {
    try {
      const query = `
        SELECT id, pharmacy_id, amount, currency, payment_method, payment_status,
               transaction_id, receipt_number, upi_id, agent_note, plan_type,
               duration_months, billing_end_date, paid_at, created_at
        FROM subscription_payments
        WHERE pharmacy_id = $1
        ORDER BY id DESC
        LIMIT 20
      `;
      const result = await pool.query(query, [pharmacyId]);
      return result.rows;
    } catch (err) {
      console.error('Error fetching subscription payments:', err);
      return [];
    }
  }

  static async getPaidPharmaciesCount(): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM pharmacies
      WHERE plan_type != 'FREE_TRIAL'
    `;
    const result = await pool.query(query);
    return parseInt(result.rows[0].count, 10);
  }

  static async updatePharmacyProfile(
    id: number,
    data: { name: string; address: string; phone: string; regNo?: string; gstin?: string; gstRegistered?: boolean; state?: string; ownerName?: string; email?: string; operationalHours?: any }
  ): Promise<PharmacyProfile | null> {
    
    // First, update the user name if ownerName is provided
    if (data.ownerName) {
      const getOwnerQuery = `SELECT owner_id FROM pharmacies WHERE id = $1`;
      const ownerRes = await pool.query(getOwnerQuery, [id]);
      if (ownerRes.rows.length > 0 && ownerRes.rows[0].owner_id) {
        const ownerId = ownerRes.rows[0].owner_id;
        await pool.query(`UPDATE users SET name = $1 WHERE id = $2`, [data.ownerName, ownerId]);
      }
    }

    const query = `
      UPDATE pharmacies
      SET name = COALESCE($2, name),
          address = COALESCE($3, address),
          phone = COALESCE($4, phone),
          reg_no = COALESCE($5, reg_no),
          gstin = COALESCE($6, gstin),
          email = COALESCE($7, email),
          gst_registered = COALESCE($8, gst_registered),
          state = COALESCE($9, state),
          operational_hours = COALESCE($10, operational_hours),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, owner_id AS "ownerId", name, address, phone, email, reg_no AS "regNo", gstin, gst_registered AS "gstRegistered", state,
                plan_type AS "planType", trial_start_date AS "trialStartDate", subscription_end_date AS "subscriptionEndDate",
                operational_hours AS "operationalHours",
                created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const result = await pool.query(query, [
      id, data.name, data.address, data.phone, data.regNo, data.gstin, data.email, data.gstRegistered, data.state, data.operationalHours
    ]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const pharmacy = result.rows[0];
    pharmacy.ownerName = data.ownerName;
    return pharmacy;
  }
}
