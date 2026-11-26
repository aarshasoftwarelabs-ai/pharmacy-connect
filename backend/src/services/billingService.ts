import pool from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { ScheduleH1Service } from './scheduleH1Service';

export interface CreateBillItemDTO {
  medicineName: string;
  quantity: number;
  unitPrice: number;
  medicineId?: number | string;
  batchId?: number;
  barcode?: string;
  hsnCode?: string;
  gstRate?: number;
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  isLooseTablet?: boolean;
  packCount?: number;
  packSize?: string | number;
}

export interface CreateBillDTO {
  medicineRequestId?: number;
  userId?: number;
  pharmacyId: number;
  customerName: string;
  customerPhone?: string;
  patientAddress?: string;
  doctorName?: string;
  doctorRegNo?: string;
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
  paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL' | string;
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
   * Get a single bill by ID (scoped to pharmacyId when provided)
   */
  static async getBillById(billId: number, pharmacyId?: number) {
    const params: any[] = [billId];
    let pharmacyFilter = '';
    if (pharmacyId !== undefined && Number.isInteger(pharmacyId) && pharmacyId > 0) {
      params.push(pharmacyId);
      pharmacyFilter = ' AND b.pharmacy_id = $2';
    }

    const billQuery = `
      SELECT b.id, b.bill_number AS "billNumber", b.medicine_request_id AS "medicineRequestId",
             b.user_id AS "userId", b.pharmacy_id AS "pharmacyId", b.customer_name AS "customerName",
             COALESCE(b.customer_phone, u.phone, mr_u.phone) AS "customerPhone",
             b.doctor_name AS "doctorName", b.bill_type AS "billType",
             b.bill_date AS "billDate", b.subtotal, b.discount, b.total, b.payment_status AS "paymentStatus",
             b.total_taxable_amount AS "totalTaxableAmount", b.total_cgst AS "totalCgst", 
             b.total_sgst AS "totalSgst", b.total_igst AS "totalIgst", b.total_gst AS "totalGst",
             b.created_at AS "createdAt"
      FROM bills b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN medicine_requests mr ON b.medicine_request_id = mr.id
      LEFT JOIN users mr_u ON mr.user_id = mr_u.id
      WHERE b.id = $1${pharmacyFilter}
    `;
    const billResult = await pool.query(billQuery, params);
    
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
             COALESCE(b.customer_phone, u.phone, mr_u.phone) AS "customerPhone",
             b.doctor_name AS "doctorName", b.bill_type AS "billType",
             b.bill_date AS "billDate", b.subtotal, b.discount, b.total, b.payment_status AS "paymentStatus",
             b.total_taxable_amount AS "totalTaxableAmount", b.total_cgst AS "totalCgst",
             b.total_sgst AS "totalSgst", b.total_gst AS "totalGst",
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
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN medicine_requests mr ON b.medicine_request_id = mr.id
      LEFT JOIN users mr_u ON mr.user_id = mr_u.id
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

      // 2. Generate a collision-safe unique bill number (PC-YYYY-XXXXXX)
      const year = new Date().getFullYear();
      const maxSeqQuery = await client.query(
        `SELECT COALESCE(MAX(SPLIT_PART(bill_number, '-', 3)::INTEGER), 0) AS max_num
         FROM bills
         WHERE bill_number ~ $1`,
        [`^PC-${year}-[0-9]+$`]
      );
      const nextNum = parseInt(maxSeqQuery.rows[0].max_num, 10) + 1;
      const billNumber = `PC-${year}-${nextNum.toString().padStart(6, '0')}`;

      // 2.5 Link or Create Customer Profile & Resolve Phone
      let resolvedCustomerPhone = data.customerPhone;
      if (!resolvedCustomerPhone) {
        if (data.userId) {
          const uRes = await client.query('SELECT phone FROM users WHERE id = $1', [data.userId]);
          if (uRes.rows.length > 0) resolvedCustomerPhone = uRes.rows[0].phone;
        } else if (data.medicineRequestId) {
          const reqRes = await client.query('SELECT u.phone FROM medicine_requests mr JOIN users u ON mr.user_id = u.id WHERE mr.id = $1', [data.medicineRequestId]);
          if (reqRes.rows.length > 0) resolvedCustomerPhone = reqRes.rows[0].phone;
        }
      }

      let customerProfileId: number | null = null;
      if (data.userId || resolvedCustomerPhone) {
        let profileResult;
        if (data.userId) {
          profileResult = await client.query('SELECT id FROM customer_profiles WHERE pharmacy_id = $1 AND user_id = $2', [data.pharmacyId, data.userId]);
        } else {
          profileResult = await client.query('SELECT id FROM customer_profiles WHERE pharmacy_id = $1 AND phone = $2 AND user_id IS NULL', [data.pharmacyId, resolvedCustomerPhone]);
        }

        if (profileResult.rows.length > 0) {
          customerProfileId = profileResult.rows[0].id;
        } else {
          // Create profile
          const insertProfileRes = await client.query(`
            INSERT INTO customer_profiles (pharmacy_id, user_id, display_name, phone)
            VALUES ($1, $2, $3, $4) RETURNING id
          `, [data.pharmacyId, data.userId || null, data.customerName, resolvedCustomerPhone || null]);
          customerProfileId = insertProfileRes.rows[0].id;
        }
      }

      const paymentStatus = data.paymentStatus || (billType === 'OFFLINE' ? 'PAID' : 'UNPAID');

      // 3. Insert into bills
      const insertBillQuery = `
        INSERT INTO bills (bill_number, medicine_request_id, user_id, pharmacy_id, customer_name, customer_phone, bill_type, subtotal, discount, total, total_taxable_amount, total_cgst, total_sgst, total_igst, total_gst, payment_status, total_profit, customer_profile_id, doctor_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 0, $17, $18)
        RETURNING id
      `;
      const billValues = [
        billNumber, 
        data.medicineRequestId || null, 
        data.userId || null, 
        data.pharmacyId, 
        data.customerName, 
        resolvedCustomerPhone || null,
        billType,
        data.subtotal, 
        data.discount, 
        data.total,
        data.totalTaxableAmount || 0,
        data.totalCgst || 0,
        data.totalSgst || 0,
        data.totalIgst || 0,
        data.totalGst || 0,
        paymentStatus,
        customerProfileId,
        data.doctorName ? data.doctorName.trim() : null
      ];
      const newBill = await client.query(insertBillQuery, billValues);
      const newBillId = newBill.rows[0].id;

      // 4. Insert items and calculate profit
      let totalBillProfit = 0;
      for (const item of data.items) {
        const lineTotal = item.quantity * item.unitPrice;
        
        // Fetch current purchase price and stock from DB (by ID, Barcode, or Name)
        const medIdParam = item.medicineId ? String(item.medicineId) : '';
        const barcodeParam = item.barcode ? String(item.barcode).trim() : '';
        const baseMedicineName = item.medicineName.replace(/\s*\(Loose\s+\d+\s+Tabs?\)$/i, '').trim();
        
        let medResult = await client.query(
          `SELECT id, purchase_price, current_stock, COALESCE(loose_tablets, 0) AS loose_tablets, selling_price, barcode 
           FROM medicines 
           WHERE pharmacy_id = $1 AND (
             (id::text = $2) OR
             ($3 <> '' AND barcode = $3) OR
             (LOWER(TRIM(name)) = LOWER(TRIM($4))) OR
             (LOWER(TRIM(name)) = LOWER(TRIM($5)))
           ) 
           FOR UPDATE 
           LIMIT 1`,
          [data.pharmacyId, medIdParam, barcodeParam, item.medicineName, baseMedicineName]
        );

        let medId: number;
        let currentStock = 0;
        let looseTabletsAvailable = 0;
        let purchasePrice = 0;

        if (medResult.rows.length === 0) {
          // If the medicine doesn't exist in pharmacy catalogue yet, register it at 0 stock (do not fabricate phantom 10-strip stock)
          const autoInsert = await client.query(
            `INSERT INTO medicines (
               pharmacy_id, name, generic_name, category, selling_price, mrp, current_stock, loose_tablets, minimum_stock, barcode, hsn_code, gst_rate
             ) VALUES ($1, $2, 'General Formulation', 'Tablets', $3, $3, 0, 0, 5, $4, $5, $6)
             RETURNING id, current_stock, purchase_price`,
            [
              data.pharmacyId, 
              item.medicineName, 
              item.unitPrice, 
              barcodeParam || null, 
              item.hsnCode || '30049099', 
              item.gstRate || 5
            ]
          );
          medId = autoInsert.rows[0].id;
          currentStock = 0;
          looseTabletsAvailable = 0;
          purchasePrice = Math.round(item.unitPrice * 0.75 * 100) / 100;
        } else {
          medId = medResult.rows[0].id;
          currentStock = Number(medResult.rows[0].current_stock || 0);
          looseTabletsAvailable = Number(medResult.rows[0].loose_tablets || 0);
          purchasePrice = medResult.rows[0].purchase_price 
            ? parseFloat(medResult.rows[0].purchase_price) 
            : Math.round(item.unitPrice * 0.75 * 100) / 100;
        }

        // Exact Strip + Loose-Tablet remainder accounting (avoids losing 1 full strip on every small loose sale)
        const isLoose = item.isLooseTablet || (item.unitPrice < purchasePrice && purchasePrice > 0);
        let effectivePurchasePrice = purchasePrice;
        let deductStripUnits = item.quantity;
        let newLooseTablets = looseTabletsAvailable;
        if (isLoose) {
          const packCount = Number(item.packCount || item.packSize) || 10;
          effectivePurchasePrice = Math.round((purchasePrice / packCount) * 100) / 100;
          if (looseTabletsAvailable >= item.quantity) {
            deductStripUnits = 0;
            newLooseTablets = looseTabletsAvailable - item.quantity;
          } else {
            const remainingTabsNeeded = item.quantity - looseTabletsAvailable;
            const stripsToOpen = Math.ceil(remainingTabsNeeded / packCount);
            deductStripUnits = stripsToOpen;
            newLooseTablets = (looseTabletsAvailable + stripsToOpen * packCount) - item.quantity;
          }
        }

        const itemProfit = (item.unitPrice - effectivePurchasePrice) * item.quantity;
        totalBillProfit += itemProfit;

        const insertItemQuery = `
          INSERT INTO bill_items (bill_id, medicine_name, quantity, unit_price, line_total, hsn_code, gst_rate, taxable_amount, cgst, sgst, igst, purchase_price, profit)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id
        `;
        const billItemRes = await client.query(insertItemQuery, [
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
          effectivePurchasePrice,
          itemProfit
        ]);
        const billItemId = billItemRes.rows[0].id;

        // FEFO Batch Deduction
        let remainingToDeduct = deductStripUnits;
        
        // Find valid batches ordered by optional explicit batchId first, then FEFO expiry date
        const batchResult = await client.query(`
          SELECT id, available_quantity, batch_number 
          FROM medicine_batches 
          WHERE medicine_id = $1 AND pharmacy_id = $2 
            AND available_quantity > 0 
            AND expiry_date >= CURRENT_DATE 
          ORDER BY (CASE WHEN $3::int IS NOT NULL AND id = $3::int THEN 0 ELSE 1 END) ASC, expiry_date ASC FOR UPDATE`,
          [medId, data.pharmacyId, item.batchId ? Number(item.batchId) : null]
        );

        for (const batch of batchResult.rows) {
            if (remainingToDeduct <= 0) break;

            const deductQty = Math.min(batch.available_quantity, remainingToDeduct);
            
            // Deduct from batch
            await client.query(
                `UPDATE medicine_batches SET available_quantity = available_quantity - $1 WHERE id = $2`,
                [deductQty, batch.id]
            );

            // Record in bill_item_batches
            await client.query(
                `INSERT INTO bill_item_batches (bill_item_id, batch_id, quantity) VALUES ($1, $2, $3)`,
                [billItemId, batch.id, deductQty]
            );

            // Create stock movement
            await client.query(
                `INSERT INTO stock_movements (
                    pharmacy_id, medicine_id, batch_id, movement_type, reference_type, 
                    reference_id, quantity, previous_quantity, new_quantity, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    data.pharmacyId, medId, batch.id, 'SALE', 'BILL',
                    newBillId, -deductQty, batch.available_quantity, batch.available_quantity - deductQty, data.userId || null
                ]
            );

            remainingToDeduct -= deductQty;
        }

        // Automatic Schedule H1 Statutory Register Entry (FDCA Inspection Compliance)
        try {
          const medInfoRes = await client.query(
            `SELECT generic_name, is_schedule_h1 FROM medicines WHERE id = $1`,
            [medId]
          );
          const genericName = medInfoRes.rows[0]?.generic_name;
          const isH1Flag = medInfoRes.rows[0]?.is_schedule_h1;

          if (ScheduleH1Service.isScheduleH1Drug(item.medicineName, genericName, isH1Flag)) {
            const chosenBatch = (batchResult.rows.length > 0 && batchResult.rows[0].batch_number) 
                ? batchResult.rows[0].batch_number 
                : 'DEFAULT';
            
            await client.query(`
              INSERT INTO schedule_h1_register (
                pharmacy_id, bill_id, bill_number, supply_date,
                patient_name, patient_phone, patient_address,
                doctor_name, doctor_reg_no,
                medicine_id, medicine_name, generic_name,
                batch_number, quantity, unit
              ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            `, [
              data.pharmacyId,
              newBillId,
              billNumber,
              (data.customerName || 'Walk-in Patient').trim(),
              resolvedCustomerPhone || null,
              data.patientAddress ? data.patientAddress.trim() : null,
              (data.doctorName || 'Dr. Registered Medical Practitioner').trim(),
              data.doctorRegNo ? data.doctorRegNo.trim() : null,
              medId,
              item.medicineName.trim(),
              genericName || 'Schedule H1 Substance',
              chosenBatch,
              item.quantity,
              item.isLooseTablet ? 'Tablet' : 'Strip'
            ]);
          }
        } catch (h1LogErr) {
          console.warn('⚠️ Schedule H1 auto-log notice:', h1LogErr);
        }

        if (remainingToDeduct > 0 && currentStock > 0) {
            // Handle only genuine positive unbatched opening stock (do not fabricate 2099 batches for zero-stock items)
            const legacyBatchRes = await client.query(
                `SELECT id, available_quantity FROM medicine_batches 
                 WHERE medicine_id = $1 AND batch_number = 'LEGACY-OPENING-STOCK' AND pharmacy_id = $2 FOR UPDATE`,
                 [medId, data.pharmacyId]
            );
            
            let legacyBatchId;
            let legacyPrevQty = 0;
            
            const legacyDeduct = Math.min(remainingToDeduct, currentStock);
            if (legacyBatchRes.rows.length > 0) {
                legacyBatchId = legacyBatchRes.rows[0].id;
                legacyPrevQty = legacyBatchRes.rows[0].available_quantity;
                await client.query(`UPDATE medicine_batches SET available_quantity = GREATEST(available_quantity - $1, 0) WHERE id = $2`, [legacyDeduct, legacyBatchId]);
            } else {
                const newLegacy = await client.query(
                    `INSERT INTO medicine_batches (medicine_id, pharmacy_id, batch_number, expiry_date, quantity, available_quantity) 
                     VALUES ($1, $2, 'LEGACY-OPENING-STOCK', '2099-12-31', $3, $4) RETURNING id`,
                     [medId, data.pharmacyId, currentStock, Math.max(0, currentStock - legacyDeduct)]
                );
                legacyBatchId = newLegacy.rows[0].id;
                legacyPrevQty = currentStock;
            }
            
            // Record in bill_item_batches
            await client.query(
                `INSERT INTO bill_item_batches (bill_item_id, batch_id, quantity) VALUES ($1, $2, $3)`,
                [billItemId, legacyBatchId, legacyDeduct]
            );

            // Create stock movement
            await client.query(
                `INSERT INTO stock_movements (
                    pharmacy_id, medicine_id, batch_id, movement_type, reference_type, 
                    reference_id, quantity, previous_quantity, new_quantity, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    data.pharmacyId, medId, legacyBatchId, 'SALE', 'BILL',
                    newBillId, -legacyDeduct, legacyPrevQty, Math.max(0, legacyPrevQty - legacyDeduct), data.userId || null
                ]
            );
            
            remainingToDeduct = 0;
        }

        // Deduct medicine current_stock (strip units) and persist remaining loose tablets
        const updateStockQuery = `
          UPDATE medicines
          SET current_stock = GREATEST(current_stock - $1, 0),
              loose_tablets = $2
          WHERE id = $3 AND pharmacy_id = $4
        `;
        await client.query(updateStockQuery, [deductStripUnits, newLooseTablets, medId, data.pharmacyId]);

        if (isLoose && deductStripUnits === 0) {
          await client.query(
            `INSERT INTO stock_movements (
               pharmacy_id, medicine_id, batch_id, movement_type, reference_type,
               reference_id, quantity, previous_quantity, new_quantity, created_by
             ) VALUES ($1, $2, NULL, 'SALE_LOOSE', 'BILL', $3, $4, $5, $6, $7)`,
            [data.pharmacyId, medId, newBillId, -item.quantity, looseTabletsAvailable, newLooseTablets, data.userId || null]
          );
        }
      }

      // 5. Update total_profit on the bill
      // Adjust profit to subtract overall discount if applicable. We can just subtract discount from total profit.
      totalBillProfit = totalBillProfit - (data.discount || 0);
      
      await client.query('UPDATE bills SET total_profit = $1 WHERE id = $2', [totalBillProfit, newBillId]);

      await client.query('COMMIT');
      
      return this.getBillById(newBillId, data.pharmacyId);
    } catch (error: any) {
      await client.query('ROLLBACK');
      const apiError = new Error(error.message || 'Failed to create bill') as ApiError;
      apiError.statusCode = 400;
      throw apiError;
    } finally {
      client.release();
    }
  }

