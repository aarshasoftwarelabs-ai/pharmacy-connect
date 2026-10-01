import pool from '../config/database';

export class MedicineService {
  static async getMedicines(pharmacyId: number) {
    const query = `
      SELECT id, pharmacy_id as "pharmacyId", name, generic_name as "genericName", 
             category, strength, sku, current_stock as "currentStock", 
             minimum_stock as "minimumStock", selling_price as "sellingPrice",
             image_url as "imageUrl", hsn_code as "hsnCode", gst_rate as "gstRate",
             manufacturer, expiry_date as "expiryDate", created_at as "createdAt", updated_at as "updatedAt"
      FROM medicines
      WHERE pharmacy_id = $1
      ORDER BY name ASC;
    `;
    const result = await pool.query(query, [pharmacyId]);
    return result.rows;
  }

  static async createMedicine(pharmacyId: number, data: any) {
    const query = `
      INSERT INTO medicines (
        pharmacy_id, name, generic_name, category, strength, sku, 
        current_stock, minimum_stock, selling_price, image_url, hsn_code, gst_rate, manufacturer, expiry_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, pharmacy_id as "pharmacyId", name, generic_name as "genericName", 
                category, strength, sku, current_stock as "currentStock", 
                minimum_stock as "minimumStock", selling_price as "sellingPrice",
                image_url as "imageUrl", hsn_code as "hsnCode", gst_rate as "gstRate",
                manufacturer, expiry_date as "expiryDate", created_at as "createdAt", updated_at as "updatedAt"
    `;
    const values = [
      pharmacyId, data.name, data.genericName, data.category, data.strength === '' ? null : data.strength, 
      data.sku === '' ? null : data.sku, data.currentStock || 0, data.minimumStock || 0, data.sellingPrice || 0,
      data.imageUrl === '' ? null : data.imageUrl, data.hsnCode === '' ? null : data.hsnCode, data.gstRate || 0,
      data.manufacturer === '' ? null : data.manufacturer, data.expiryDate === '' ? null : data.expiryDate
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateMedicine(id: number, pharmacyId: number, data: any) {
    const fields: string[] = [];
    const values: any[] = [];
    let queryIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${queryIndex++}`);
      values.push(data.name);
    }
    if (data.genericName !== undefined) {
      fields.push(`generic_name = $${queryIndex++}`);
      values.push(data.genericName);
    }
    if (data.category !== undefined) {
      fields.push(`category = $${queryIndex++}`);
      values.push(data.category);
    }
    if (data.strength !== undefined) {
      fields.push(`strength = $${queryIndex++}`);
      values.push(data.strength === '' ? null : data.strength);
    }
    if (data.sku !== undefined) {
      fields.push(`sku = $${queryIndex++}`);
      values.push(data.sku === '' ? null : data.sku);
    }
    if (data.currentStock !== undefined) {
      fields.push(`current_stock = $${queryIndex++}`);
      values.push(data.currentStock);
    }
    if (data.minimumStock !== undefined) {
      fields.push(`minimum_stock = $${queryIndex++}`);
      values.push(data.minimumStock);
    }
    if (data.sellingPrice !== undefined) {
      fields.push(`selling_price = $${queryIndex++}`);
      values.push(data.sellingPrice);
    }
    if (data.imageUrl !== undefined) {
      fields.push(`image_url = $${queryIndex++}`);
      values.push(data.imageUrl === '' ? null : data.imageUrl);
    }
    if (data.hsnCode !== undefined) {
      fields.push(`hsn_code = $${queryIndex++}`);
      values.push(data.hsnCode === '' ? null : data.hsnCode);
    }
    if (data.gstRate !== undefined) {
      fields.push(`gst_rate = $${queryIndex++}`);
      values.push(data.gstRate);
    }
    if (data.manufacturer !== undefined) {
      fields.push(`manufacturer = $${queryIndex++}`);
      values.push(data.manufacturer === '' ? null : data.manufacturer);
    }
    if (data.expiryDate !== undefined) {
      fields.push(`expiry_date = $${queryIndex++}`);
      values.push(data.expiryDate === '' ? null : data.expiryDate);
    }

    if (fields.length === 0) {
      // Nothing to update
      const res = await pool.query(`SELECT * FROM medicines WHERE id = $1 AND pharmacy_id = $2`, [id, pharmacyId]);
      return res.rows[0];
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, pharmacyId);

    const query = `
      UPDATE medicines
      SET ${fields.join(', ')}
      WHERE id = $${queryIndex++} AND pharmacy_id = $${queryIndex++}
      RETURNING id, pharmacy_id as "pharmacyId", name, generic_name as "genericName", 
                category, strength, sku, current_stock as "currentStock", 
                minimum_stock as "minimumStock", selling_price as "sellingPrice",
                image_url as "imageUrl", hsn_code as "hsnCode", gst_rate as "gstRate",
                manufacturer, expiry_date as "expiryDate", created_at as "createdAt", updated_at as "updatedAt"
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async deleteMedicine(id: number, pharmacyId: number) {
    const query = `DELETE FROM medicines WHERE id = $1 AND pharmacy_id = $2 RETURNING id`;
    const result = await pool.query(query, [id, pharmacyId]);
    return result.rows.length > 0;
  }
}
