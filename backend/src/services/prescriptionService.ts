import pool from '../config/database';

export class PrescriptionService {
  static async uploadPrescription(
    customerId: number,
    pharmacyId: number,
    userId: number | undefined,
    fileUrl: string,
    fileName: string,
    mimeType: string,
    notes?: string
  ) {
    const result = await pool.query(`
      INSERT INTO prescriptions 
      (customer_id, pharmacy_id, uploaded_by_user_id, file_url, file_name, mime_type, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [customerId, pharmacyId, userId || null, fileUrl, fileName, mimeType, notes]);
    
    return result.rows[0];
  }

  static async getPharmacyPrescriptions(pharmacyId: number, status?: string) {
    let query = `
      SELECT p.*, c.display_name as customer_name, c.phone as customer_phone
      FROM prescriptions p
      JOIN customer_profiles c ON p.customer_id = c.id
      WHERE p.pharmacy_id = $1
    `;
    const params: any[] = [pharmacyId];
    
    if (status) {
      query += ` AND p.status = $2`;
      params.push(status);
    }
    
    query += ` ORDER BY p.created_at DESC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getCustomerPrescriptions(customerId: number) {
    const result = await pool.query(`
      SELECT p.*, ph.name as pharmacy_name
      FROM prescriptions p
      JOIN pharmacies ph ON p.pharmacy_id = ph.id
      WHERE p.customer_id = $1
      ORDER BY p.created_at DESC
    `, [customerId]);
    return result.rows;
  }

  static async updatePrescriptionStatus(prescriptionId: number, pharmacyId: number, status: string) {
    const result = await pool.query(`
      UPDATE prescriptions 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND pharmacy_id = $3
      RETURNING *
    `, [status, prescriptionId, pharmacyId]);
    
    if (result.rows.length === 0) {
      throw new Error('Prescription not found');
    }
    
    return result.rows[0];
  }
}
