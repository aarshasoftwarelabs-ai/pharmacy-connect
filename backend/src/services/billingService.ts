import pool from '../config/database';
import { ApiError } from '../middleware/errorHandler';

export interface CreateBillItemDTO {
  medicineName: string;
  quantity: number;
  unitPrice: number;
  hsnCode?: string;
  gstRate?: number;
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
}

export interface CreateBillDTO {
  medicineRequestId?: number;
  userId?: number;
  pharmacyId: number;
  customerName: string;
  customerPhone?: string;
  subtotal: number;
  discount: number;
  total: number;
  totalTaxableAmount?: number;
  totalCgst?: number;
  totalSgst?: number;
  totalIgst?: number;
  totalGst?: number;
  items: CreateBillItemDTO[];
  billType?: 'ONLINE' | 'OFFLINE';
}

export class BillingService {
  /**
   * Get confirmed requests that don't have a bill yet (Billing Queue)
   */
  static async getBillingQueue(pharmacyId: number) {
    const query = `
      SELECT mr.id, mr.user_id AS "userId", mr.pharmacy_id AS "pharmacyId", 
             mr.medicine_name AS "medicineName", mr.customer_confirmation AS "customerConfirmation",
             mr.confirmed_at AS "confirmedAt",
             u.name AS "customerName", u.phone AS "customerPhone"
      FROM medicine_requests mr
      JOIN users u ON mr.user_id = u.id
      LEFT JOIN bills b ON mr.id = b.medicine_request_id
      WHERE mr.pharmacy_id = $1 
        AND mr.customer_confirmation = 'CONFIRMED'
        AND b.id IS NULL
      ORDER BY mr.confirmed_at ASC
    `;
    const result = await pool.query(query, [pharmacyId]);
    return result.rows;
  }

