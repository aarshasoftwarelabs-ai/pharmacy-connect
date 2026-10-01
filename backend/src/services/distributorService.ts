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
}
