import { Response } from 'express';
import pool from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

export class PurchaseController {
  
  static async getPurchases(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const result = await pool.query(
        `SELECT p.*, s.supplier_name 
         FROM purchase_invoices p
         JOIN suppliers s ON p.supplier_id = s.id
         WHERE p.pharmacy_id = $1 
         ORDER BY p.created_at DESC`,
        [pharmacyId]
      );
      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      console.error('Error fetching purchases:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  static async getPurchaseById(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const purchaseId = parseInt(req.params.id);
      
      const result = await pool.query(
        `SELECT p.*, s.supplier_name 
         FROM purchase_invoices p
         JOIN suppliers s ON p.supplier_id = s.id
         WHERE p.id = $1 AND p.pharmacy_id = $2`,
        [purchaseId, pharmacyId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Purchase not found' });
      }
      
      res.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      console.error('Error fetching purchase:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  static async getPurchaseItems(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const purchaseId = parseInt(req.params.id);
      
      // Verify ownership first
      const pCheck = await pool.query('SELECT id FROM purchase_invoices WHERE id = $1 AND pharmacy_id = $2', [purchaseId, pharmacyId]);
      if (pCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Purchase not found' });
      }

      const result = await pool.query(
        `SELECT pi.*, m.name as medicine_name 
         FROM purchase_items pi
         JOIN medicines m ON pi.medicine_id = m.id
         WHERE pi.purchase_invoice_id = $1`,
        [purchaseId]
      );
      
      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      console.error('Error fetching items:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  static async createPurchase(req: AuthenticatedRequest, res: Response) {
    const client = await pool.connect();
    
    try {
      const pharmacyId = req.user!.pharmacyId;
      const userId = req.user!.userId;
      const {
        supplier_id, invoice_number, invoice_date, due_date,
        subtotal, discount, taxable_amount,
        cgst_amount, sgst_amount, igst_amount, total_tax,
        round_off, grand_total, paid_amount, balance_amount, payment_status,
        notes, items
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Purchase must contain items' });
      }

      // Check supplier belongs to pharmacy
      const suppResult = await client.query('SELECT id FROM suppliers WHERE id = $1 AND pharmacy_id = $2 AND status = $3', [supplier_id, pharmacyId, 'ACTIVE']);
      if (suppResult.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or inactive supplier' });
      }

      await client.query('BEGIN');

      // Create purchase invoice
      const invResult = await client.query(
        `INSERT INTO purchase_invoices (
          pharmacy_id, supplier_id, invoice_number, invoice_date, due_date,
          subtotal, discount, taxable_amount,
          cgst_amount, sgst_amount, igst_amount, total_tax,
          round_off, grand_total, paid_amount, balance_amount, payment_status,
          notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
        [
          pharmacyId, supplier_id, invoice_number, invoice_date, due_date,
          subtotal, discount, taxable_amount, cgst_amount, sgst_amount, igst_amount, total_tax,
          round_off, grand_total, paid_amount, balance_amount, payment_status, notes, userId
        ]
      );
      
      const invoiceId = invResult.rows[0].id;

      // Process items
      for (const item of items) {
        // Verify medicine belongs to pharmacy
        const medCheck = await client.query('SELECT id FROM medicines WHERE id = $1 AND pharmacy_id = $2', [item.medicine_id, pharmacyId]);
        if (medCheck.rows.length === 0) {
          throw new Error(`Medicine ID ${item.medicine_id} is invalid for this pharmacy`);
        }

        if (item.quantity <= 0 && item.free_quantity <= 0) {
          throw new Error('Quantity must be greater than 0');
        }

        let previousQuantity = 0;
        let batchId;
        
        const batchCheck = await client.query(
          'SELECT id, quantity, available_quantity FROM medicine_batches WHERE medicine_id = $1 AND batch_number = $2 AND pharmacy_id = $3 FOR UPDATE',
          [item.medicine_id, item.batch_number, pharmacyId]
        );

        const totalQty = item.quantity + item.free_quantity;

        if (batchCheck.rows.length > 0) {
          batchId = batchCheck.rows[0].id;
          previousQuantity = batchCheck.rows[0].available_quantity;
          // Update batch stock
          await client.query(
            `UPDATE medicine_batches 
             SET quantity = quantity + $1, 
                 available_quantity = available_quantity + $1,
                 purchase_price = $2,
                 mrp = $3,
                 selling_price = $4,
                 expiry_date = $5
             WHERE id = $6`,
            [totalQty, item.purchase_price, item.mrp, item.selling_price, item.expiry_date, batchId]
          );
        } else {
          // Create new batch
          const newBatch = await client.query(
            `INSERT INTO medicine_batches (
              medicine_id, pharmacy_id, batch_number, expiry_date,
              purchase_price, mrp, selling_price, quantity, available_quantity
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [
              item.medicine_id, pharmacyId, item.batch_number, item.expiry_date,
              item.purchase_price, item.mrp, item.selling_price, totalQty, totalQty
            ]
          );
          batchId = newBatch.rows[0].id;
        }

        // Update medicine current_stock
        await client.query(
          `UPDATE medicines SET current_stock = COALESCE(current_stock, 0) + $1 WHERE id = $2`,
          [totalQty, item.medicine_id]
        );

        // Record stock movement
        await client.query(
          `INSERT INTO stock_movements (
            pharmacy_id, medicine_id, batch_id, movement_type, reference_type, 
            reference_id, quantity, previous_quantity, new_quantity, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            pharmacyId, item.medicine_id, batchId, 'PURCHASE', 'PURCHASE_INVOICE',
            invoiceId, totalQty, previousQuantity, previousQuantity + totalQty, userId
          ]
        );

        // Insert purchase item
        await client.query(
          `INSERT INTO purchase_items (
            purchase_invoice_id, medicine_id, batch_id, batch_number, expiry_date,
            quantity, free_quantity, purchase_price, mrp, selling_price,
            discount, taxable_amount, gst_rate, cgst_amount, sgst_amount, igst_amount, total_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            invoiceId, item.medicine_id, batchId, item.batch_number, item.expiry_date,
            item.quantity, item.free_quantity, item.purchase_price, item.mrp, item.selling_price,
            item.discount, item.taxable_amount, item.gst_rate, item.cgst_amount, item.sgst_amount, item.igst_amount, item.total_amount
          ]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ success: true, data: invResult.rows[0] });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Error creating purchase:', error);
      res.status(400).json({ success: false, message: error.message || 'Server error creating purchase' });
    } finally {
      client.release();
    }
  }

  static async cancelPurchase(req: AuthenticatedRequest, res: Response) {
    // Left empty, or basic soft delete.
    // The prompt says POST /cancel but also says do not implement dangerous logic.
    res.status(501).json({ success: false, message: 'Cancel purchase not fully implemented in Step 2' });
  }

  static async scanBill(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No bill image provided' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, message: 'Gemini API Key is not configured on the server. Please add GEMINI_API_KEY to your backend .env file.' });
      }

      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });

      const imageParts = [
        {
          inlineData: {
            data: req.file.buffer.toString("base64"),
            mimeType: req.file.mimetype
          }
        }
      ];

      const prompt = `Analyze this wholesale medicine invoice/bill image.
Extract the following information and return ONLY a valid JSON object matching this structure exactly (do not wrap in markdown):
{
  "supplier_name": "string or null",
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "items": [
    {
      "medicine_name": "string",
      "batch_number": "string",
      "expiry_date": "YYYY-MM-DD (guess day as 01 if only month/year)",
      "quantity": number (integer),
      "purchase_price": number (float),
      "mrp": number (float)
    }
  ]
}
If any field cannot be found, use null or 0.`;

      let result;
        result = await model.generateContent([prompt, ...imageParts]);
      let text = result.response.text();
      
      // Clean up markdown json formatting if present
      text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      
      let parsedData;
      try {
        parsedData = JSON.parse(text);
      } catch(e) {
        throw new Error('AI returned invalid JSON: ' + text);
      }

      return res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error('AI Scan Error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to scan bill using AI' });
    }
  }
}
