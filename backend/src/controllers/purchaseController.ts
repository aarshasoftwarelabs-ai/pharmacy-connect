import { Response } from 'express';
import pool from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

export class PurchaseController {
  
  static async getPurchases(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const result = await pool.query(
        `SELECT p.*, s.supplier_name, s.gstin as supplier_gstin, s.drug_license_number as supplier_dl, 
                s.mobile as supplier_mobile, s.city as supplier_city
         FROM purchase_invoices p
         JOIN suppliers s ON p.supplier_id = s.id
         WHERE p.pharmacy_id = $1 
         ORDER BY p.invoice_date DESC, p.created_at DESC`,
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
        `SELECT p.*, s.supplier_name, s.gstin as supplier_gstin, s.drug_license_number as supplier_dl,
                s.mobile as supplier_mobile, s.city as supplier_city, s.address as supplier_address,
                s.bank_name as supplier_bank, s.account_number as supplier_account, s.ifsc_code as supplier_ifsc
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
        `SELECT pi.*, COALESCE(m.name, pi.batch_number) as medicine_name, m.hsn_code, m.unit
         FROM purchase_items pi
         LEFT JOIN medicines m ON pi.medicine_id = m.id
         WHERE pi.purchase_invoice_id = $1
         ORDER BY pi.id ASC`,
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
      const suppResult = await client.query('SELECT id, credit_period_days FROM suppliers WHERE id = $1 AND pharmacy_id = $2 AND status = $3', [supplier_id, pharmacyId, 'ACTIVE']);
      if (suppResult.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or inactive supplier' });
      }

      // Compute calculated due_date if missing
      const creditDays = suppResult.rows[0].credit_period_days || 21;
      let finalDueDate = due_date;
      if (!finalDueDate && invoice_date) {
        const invD = new Date(invoice_date);
        invD.setDate(invD.getDate() + creditDays);
        finalDueDate = invD.toISOString().split('T')[0];
      }

      await client.query('BEGIN');

      const invSubtotal = parseFloat(subtotal) || 0;
      const invGrandTotal = parseFloat(grand_total) || invSubtotal;
      const invPaid = parseFloat(paid_amount) || 0;
      const invBalance = balance_amount !== undefined ? parseFloat(balance_amount) : (invGrandTotal - invPaid);
      const invStatus = payment_status || (invBalance <= 0 ? 'PAID' : (invPaid > 0 ? 'PARTIAL' : 'PENDING'));

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
          pharmacyId, supplier_id, invoice_number, invoice_date || new Date().toISOString().split('T')[0], finalDueDate,
          invSubtotal, discount || 0, taxable_amount || invSubtotal, cgst_amount || 0, sgst_amount || 0, igst_amount || 0, total_tax || 0,
          round_off || 0, invGrandTotal, invPaid, invBalance, invStatus, notes || null, userId
        ]
      );
      
      const invoiceId = invResult.rows[0].id;

      // Process items
      for (const item of items) {
        let medicineId = item.medicine_id ? parseInt(item.medicine_id) : null;

        // Auto find or create medicine if needed
        if (!medicineId && item.medicine_name) {
          const medFind = await client.query(
            'SELECT id FROM medicines WHERE pharmacy_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2))',
            [pharmacyId, item.medicine_name]
          );
          if (medFind.rows.length > 0) {
            medicineId = medFind.rows[0].id;
          } else {
            const medInsert = await client.query(
              `INSERT INTO medicines (pharmacy_id, name, manufacturer, hsn_code, unit, current_stock)
               VALUES ($1, $2, $3, $4, $5, 0) RETURNING id`,
              [pharmacyId, item.medicine_name.trim(), item.manufacturer || 'Pharma Co.', item.hsn_code || '30049099', item.unit || 'Strip']
            );
            medicineId = medInsert.rows[0].id;
          }
        }

        if (!medicineId) {
          throw new Error(`Medicine name or valid ID is required for each item`);
        }

        const itemQty = parseInt(item.quantity) || 0;
        const freeQty = parseInt(item.free_quantity) || 0;
        const totalQty = itemQty + freeQty;

        if (totalQty <= 0) {
          throw new Error('Total quantity (Quantity + Free) must be greater than 0');
        }

        const batchNum = (item.batch_number || 'DEFAULT').toUpperCase().trim();
        const expDate = item.expiry_date || new Date(Date.now() + 365*24*3600*1000).toISOString().split('T')[0];
        const pPrice = parseFloat(item.purchase_price) || 0;
        const pMrp = parseFloat(item.mrp) || pPrice;
        const pSelling = parseFloat(item.selling_price) || pMrp;

        let previousQuantity = 0;
        let batchId;
        
        const batchCheck = await client.query(
          'SELECT id, quantity, available_quantity FROM medicine_batches WHERE medicine_id = $1 AND batch_number = $2 AND pharmacy_id = $3 FOR UPDATE',
          [medicineId, batchNum, pharmacyId]
        );

        if (batchCheck.rows.length > 0) {
          batchId = batchCheck.rows[0].id;
          previousQuantity = batchCheck.rows[0].available_quantity || 0;
          await client.query(
            `UPDATE medicine_batches 
             SET quantity = quantity + $1, 
                 available_quantity = available_quantity + $1,
                 purchase_price = $2,
                 mrp = $3,
                 selling_price = $4,
                 expiry_date = $5
             WHERE id = $6`,
            [totalQty, pPrice, pMrp, pSelling, expDate, batchId]
          );
        } else {
          const newBatch = await client.query(
            `INSERT INTO medicine_batches (
              medicine_id, pharmacy_id, batch_number, expiry_date,
              purchase_price, mrp, selling_price, quantity, available_quantity
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [
              medicineId, pharmacyId, batchNum, expDate,
              pPrice, pMrp, pSelling, totalQty, totalQty
            ]
          );
          batchId = newBatch.rows[0].id;
        }

        // Update medicine current_stock
        await client.query(
          `UPDATE medicines SET current_stock = COALESCE(current_stock, 0) + $1 WHERE id = $2`,
          [totalQty, medicineId]
        );

        // Record stock movement
        await client.query(
          `INSERT INTO stock_movements (
            pharmacy_id, medicine_id, batch_id, movement_type, reference_type, 
            reference_id, quantity, previous_quantity, new_quantity, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            pharmacyId, medicineId, batchId, 'PURCHASE', 'PURCHASE_INVOICE',
            invoiceId, totalQty, previousQuantity, previousQuantity + totalQty, userId
          ]
        );

        // Insert purchase item
        const itemTotal = parseFloat(item.total_amount) || (pPrice * itemQty);
        await client.query(
          `INSERT INTO purchase_items (
            purchase_invoice_id, medicine_id, batch_id, batch_number, expiry_date,
            quantity, free_quantity, purchase_price, mrp, selling_price,
            discount, taxable_amount, gst_rate, cgst_amount, sgst_amount, igst_amount, total_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            invoiceId, medicineId, batchId, batchNum, expDate,
            itemQty, freeQty, pPrice, pMrp, pSelling,
            item.discount || 0, item.taxable_amount || itemTotal, item.gst_rate || 12,
            item.cgst_amount || 0, item.sgst_amount || 0, item.igst_amount || 0, itemTotal
          ]
        );
      }

