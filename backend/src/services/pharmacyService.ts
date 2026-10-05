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
    return result.rows[0];
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
    subscriptionEndDate: string | null = null
  ): Promise<PharmacyProfile | null> {
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
    return result.rows[0];
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