  /**
   * Assign staff member to delivery & track cash collection
   */
  static async updateDeliveryAssignment(billId: number, data: {
    deliveryStaffId?: number | null;
    deliveryStatus?: string;
    cashCollectionStatus?: string;
    cashCollectedAmount?: number;
    deliveryNotes?: string;
  }, pharmacyId?: number) {
    const checkParams: any[] = [billId];
    let checkScope = '';
    if (pharmacyId !== undefined && Number.isInteger(pharmacyId) && pharmacyId > 0) {
      checkParams.push(pharmacyId);
      checkScope = ' AND pharmacy_id = $2';
    }
    const billCheck = await pool.query(`SELECT id, total, payment_status FROM bills WHERE id = $1${checkScope}`, checkParams);
    if (billCheck.rows.length === 0) {
      const error = new Error('Bill not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    const currentBill = billCheck.rows[0];
    const deliveryStatus = data.deliveryStatus || 'DIRECT_PICKUP';
    const cashCollectionStatus = data.cashCollectionStatus || (currentBill.payment_status === 'PAID' ? 'PAID' : 'COD_PENDING');
    const cashCollectedAmount = data.cashCollectedAmount !== undefined 
      ? data.cashCollectedAmount 
      : ((cashCollectionStatus === 'COLLECTED' || cashCollectionStatus === 'SETTLED') ? currentBill.total : 0);

    let assignedAtClause = '';
    if (data.deliveryStaffId) {
      assignedAtClause = ', assigned_at = COALESCE(assigned_at, CURRENT_TIMESTAMP)';
    }

    let deliveredAtClause = '';
    if (deliveryStatus === 'DELIVERED') {
      deliveredAtClause = ', delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP)';
    }

    let paymentStatusClause = '';
    if (cashCollectionStatus === 'COLLECTED' || cashCollectionStatus === 'SETTLED') {
      paymentStatusClause = ", payment_status = 'PAID'";
    }

    const updateParams: any[] = [
      data.deliveryStaffId !== undefined ? data.deliveryStaffId : null,
      deliveryStatus,
      cashCollectionStatus,
      cashCollectedAmount,
      data.deliveryNotes || null,
      billId
    ];
    let updateScope = '';
    if (pharmacyId !== undefined && Number.isInteger(pharmacyId) && pharmacyId > 0) {
      updateParams.push(pharmacyId);
      updateScope = ' AND pharmacy_id = $7';
    }

    const query = `
      UPDATE bills
      SET delivery_staff_id = $1,
          delivery_status = $2,
          cash_collection_status = $3,
          cash_collected_amount = $4,
          delivery_notes = COALESCE($5, delivery_notes)
          ${assignedAtClause}
          ${deliveredAtClause}
          ${paymentStatusClause}
      WHERE id = $6${updateScope}
    `;

    await pool.query(query, updateParams);

    return this.getBillById(billId, pharmacyId);
  }

  /**
   * Cancel / return a finalized bill and restore deducted batch + medicine stock
   */
  static async cancelBill(billId: number, pharmacyId?: number, reason?: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const params: any[] = [billId];
      let scope = '';
      if (pharmacyId !== undefined && Number.isInteger(pharmacyId) && pharmacyId > 0) {
        params.push(pharmacyId);
        scope = ' AND pharmacy_id = $2';
      }

      const billRes = await client.query(
        `SELECT id, pharmacy_id, payment_status, user_id FROM bills WHERE id = $1${scope} FOR UPDATE`,
        params
      );
      if (billRes.rows.length === 0) {
        const error = new Error('Bill not found') as ApiError;
        error.statusCode = 404;
        throw error;
      }

      const bill = billRes.rows[0];
      if ((bill.payment_status || '').toUpperCase() === 'CANCELLED') {
        const error = new Error('Bill is already cancelled/returned') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      // Restore deducted quantities per batch & medicine
      const batchDeductions = await client.query(
        `SELECT bib.batch_id, bib.quantity, mb.medicine_id, mb.available_quantity
         FROM bill_item_batches bib
         JOIN bill_items bi ON bib.bill_item_id = bi.id
         JOIN medicine_batches mb ON bib.batch_id = mb.id
         WHERE bi.bill_id = $1 FOR UPDATE OF mb`,
        [billId]
      );

      const medicineTotals = new Map<number, number>();
      for (const row of batchDeductions.rows) {
        const qty = Number(row.quantity || 0);
        if (qty <= 0) continue;

        const prevQty = Number(row.available_quantity || 0);
        await client.query(
          `UPDATE medicine_batches SET available_quantity = available_quantity + $1 WHERE id = $2`,
          [qty, row.batch_id]
        );
        await client.query(
          `INSERT INTO stock_movements (
             pharmacy_id, medicine_id, batch_id, movement_type, reference_type,
             reference_id, quantity, previous_quantity, new_quantity, created_by
           ) VALUES ($1, $2, $3, 'RETURN', 'BILL_CANCEL', $4, $5, $6, $7, $8)`,
          [bill.pharmacy_id, row.medicine_id, row.batch_id, billId, qty, prevQty, prevQty + qty, bill.user_id || null]
        );

        medicineTotals.set(row.medicine_id, (medicineTotals.get(row.medicine_id) || 0) + qty);
      }

      for (const [medId, totalRestore] of medicineTotals.entries()) {
        await client.query(
          `UPDATE medicines SET current_stock = COALESCE(current_stock, 0) + $1 WHERE id = $2 AND pharmacy_id = $3`,
          [totalRestore, medId, bill.pharmacy_id]
        );
      }

      // Restore loose tablet sales that were served from already-open strips (SALE_LOOSE)
      const looseMovements = await client.query(
        `SELECT medicine_id, ABS(quantity)::int AS qty
         FROM stock_movements
         WHERE pharmacy_id = $1 AND reference_type = 'BILL' AND reference_id = $2 AND movement_type = 'SALE_LOOSE'`,
        [bill.pharmacy_id, billId]
      );
      for (const lm of looseMovements.rows) {
        const restoreTabs = Number(lm.qty || 0);
        if (restoreTabs <= 0) continue;
        const medUpd = await client.query(
          `UPDATE medicines
           SET loose_tablets = COALESCE(loose_tablets, 0) + $1
           WHERE id = $2 AND pharmacy_id = $3
           RETURNING loose_tablets`,
          [restoreTabs, lm.medicine_id, bill.pharmacy_id]
        );
        const updatedLoose = Number(medUpd.rows[0]?.loose_tablets || restoreTabs);
        await client.query(
          `INSERT INTO stock_movements (
             pharmacy_id, medicine_id, batch_id, movement_type, reference_type,
             reference_id, quantity, previous_quantity, new_quantity, created_by
           ) VALUES ($1, $2, NULL, 'RETURN_LOOSE', 'BILL_CANCEL', $3, $4, $5, $6, $7)`,
          [bill.pharmacy_id, lm.medicine_id, billId, restoreTabs, Math.max(0, updatedLoose - restoreTabs), updatedLoose, bill.user_id || null]
        );
      }

      await client.query(
        `UPDATE bills
         SET payment_status = 'CANCELLED',
             total_profit = 0,
             delivery_notes = CASE WHEN $2 IS NOT NULL AND $2 <> '' THEN $2 ELSE delivery_notes END
         WHERE id = $1`,
        [billId, reason ? `Return/Cancel: ${reason}` : null]
      );

      await client.query('COMMIT');
      return this.getBillById(billId, bill.pharmacy_id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mark an unpaid/credit counter bill as PAID
   */
  static async markBillPaid(billId: number, pharmacyId?: number) {
    const params: any[] = [billId];
    let scope = '';
    if (pharmacyId !== undefined && Number.isInteger(pharmacyId) && pharmacyId > 0) {
      params.push(pharmacyId);
      scope = ' AND pharmacy_id = $2';
    }

    const billRes = await pool.query(`SELECT id, payment_status, pharmacy_id FROM bills WHERE id = $1${scope}`, params);
    if (billRes.rows.length === 0) {
      const error = new Error('Bill not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }
    if ((billRes.rows[0].payment_status || '').toUpperCase() === 'CANCELLED') {
      const error = new Error('Cannot mark a cancelled bill as PAID') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    await pool.query(`UPDATE bills SET payment_status = 'PAID' WHERE id = $1${scope}`, params);
    return this.getBillById(billId, billRes.rows[0].pharmacy_id);
  }
}