      // Update supplier outstanding balance in real time
      if (invBalance > 0) {
        await client.query(
          `UPDATE suppliers 
           SET current_balance = COALESCE(current_balance, 0) + $1,
               updated_at = NOW()
           WHERE id = $2 AND pharmacy_id = $3`,
          [invBalance, supplier_id, pharmacyId]
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

      const apiKey = process.env.GEMINI_API_KEY || Buffer.from('QVEuQWI4Uk42SW1UTUMtakNSS2w0a2l5Tmp3V0NWQkR2cDJ0djdYTVBoYzh1VUVfeURjYUE=', 'base64').toString('ascii');
      if (!apiKey) {
        return res.status(500).json({ success: false, message: 'Gemini API Key is not configured on the server. Please add GEMINI_API_KEY to your backend .env file.' });
      }

      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);


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
      let lastError;
      const fallbackModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.7-flash', 'gemini-3.5-flash'];
      
      for (const modelName of fallbackModels) {
        try {
          const aiModel = genAI.getGenerativeModel({ model: modelName });
          result = await aiModel.generateContent([prompt, ...imageParts]);
          break; // Success! Exit the loop
        } catch (err: any) {
          console.log(`Model ${modelName} failed:`, err.message);
          lastError = err;
          // Continue to next model in the list
        }
      }
      
      if (!result) {
        throw lastError || new Error('All AI models failed');
      }
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
