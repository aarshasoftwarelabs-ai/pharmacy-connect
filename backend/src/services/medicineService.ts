import pool from '../config/database';

export class MedicineService {
  static async getMedicines(pharmacyId: number) {
    const query = `
      SELECT m.id, m.pharmacy_id as "pharmacyId", m.name, m.generic_name as "genericName", 
             m.category, m.strength, m.sku, m.barcode, m.current_stock as "currentStock", 
             m.minimum_stock as "minimumStock", m.selling_price as "sellingPrice",
             m.image_url as "imageUrl", m.hsn_code as "hsnCode", m.gst_rate as "gstRate",
             m.manufacturer, m.expiry_date as "expiryDate", m.created_at as "createdAt", m.updated_at as "updatedAt",
             (
               SELECT COALESCE(json_agg(
                 json_build_object(
                   'id', mb.id,
                   'batchNumber', mb.batch_number,
                   'expiryDate', mb.expiry_date,
                   'quantity', mb.quantity,
                   'availableQuantity', mb.available_quantity,
                   'purchasePrice', mb.purchase_price,
                   'mrp', mb.mrp,
                   'sellingPrice', mb.selling_price
                 ) ORDER BY mb.expiry_date ASC
               ), '[]'::json)
               FROM medicine_batches mb
               WHERE mb.medicine_id = m.id
             ) as batches
      FROM medicines m
      WHERE m.pharmacy_id = $1
      ORDER BY m.name ASC;
    `;
    const result = await pool.query(query, [pharmacyId]);
    return result.rows;
  }

  static async createMedicine(pharmacyId: number, data: any) {
    const query = `
      INSERT INTO medicines (
        pharmacy_id, name, generic_name, category, strength, sku, barcode, 
        current_stock, minimum_stock, selling_price, image_url, hsn_code, gst_rate, manufacturer, expiry_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, pharmacy_id as "pharmacyId", name, generic_name as "genericName", 
                category, strength, sku, barcode, current_stock as "currentStock", 
                minimum_stock as "minimumStock", selling_price as "sellingPrice",
                image_url as "imageUrl", hsn_code as "hsnCode", gst_rate as "gstRate",
                manufacturer, expiry_date as "expiryDate", created_at as "createdAt", updated_at as "updatedAt"
    `;
    const values = [
      pharmacyId, data.name, data.genericName, data.category, data.strength === '' ? null : data.strength, 
      data.sku === '' ? null : data.sku, data.barcode === '' ? null : data.barcode,
      data.currentStock || 0, data.minimumStock || 0, data.sellingPrice || 0,
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
    if (data.barcode !== undefined) {
      fields.push(`barcode = $${queryIndex++}`);
      values.push(data.barcode === '' ? null : data.barcode);
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

  // Bulk Import medicines and batches from Distributor CSV / Excel
  static async bulkImportMedicines(pharmacyId: number, items: Array<{
    name: string;
    genericName?: string;
    category?: string;
    strength?: string;
    batchNumber?: string;
    expiryDate?: string;
    quantity: number;
    purchasePrice?: number;
    mrp?: number;
    sellingPrice?: number;
    gstRate?: number;
    hsnCode?: string;
    barcode?: string;
    sku?: string;
    manufacturer?: string;
  }>) {
    const client = await pool.connect();
    let importedCount = 0;
    let totalStockAdded = 0;

    try {
      await client.query('BEGIN');

      for (const item of items) {
        if (!item.name || !item.name.trim()) continue;

        const medName = item.name.trim();
        const qty = Number(item.quantity) || 0;
        const purchasePrice = Number(item.purchasePrice) || 0;
        const mrp = Number(item.mrp) || Number(item.sellingPrice) || purchasePrice * 1.25;
        const sellingPrice = Number(item.sellingPrice) || mrp;
        const gstRate = Number(item.gstRate) || 12;
        const barcode = item.barcode ? item.barcode.trim() : null;
        const sku = item.sku ? item.sku.trim() : `SKU-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;

        // Check if medicine already exists by name
        const checkRes = await client.query(
          `SELECT id, current_stock, selling_price, barcode FROM medicines WHERE pharmacy_id = $1 AND LOWER(name) = LOWER($2)`,
          [pharmacyId, medName]
        );

        let medicineId: number;

        if (checkRes.rows.length > 0) {
          // Update existing medicine stock
          medicineId = checkRes.rows[0].id;
          await client.query(
            `UPDATE medicines 
             SET current_stock = current_stock + $1,
                 selling_price = COALESCE($2, selling_price),
                 barcode = COALESCE(barcode, $3),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [qty, sellingPrice, barcode, medicineId]
          );
        } else {
          // Insert new medicine
          const insertMedRes = await client.query(
            `INSERT INTO medicines (
              pharmacy_id, name, generic_name, category, strength, sku, barcode,
              current_stock, minimum_stock, selling_price, hsn_code, gst_rate, manufacturer, expiry_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 10, $9, $10, $11, $12, $13)
            RETURNING id`,
            [
              pharmacyId,
              medName,
              item.genericName || null,
              item.category || 'Pharmaceutical',
              item.strength || null,
              sku,
              barcode,
              qty,
              sellingPrice,
              item.hsnCode || '3004',
              gstRate,
              item.manufacturer || null,
              item.expiryDate || null
            ]
          );
          medicineId = insertMedRes.rows[0].id;
        }

        // Insert Batch if batchNumber provided
        if (item.batchNumber && item.batchNumber.trim() && qty > 0) {
          const batchNo = item.batchNumber.trim();
          const expDate = item.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          await client.query(
            `INSERT INTO medicine_batches (
              pharmacy_id, medicine_id, batch_number, expiry_date,
              quantity, available_quantity, purchase_price, mrp, selling_price, barcode
            ) VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9)`,
            [
              pharmacyId,
              medicineId,
              batchNo,
              expDate,
              qty,
              purchasePrice,
              mrp,
              sellingPrice,
              barcode
            ]
          );
        }

        importedCount++;
        totalStockAdded += qty;
      }

      await client.query('COMMIT');
      return {
        success: true,
        importedCount,
        totalStockAdded,
        message: `Successfully imported ${importedCount} medicines (${totalStockAdded} total stock units)`
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
