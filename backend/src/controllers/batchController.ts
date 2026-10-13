import { Response } from 'express';
import pool from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

export class BatchController {
  
  static async getBatches(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const result = await pool.query(
        `SELECT b.*, m.name as medicine_name 
         FROM medicine_batches b
         JOIN medicines m ON b.medicine_id = m.id
         WHERE b.pharmacy_id = $1
         ORDER BY b.expiry_date ASC`,
        [pharmacyId]
      );
      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      console.error('Error fetching batches:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  static async getBatchById(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const batchId = parseInt(req.params.id);
      
      const result = await pool.query(
        `SELECT b.*, m.name as medicine_name 
         FROM medicine_batches b
         JOIN medicines m ON b.medicine_id = m.id
         WHERE b.id = $1 AND b.pharmacy_id = $2`,
        [batchId, pharmacyId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }
      
      res.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      console.error('Error fetching batch:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  static async getExpiringBatches(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      // configurable period, for now 90 days
      const result = await pool.query(
        `SELECT b.*, m.name as medicine_name 
         FROM medicine_batches b
         JOIN medicines m ON b.medicine_id = m.id
         WHERE b.pharmacy_id = $1 
         AND b.expiry_date > CURRENT_DATE 
         AND b.expiry_date <= CURRENT_DATE + INTERVAL '90 days'
         ORDER BY b.expiry_date ASC`,
        [pharmacyId]
      );
      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      console.error('Error fetching expiring batches:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  static async getExpiredBatches(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const result = await pool.query(
        `SELECT b.*, m.name as medicine_name 
         FROM medicine_batches b
         JOIN medicines m ON b.medicine_id = m.id
         WHERE b.pharmacy_id = $1 
         AND b.expiry_date < CURRENT_DATE
         ORDER BY b.expiry_date DESC`,
        [pharmacyId]
      );
      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      console.error('Error fetching expired batches:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  static async getBatchesByMedicine(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const medicineId = parseInt(req.params.medicineId);

      const result = await pool.query(
        `SELECT b.id, b.medicine_id as "medicineId", b.pharmacy_id as "pharmacyId",
                b.batch_number as "batchNumber", b.expiry_date as "expiryDate",
                b.quantity, b.available_quantity as "availableQuantity",
                b.purchase_price as "purchasePrice", b.mrp, b.selling_price as "sellingPrice",
                b.barcode, m.name as medicine_name
         FROM medicine_batches b
         JOIN medicines m ON b.medicine_id = m.id
         WHERE b.medicine_id = $1 AND b.pharmacy_id = $2
         ORDER BY b.expiry_date ASC`,
        [medicineId, pharmacyId]
      );

      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      console.error('Error fetching batches for medicine:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  static async createBatch(req: AuthenticatedRequest, res: Response) {
    const client = await pool.connect();
    try {
      const pharmacyId = req.user!.pharmacyId;
      const { 
        medicineId, 
        batchNumber, 
        expiryDate, 
        quantity, 
        purchasePrice = 0, 
        mrp = 0, 
        sellingPrice = 0, 
        barcode 
      } = req.body;

      if (!medicineId || !batchNumber || !expiryDate || quantity === undefined) {
        return res.status(400).json({ success: false, message: 'medicineId, batchNumber, expiryDate, and quantity are required.' });
      }

      await client.query('BEGIN');

      const medRes = await client.query('SELECT id, barcode, selling_price, mrp FROM medicines WHERE id = $1 AND pharmacy_id = $2', [medicineId, pharmacyId]);
      if (medRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Medicine not found.' });
      }

      const assignedBarcode = barcode && barcode.trim() !== '' 
        ? barcode.trim() 
        : (medRes.rows[0].barcode || `890${String(pharmacyId).padStart(3, '0').slice(-3)}${String(medicineId).padStart(5, '0').slice(-5)}${Math.floor(Math.random() * 10)}`);

      const batchRes = await client.query(
        `INSERT INTO medicine_batches (
          pharmacy_id, medicine_id, batch_number, expiry_date,
          quantity, available_quantity, purchase_price, mrp, selling_price, barcode
        ) VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9)
        ON CONFLICT (medicine_id, pharmacy_id, batch_number)
        DO UPDATE SET
          quantity = medicine_batches.quantity + EXCLUDED.quantity,
          available_quantity = medicine_batches.available_quantity + EXCLUDED.quantity,
          expiry_date = EXCLUDED.expiry_date,
          mrp = EXCLUDED.mrp,
          purchase_price = EXCLUDED.purchase_price,
          selling_price = EXCLUDED.selling_price,
          barcode = COALESCE(EXCLUDED.barcode, medicine_batches.barcode)
        RETURNING id, medicine_id as "medicineId", batch_number as "batchNumber", expiry_date as "expiryDate",
                  quantity, available_quantity as "availableQuantity", purchase_price as "purchasePrice",
                  mrp, selling_price as "sellingPrice", barcode`,
        [
          pharmacyId,
          medicineId,
          batchNumber.trim().toUpperCase(),
          expiryDate,
          Number(quantity),
          Number(purchasePrice),
          Number(mrp) || Number(medRes.rows[0].mrp) || Number(sellingPrice),
          Number(sellingPrice) || Number(medRes.rows[0].selling_price) || 0,
          assignedBarcode
        ]
      );

      // Recalculate medicine stock
      await client.query(
        `UPDATE medicines 
         SET current_stock = (SELECT COALESCE(SUM(available_quantity), 0) FROM medicine_batches WHERE medicine_id = $1)
         WHERE id = $1`,
        [medicineId]
      );

      await client.query('COMMIT');

      res.status(201).json({ success: true, data: batchRes.rows[0], message: 'Batch saved successfully.' });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Error creating batch:', error);
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
      client.release();
    }
  }

  static async deleteBatch(req: AuthenticatedRequest, res: Response) {
    const client = await pool.connect();
    try {
      const pharmacyId = req.user!.pharmacyId;
      const batchId = parseInt(req.params.id);

      await client.query('BEGIN');

      const batchRes = await client.query('SELECT medicine_id FROM medicine_batches WHERE id = $1 AND pharmacy_id = $2', [batchId, pharmacyId]);
      if (batchRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Batch not found.' });
      }

      const medicineId = batchRes.rows[0].medicine_id;

      await client.query('DELETE FROM medicine_batches WHERE id = $1 AND pharmacy_id = $2', [batchId, pharmacyId]);

      // Recalculate medicine stock
      await client.query(
        `UPDATE medicines 
         SET current_stock = (SELECT COALESCE(SUM(available_quantity), 0) FROM medicine_batches WHERE medicine_id = $1)
         WHERE id = $1`,
        [medicineId]
      );

      await client.query('COMMIT');

      res.json({ success: true, message: 'Batch deleted successfully.' });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Error deleting batch:', error);
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
      client.release();
    }
  }

  static async initializeMissingBatches(req: AuthenticatedRequest, res: Response) {
    const client = await pool.connect();
    try {
      const pharmacyId = req.user!.pharmacyId;
      const specificMedicineId = req.body.medicineId ? parseInt(req.body.medicineId) : null;

      let medQuery = `
        SELECT m.id, m.name, m.current_stock, m.selling_price, m.mrp, m.expiry_date, m.barcode
        FROM medicines m
        LEFT JOIN medicine_batches mb ON mb.medicine_id = m.id
        WHERE m.pharmacy_id = $1
      `;
      const queryParams: any[] = [pharmacyId];

      if (specificMedicineId) {
        medQuery += ` AND m.id = $2`;
        queryParams.push(specificMedicineId);
      }

      medQuery += `
        GROUP BY m.id
        HAVING COUNT(mb.id) = 0
      `;

      const medsWithoutBatches = await client.query(medQuery, queryParams);

      if (medsWithoutBatches.rows.length === 0) {
        return res.json({ success: true, count: 0, message: 'All medicines already have active batches recorded.' });
      }

      await client.query('BEGIN');
      let createdCount = 0;

      for (const med of medsWithoutBatches.rows) {
        const batchNumber = `B25-${String(med.id).padStart(4, '0')}`;
        const qty = Math.max(Number(med.current_stock) || 0, 50);
        const expDate = med.expiry_date || new Date(Date.now() + 540 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const sellPrice = Number(med.selling_price) || 100;
        const mrp = Number(med.mrp) || Math.round(sellPrice * 1.15);
        const purchasePrice = Math.round(sellPrice * 0.75);
        const barcode = med.barcode || `890${String(pharmacyId).padStart(3, '0').slice(-3)}${String(med.id).padStart(5, '0').slice(-5)}0`;

        await client.query(
          `INSERT INTO medicine_batches (
            pharmacy_id, medicine_id, batch_number, expiry_date,
            quantity, available_quantity, purchase_price, mrp, selling_price, barcode
          ) VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9)
          ON CONFLICT (medicine_id, pharmacy_id, batch_number) DO NOTHING`,
          [pharmacyId, med.id, batchNumber, expDate, qty, purchasePrice, mrp, sellPrice, barcode]
        );

        if (!med.current_stock || Number(med.current_stock) === 0) {
          await client.query('UPDATE medicines SET current_stock = $1 WHERE id = $2', [qty, med.id]);
        }
        createdCount++;
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        count: createdCount,
        message: `Successfully generated initial batches for ${createdCount} medicines.`
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Error initializing missing batches:', error);
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    } finally {
      client.release();
    }
  }
}