  /**
   * Get a single bill by ID
   */
  static async getBillById(billId: number) {
    const billQuery = `
      SELECT id, bill_number AS "billNumber", medicine_request_id AS "medicineRequestId",
             user_id AS "userId", pharmacy_id AS "pharmacyId", customer_name AS "customerName",
             customer_phone AS "customerPhone", bill_type AS "billType",
             bill_date AS "billDate", subtotal, discount, total, payment_status AS "paymentStatus",
             total_taxable_amount AS "totalTaxableAmount", total_cgst AS "totalCgst", 
             total_sgst AS "totalSgst", total_igst AS "totalIgst", total_gst AS "totalGst",
             created_at AS "createdAt"
      FROM bills
      WHERE id = $1
    `;
    const billResult = await pool.query(billQuery, [billId]);
    
    if (billResult.rows.length === 0) {
      const error = new Error('Bill not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }
    
    const bill = billResult.rows[0];

    const itemsQuery = `
      SELECT id, medicine_name AS "medicineName", quantity, unit_price AS "unitPrice", line_total AS "lineTotal",
             hsn_code AS "hsnCode", gst_rate AS "gstRate", taxable_amount AS "taxableAmount",
             cgst, sgst, igst
      FROM bill_items
      WHERE bill_id = $1
    `;
    const itemsResult = await pool.query(itemsQuery, [billId]);
    
    return {
      ...bill,
      items: itemsResult.rows
    };
  }

  /**
   * Get all bills for a pharmacy
   */
  static async getPharmacyBills(pharmacyId: number) {
    const query = `
      SELECT b.id, b.bill_number AS "billNumber", b.medicine_request_id AS "medicineRequestId",
             b.user_id AS "userId", b.pharmacy_id AS "pharmacyId", b.customer_name AS "customerName",
             b.customer_phone AS "customerPhone", b.bill_type AS "billType",
             b.bill_date AS "billDate", b.subtotal, b.discount, b.total, b.payment_status AS "paymentStatus",
             b.created_at AS "createdAt",
             (
               SELECT COALESCE(json_agg(
                 json_build_object(
                   'id', bi.id,
                   'medicineName', bi.medicine_name,
                   'quantity', bi.quantity,
                   'unitPrice', bi.unit_price,
                   'lineTotal', bi.line_total,
                   'hsnCode', bi.hsn_code,
                   'gstRate', bi.gst_rate,
                   'taxableAmount', bi.taxable_amount,
                   'cgst', bi.cgst,
                   'sgst', bi.sgst,
                   'igst', bi.igst
                 )
               ), '[]'::json)
               FROM bill_items bi
               WHERE bi.bill_id = b.id
             ) as items,
             b.total_taxable_amount AS "totalTaxableAmount", b.total_cgst AS "totalCgst", b.total_sgst AS "totalSgst", b.total_igst AS "totalIgst", b.total_gst AS "totalGst"
      FROM bills b
      WHERE b.pharmacy_id = $1
      ORDER BY b.created_at DESC
    `;
    const result = await pool.query(query, [pharmacyId]);
    return result.rows;
  }

  /**
   * Create a new bill
   */
  static async createBill(data: CreateBillDTO) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const isOffline = !data.medicineRequestId;
      const billType = data.billType || (isOffline ? 'OFFLINE' : 'ONLINE');

      if (!isOffline) {
        // 1. Verify request is CONFIRMED and has no existing bill
        const reqQuery = `SELECT customer_confirmation FROM medicine_requests WHERE id = $1 AND pharmacy_id = $2 FOR UPDATE`;
        const reqResult = await client.query(reqQuery, [data.medicineRequestId, data.pharmacyId]);
        
        if (reqResult.rows.length === 0) {
          throw new Error('Medicine request not found or does not belong to this pharmacy');
        }
        
        if (reqResult.rows[0].customer_confirmation !== 'CONFIRMED') {
          throw new Error('Cannot create a bill for a request that is not CONFIRMED');
        }

        // Check if bill exists
        const existingBill = await client.query(`SELECT id FROM bills WHERE medicine_request_id = $1`, [data.medicineRequestId]);
        if (existingBill.rows.length > 0) {
          throw new Error('A bill already exists for this medicine request');
        }
      }

      // 2. Generate a unique bill number (PC-YYYY-XXXXXX)
      const year = new Date().getFullYear();
      const countQuery = await client.query(`SELECT COUNT(*) FROM bills WHERE EXTRACT(YEAR FROM created_at) = $1`, [year]);
      const nextNum = parseInt(countQuery.rows[0].count, 10) + 1;
      const billNumber = `PC-${year}-${nextNum.toString().padStart(6, '0')}`;

      // 3. Insert into bills
      const insertBillQuery = `
        INSERT INTO bills (bill_number, medicine_request_id, user_id, pharmacy_id, customer_name, customer_phone, bill_type, subtotal, discount, total, total_taxable_amount, total_cgst, total_sgst, total_igst, total_gst, payment_status, total_profit)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'UNPAID', 0)
        RETURNING id
      `;
      const billValues = [
        billNumber, 
        data.medicineRequestId || null, 
        data.userId || null, 
        data.pharmacyId, 
        data.customerName, 
        data.customerPhone || null,
        billType,
        data.subtotal, 
        data.discount, 
        data.total,
        data.totalTaxableAmount || 0,
        data.totalCgst || 0,
        data.totalSgst || 0,
        data.totalIgst || 0,
        data.totalGst || 0
      ];
      const newBill = await client.query(insertBillQuery, billValues);
      const newBillId = newBill.rows[0].id;

      // 4. Insert items and calculate profit
      let totalBillProfit = 0;
      for (const item of data.items) {
        const lineTotal = item.quantity * item.unitPrice;
        
        // Fetch current purchase price from DB
        const medResult = await client.query('SELECT purchase_price FROM medicines WHERE name = $1 AND pharmacy_id = $2', [item.medicineName, data.pharmacyId]);
        let purchasePrice = 0;
        if (medResult.rows.length > 0 && medResult.rows[0].purchase_price) {
          purchasePrice = parseFloat(medResult.rows[0].purchase_price);
        }
        const itemProfit = (item.unitPrice - purchasePrice) * item.quantity;
        totalBillProfit += itemProfit;

        const insertItemQuery = `
          INSERT INTO bill_items (bill_id, medicine_name, quantity, unit_price, line_total, hsn_code, gst_rate, taxable_amount, cgst, sgst, igst, purchase_price, profit)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `;
        await client.query(insertItemQuery, [
          newBillId, 
          item.medicineName, 
          item.quantity, 
          item.unitPrice, 
          lineTotal,
          item.hsnCode || null,
          item.gstRate || 0,
          item.taxableAmount || 0,
          item.cgst || 0,
          item.sgst || 0,
          item.igst || 0,
          purchasePrice,
          itemProfit
        ]);

        // Deduct stock if it's a known medicine
        const updateStockQuery = `
          UPDATE medicines
          SET stock = GREATEST(stock - $1, 0)
          WHERE name = $2 AND pharmacy_id = $3
        `;
        await client.query(updateStockQuery, [item.quantity, item.medicineName, data.pharmacyId]);
      }

      // 5. Update total_profit on the bill
      // Adjust profit to subtract overall discount if applicable. We can just subtract discount from total profit.
      totalBillProfit = totalBillProfit - (data.discount || 0);
      
      await client.query('UPDATE bills SET total_profit = $1 WHERE id = $2', [totalBillProfit, newBillId]);

      await client.query('COMMIT');
      
      return this.getBillById(newBillId);
    } catch (error: any) {
      await client.query('ROLLBACK');
      const apiError = new Error(error.message || 'Failed to create bill') as ApiError;
      apiError.statusCode = 400;
      throw apiError;
    } finally {
      client.release();
    }
  }
}
