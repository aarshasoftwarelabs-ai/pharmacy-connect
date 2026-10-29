import pool from '../config/database';
import { ApiError } from '../middleware/errorHandler';

export interface ReportDateRange {
  startDate?: string;
  endDate?: string;
}

const buildDateFilter = (pharmacyId: number, dateColumn: string, params: ReportDateRange, values: any[], pharmacyColumn = 'pharmacy_id') => {
  let query = ` ${pharmacyColumn} = $1 `;
  values.push(pharmacyId);
  
  if (params.startDate) {
    query += ` AND ${dateColumn} >= $${values.length + 1} `;
    // Set to start of day in IST (UTC+5:30)
    values.push(`${params.startDate}T00:00:00+05:30`);
  }
  
  if (params.endDate) {
    query += ` AND ${dateColumn} <= $${values.length + 1} `;
    // Set to end of day in IST (UTC+5:30)
    values.push(`${params.endDate}T23:59:59.999+05:30`);
  }
  
  return query;
};

export class ReportService {
  /**
   * 1. SALES REPORT
   */
  static async getSalesReport(pharmacyId: number, params: ReportDateRange) {
    const values: any[] = [];
    const dateFilter = buildDateFilter(pharmacyId, 'bill_date', params, values);
    
    const query = `
      SELECT 
        COUNT(id) as "totalBills",
        COALESCE(SUM(total), 0) as "netSales",
        COALESCE(SUM(discount), 0) as "totalDiscount",
        COALESCE(SUM(subtotal), 0) as "totalSales",
        COALESCE(SUM(total_profit), 0) as "netProfit"
      FROM bills
      WHERE ${dateFilter} AND payment_status != 'CANCELLED'
    `;
    
    const result = await pool.query(query, values);
    const row = result.rows[0];
    const totalBills = parseInt(row.totalBills, 10);
    const netSales = parseFloat(row.netSales);
    const netProfit = parseFloat(row.netProfit);
    const averageBillValue = totalBills > 0 ? netSales / totalBills : 0;
    
    return {
      totalSales: parseFloat(row.totalSales),
      totalDiscount: parseFloat(row.totalDiscount),
      netSales,
      netProfit,
      totalBills,
      averageBillValue
    };
  }

  /**
   * 2. BILLING REPORT
   */
  static async getBillingReport(pharmacyId: number, params: ReportDateRange & { search?: string }) {
    const values: any[] = [];
    let filter = buildDateFilter(pharmacyId, 'bill_date', params, values);
    
    if (params.search) {
      filter += ` AND (bill_number ILIKE $${values.length + 1} OR customer_name ILIKE $${values.length + 1}) `;
      values.push(`%${params.search}%`);
    }
    
    const query = `
      SELECT id, bill_number as "billNumber", customer_name as "customerName", 
             bill_date as "billDate", subtotal, discount, total, payment_status as "paymentStatus",
             bill_type as "billType", total_profit as "totalProfit"
      FROM bills
      WHERE ${filter}
      ORDER BY bill_date DESC
    `;
    
    const result = await pool.query(query, values);
    return result.rows.map(row => ({
      ...row,
      subtotal: parseFloat(row.subtotal),
      discount: parseFloat(row.discount),
      total: parseFloat(row.total),
      totalProfit: parseFloat(row.totalProfit)
    }));
  }

  /**
   * 3. MEDICINE SALES REPORT
   */
  static async getMedicineSalesReport(pharmacyId: number, params: ReportDateRange & { search?: string, sortBy?: 'quantity' | 'sales' }) {
    const values: any[] = [];
    // Note: bill_items doesn't have pharmacy_id, so we join with bills
    let filter = `b.pharmacy_id = $1`;
    values.push(pharmacyId);
    
    if (params.startDate) {
      filter += ` AND b.bill_date >= $${values.length + 1} `;
      values.push(`${params.startDate}T00:00:00+05:30`);
    }
    if (params.endDate) {
      filter += ` AND b.bill_date <= $${values.length + 1} `;
      values.push(`${params.endDate}T23:59:59.999+05:30`);
    }
    
    if (params.search) {
      filter += ` AND bi.medicine_name ILIKE $${values.length + 1} `;
      values.push(`%${params.search}%`);
    }

    const orderBy = params.sortBy === 'sales' ? '"totalSales" DESC' : '"quantitySold" DESC';
    
    const query = `
      SELECT 
        bi.medicine_name as "medicineName",
        SUM(bi.quantity) as "quantitySold",
        SUM(bi.line_total) as "totalSales"
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE ${filter} AND b.payment_status != 'CANCELLED'
      GROUP BY bi.medicine_name
      ORDER BY ${orderBy}
    `;
    
    const result = await pool.query(query, values);
    return result.rows.map(row => ({
      ...row,
      quantitySold: parseInt(row.quantitySold, 10),
      totalSales: parseFloat(row.totalSales)
    }));
  }

  /**
   * 4. MEDICINE REQUEST REPORT
   */
  static async getMedicineRequestReport(pharmacyId: number, params: ReportDateRange) {
    const values: any[] = [];
    const dateFilter = buildDateFilter(pharmacyId, 'created_at', params, values);
    
    const query = `
      SELECT 
        status,
        customer_confirmation as "customerConfirmation",
        COUNT(id) as count
      FROM medicine_requests
      WHERE ${dateFilter}
      GROUP BY status, customer_confirmation
    `;
    
    const result = await pool.query(query, values);
    
    const breakdown = {
      totalRequests: 0,
      waiting: 0,
      available: 0,
      canArrange: 0,
      notAvailable: 0,
      confirmed: 0,
      cancelled: 0
    };
    
    for (const row of result.rows) {
      const count = parseInt(row.count, 10);
      breakdown.totalRequests += count;
      
      if (row.customerConfirmation === 'CONFIRMED') {
        breakdown.confirmed += count;
      } else if (row.customerConfirmation === 'CANCELLED') {
        breakdown.cancelled += count;
      } else {
        if (row.status === 'WAITING') breakdown.waiting += count;
        if (row.status === 'AVAILABLE') breakdown.available += count;
        if (row.status === 'CAN_ARRANGE') breakdown.canArrange += count;
        if (row.status === 'NOT_AVAILABLE') breakdown.notAvailable += count;
      }
    }
    
    return breakdown;
  }

  /**
   * 5. CUSTOMER REPORT
   */
  static async getCustomerReport(pharmacyId: number, params: ReportDateRange & { search?: string }) {
    // Customers are generally users who have bills or medicine requests at this pharmacy.
    // For simplicity, we query the unique users from the bills table.
    // DavaSetu ties pharmacy usage through bills and medicine_requests.
    const values: any[] = [];
    const billDateFilter = buildDateFilter(pharmacyId, 'bill_date', params, values);
    
    // Instead of querying `users` directly since not all customers might be in `users` (walk-in customers),
    // we fetch customers based on billing records.
    let searchFilter = '';
    if (params.search) {
      searchFilter = ` AND customer_name ILIKE $${values.length + 1} `;
      values.push(`%${params.search}%`);
    }

    const query = `
      SELECT 
        customer_name as "customerName",
        customer_phone as "customerPhone",
        MIN(bill_date) as "firstVisit",
        MAX(bill_date) as "lastVisit",
        COUNT(id) as "totalBills",
        SUM(total) as "totalSpent"
      FROM bills
      WHERE ${billDateFilter} ${searchFilter}
      GROUP BY customer_name, customer_phone
      ORDER BY "totalSpent" DESC
    `;
    
    const result = await pool.query(query, values);
    
    // Basic aggregation
    const totalCustomers = result.rows.length;
    // Defining "new" as first visit being within the date range (approximate depending on range)
    let newCustomers = 0;
    let returningCustomers = 0;
    
    const startDateStr = params.startDate ? new Date(params.startDate).getTime() : 0;

    const customers = result.rows.map(row => {
      const isNew = startDateStr && new Date(row.firstVisit).getTime() >= startDateStr;
      if (isNew) newCustomers++; else returningCustomers++;
      
      return {
        ...row,
        totalBills: parseInt(row.totalBills, 10),
        totalSpent: parseFloat(row.totalSpent)
      };
    });
    
    return {
      summary: {
        totalCustomers,
        newCustomers,
        returningCustomers
      },
      customers
    };
  }

  /**
   * 7. GST REPORT
   */
  static async getGstReport(pharmacyId: number, params: ReportDateRange) {
    const values: any[] = [];
    const filter = buildDateFilter(pharmacyId, 'b.bill_date', params, values, 'b.pharmacy_id');
    
    const query = `
      SELECT 
        bi.gst_rate as "gstRate",
        SUM(bi.taxable_amount) as "taxableAmount",
        SUM(bi.cgst) as "cgst",
        SUM(bi.sgst) as "sgst",
        SUM(bi.igst) as "igst",
        SUM(bi.cgst + bi.sgst + bi.igst) as "totalGst",
        SUM(bi.line_total) as "totalAmount"
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE ${filter} AND b.payment_status != 'CANCELLED'
      GROUP BY bi.gst_rate
      ORDER BY bi.gst_rate ASC
    `;
    
    const result = await pool.query(query, values);
    
    return result.rows.map(row => ({
      gstRate: parseFloat(row.gstRate) || 0,
      taxableAmount: parseFloat(row.taxableAmount) || 0,
      cgst: parseFloat(row.cgst) || 0,
      sgst: parseFloat(row.sgst) || 0,
      igst: parseFloat(row.igst) || 0,
      totalGst: parseFloat(row.totalGst) || 0,
      totalAmount: parseFloat(row.totalAmount) || 0
    }));
  }

  /**
   * 8. CA / TAX FILING REPORT (GSTR-1, GSTR-2 & GSTR-3B)
   */
  static async getCaTaxFilingReport(pharmacyId: number, params: ReportDateRange) {
    // 1. Pharmacy Profile
    const pharmacyRes = await pool.query(
      `SELECT id, name, gstin, state, address, phone FROM pharmacies WHERE id = $1`,
      [pharmacyId]
    );
    const pharmacy = pharmacyRes.rows[0];

    // Mandatory GSTIN check: without a valid GST number, NO reports can be generated
    if (!pharmacy || !pharmacy.gstin || !pharmacy.gstin.trim()) {
      return {
        hasGstin: false,
        message: 'GST Identification Number (GSTIN) is required to generate GST tax filing reports.',
        pharmacy: {
          id: pharmacy?.id || pharmacyId,
          name: pharmacy?.name || 'Pharmacy',
          gstin: null,
          state: pharmacy?.state || '',
          address: pharmacy?.address || '',
          phone: pharmacy?.phone || ''
        }
      };
    }

    // Date filters for sales/bills
    const billValues: any[] = [];
    const billFilter = buildDateFilter(pharmacyId, 'b.bill_date', params, billValues, 'b.pharmacy_id');

    // 2. B2B Sales (Wholesale bills or bills with B2B clients) - GSTR-1
    const b2bQuery = `
      SELECT 
        b.id,
        b.bill_number as "invoiceNumber",
        b.bill_date as "invoiceDate",
        b.customer_name as "receiverName",
        COALESCE(c.gstin, '') as "receiverGstin",
        COALESCE(c.business_name, b.customer_name) as "tradeName",
        COALESCE(b.total_taxable_amount, b.subtotal) as "taxableValue",
        COALESCE(b.total_cgst, 0) as "cgst",
        COALESCE(b.total_sgst, 0) as "sgst",
        COALESCE(b.total_igst, 0) as "igst",
        b.total as "invoiceValue",
        b.payment_status as "paymentStatus"
      FROM bills b
      LEFT JOIN b2b_clients c ON b.b2b_client_id = c.id
      WHERE ${billFilter} 
        AND b.payment_status != 'CANCELLED'
        AND (b.bill_type = 'WHOLESALE' OR b.b2b_client_id IS NOT NULL)
      ORDER BY b.bill_date DESC
    `;
    const b2bRes = await pool.query(b2bQuery, billValues);

    // 3. B2CS (Retail Consumer Sales grouped by GST rate) - GSTR-1
    const b2csQuery = `
      SELECT 
        bi.gst_rate as "rate",
        COALESCE(SUM(bi.taxable_amount), 0) as "taxableValue",
        COALESCE(SUM(bi.cgst), 0) as "cgst",
        COALESCE(SUM(bi.sgst), 0) as "sgst",
        COALESCE(SUM(bi.igst), 0) as "igst",
        COALESCE(SUM(bi.line_total), 0) as "totalValue"
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE ${billFilter}
        AND b.payment_status != 'CANCELLED'
        AND (b.bill_type != 'WHOLESALE' OR b.bill_type IS NULL)
        AND b.b2b_client_id IS NULL
      GROUP BY bi.gst_rate
      ORDER BY bi.gst_rate ASC
    `;
    const b2csRes = await pool.query(b2csQuery, billValues);

    // 4. HSN Summary (Outward medicine supplies grouped by HSN code and GST rate) - GSTR-1
    const hsnQuery = `
      SELECT 
        COALESCE(NULLIF(bi.hsn_code, ''), '3004') as "hsnCode",
        MIN(bi.medicine_name) as "description",
        'NOS' as "uqc",
        SUM(bi.quantity) as "totalQuantity",
        SUM(bi.line_total) as "totalValue",
        SUM(bi.taxable_amount) as "taxableValue",
        bi.gst_rate as "rate",
        SUM(bi.cgst) as "cgst",
        SUM(bi.sgst) as "sgst",
        SUM(bi.igst) as "igst"
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE ${billFilter} AND b.payment_status != 'CANCELLED'
      GROUP BY COALESCE(NULLIF(bi.hsn_code, ''), '3004'), bi.gst_rate
      ORDER BY bi.gst_rate ASC
    `;
    const hsnRes = await pool.query(hsnQuery, billValues);

    // 5. Document Issued Summary - GSTR-1
    const docQuery = `
      SELECT 
        MIN(bill_number) as "fromSerial",
        MAX(bill_number) as "toSerial",
        COUNT(id) as "totalCount",
        COUNT(CASE WHEN payment_status = 'CANCELLED' THEN 1 END) as "cancelledCount"
      FROM bills b
      WHERE ${billFilter}
    `;
    const docRes = await pool.query(docQuery, billValues);

    // 6. Overall Outward Taxable Supplies (GSTR-3B Table 3.1)
    const outwardQuery = `
      SELECT 
        COALESCE(SUM(taxable_amount), 0) as "taxableAmount",
        COALESCE(SUM(cgst), 0) as "cgst",
        COALESCE(SUM(sgst), 0) as "sgst",
        COALESCE(SUM(igst), 0) as "igst",
        COALESCE(SUM(cgst + sgst + igst), 0) as "totalTax",
        COALESCE(SUM(line_total), 0) as "totalAmount"
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE ${billFilter} AND b.payment_status != 'CANCELLED'
    `;
    const outwardRes = await pool.query(outwardQuery, billValues);

    // 7. Inward Purchases Filters (GSTR-2 & GSTR-3B Table 4)
    const purchaseValues: any[] = [];
    let purchaseFilter = ` p.pharmacy_id = $1 `;
    purchaseValues.push(pharmacyId);
    if (params.startDate) {
      purchaseFilter += ` AND (p.invoice_date >= $${purchaseValues.length + 1} OR (p.invoice_date IS NULL AND p.created_at >= $${purchaseValues.length + 1})) `;
      purchaseValues.push(params.startDate);
    }
    if (params.endDate) {
      purchaseFilter += ` AND (p.invoice_date <= $${purchaseValues.length + 1} OR (p.invoice_date IS NULL AND p.created_at <= $${purchaseValues.length + 1})) `;
      purchaseValues.push(params.endDate);
    }

    // GSTR-2 Section 1: Inward B2B Invoices (Purchases from Distributors)
    const gstr2B2bQuery = `
      SELECT 
        p.id,
        p.invoice_number as "invoiceNumber",
        p.invoice_date as "invoiceDate",
        COALESCE(s.supplier_name, 'Direct Distributor') as "supplierName",
        COALESCE(s.gstin, '') as "supplierGstin",
        COALESCE(s.city, '') as "supplierCity",
        COALESCE(s.state, 'Gujarat') as "supplierState",
        COALESCE(p.taxable_amount, 0) as "taxableValue",
        COALESCE(p.cgst_amount, 0) as "cgst",
        COALESCE(p.sgst_amount, 0) as "sgst",
        COALESCE(p.igst_amount, 0) as "igst",
        COALESCE(p.total_tax, 0) as "totalTax",
        COALESCE(p.grand_total, 0) as "invoiceValue",
        'N' as "reverseCharge",
        'Inputs' as "itcEligibility"
      FROM purchase_invoices p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE ${purchaseFilter} AND p.payment_status != 'CANCELLED'
      ORDER BY p.invoice_date DESC, p.created_at DESC
    `;
    const gstr2B2bRes = await pool.query(gstr2B2bQuery, purchaseValues);

    // GSTR-2 Section 2: Inward Supplies Grouped by Tax Slab
    const gstr2RateWiseQuery = `
      SELECT 
        COALESCE(pi.gst_rate, 0) as "rate",
        COALESCE(SUM(pi.taxable_amount), 0) as "taxableValue",
        COALESCE(SUM(pi.cgst_amount), 0) as "cgst",
        COALESCE(SUM(pi.sgst_amount), 0) as "sgst",
        COALESCE(SUM(pi.igst_amount), 0) as "igst",
        COALESCE(SUM(pi.cgst_amount + pi.sgst_amount + pi.igst_amount), 0) as "totalTax",
        COALESCE(SUM(pi.total_amount), 0) as "totalValue"
      FROM purchase_items pi
      JOIN purchase_invoices p ON pi.purchase_invoice_id = p.id
      WHERE ${purchaseFilter} AND p.payment_status != 'CANCELLED'
      GROUP BY pi.gst_rate
      ORDER BY pi.gst_rate ASC
    `;
    const gstr2RateWiseRes = await pool.query(gstr2RateWiseQuery, purchaseValues);

    // GSTR-2 Section 3: HSN-wise Inward Supplies (Purchased Medicines)
    const gstr2HsnQuery = `
      SELECT 
        COALESCE(NULLIF(m.hsn_code, ''), '3004') as "hsnCode",
        COALESCE(MIN(m.name), 'Medicine Supplies') as "description",
        'NOS' as "uqc",
        COALESCE(SUM(pi.quantity + pi.free_quantity), 0) as "totalQuantity",
        COALESCE(SUM(pi.total_amount), 0) as "totalValue",
        COALESCE(SUM(pi.taxable_amount), 0) as "taxableValue",
        COALESCE(pi.gst_rate, 0) as "rate",
        COALESCE(SUM(pi.cgst_amount), 0) as "cgst",
        COALESCE(SUM(pi.sgst_amount), 0) as "sgst",
        COALESCE(SUM(pi.igst_amount), 0) as "igst"
      FROM purchase_items pi
      JOIN purchase_invoices p ON pi.purchase_invoice_id = p.id
      LEFT JOIN medicines m ON pi.medicine_id = m.id
      WHERE ${purchaseFilter} AND p.payment_status != 'CANCELLED'
      GROUP BY COALESCE(NULLIF(m.hsn_code, ''), '3004'), pi.gst_rate
      ORDER BY pi.gst_rate ASC
    `;
    const gstr2HsnRes = await pool.query(gstr2HsnQuery, purchaseValues);

    // GSTR-2 Section 4: Supplier / Distributor ITC Summary
    const gstr2SupplierQuery = `
      SELECT 
        COALESCE(s.supplier_name, 'Direct Distributor') as "supplierName",
        COALESCE(s.gstin, '') as "supplierGstin",
        COALESCE(s.city, '') as "supplierCity",
        COUNT(p.id) as "totalInvoices",
        COALESCE(SUM(p.taxable_amount), 0) as "taxableValue",
        COALESCE(SUM(p.cgst_amount), 0) as "cgst",
        COALESCE(SUM(p.sgst_amount), 0) as "sgst",
        COALESCE(SUM(p.igst_amount), 0) as "igst",
        COALESCE(SUM(p.total_tax), 0) as "totalItc",
        COALESCE(SUM(p.grand_total), 0) as "totalPurchases"
      FROM purchase_invoices p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE ${purchaseFilter} AND p.payment_status != 'CANCELLED'
      GROUP BY s.supplier_name, s.gstin, s.city
      ORDER BY "totalPurchases" DESC
    `;
    const gstr2SupplierRes = await pool.query(gstr2SupplierQuery, purchaseValues);

    // Overall Eligible Input Tax Credit (ITC) from Purchases (GSTR-3B Table 4)
    const purchaseQuery = `
      SELECT 
        COALESCE(SUM(p.taxable_amount), 0) as "taxableAmount",
        COALESCE(SUM(p.cgst_amount), 0) as "cgst",
        COALESCE(SUM(p.sgst_amount), 0) as "sgst",
        COALESCE(SUM(p.igst_amount), 0) as "igst",
        COALESCE(SUM(p.total_tax), 0) as "totalTax",
        COALESCE(SUM(p.grand_total), 0) as "totalPurchases",
        COUNT(p.id) as "totalInvoices"
      FROM purchase_invoices p
      WHERE ${purchaseFilter} AND p.payment_status != 'CANCELLED'
    `;
    const purchaseRes = await pool.query(purchaseQuery, purchaseValues);

    const outward = {
      taxableAmount: parseFloat(outwardRes.rows[0]?.taxableAmount || 0),
      cgst: parseFloat(outwardRes.rows[0]?.cgst || 0),
      sgst: parseFloat(outwardRes.rows[0]?.sgst || 0),
      igst: parseFloat(outwardRes.rows[0]?.igst || 0),
      totalTax: parseFloat(outwardRes.rows[0]?.totalTax || 0),
      totalAmount: parseFloat(outwardRes.rows[0]?.totalAmount || 0),
    };

    const itc = {
      taxableAmount: parseFloat(purchaseRes.rows[0]?.taxableAmount || 0),
      cgst: parseFloat(purchaseRes.rows[0]?.cgst || 0),
      sgst: parseFloat(purchaseRes.rows[0]?.sgst || 0),
      igst: parseFloat(purchaseRes.rows[0]?.igst || 0),
      totalTax: parseFloat(purchaseRes.rows[0]?.totalTax || 0),
      totalPurchases: parseFloat(purchaseRes.rows[0]?.totalPurchases || 0),
      totalInvoices: parseInt(purchaseRes.rows[0]?.totalInvoices || 0, 10),
    };

    const netTaxPayable = {
      cgst: Math.max(0, outward.cgst - itc.cgst),
      sgst: Math.max(0, outward.sgst - itc.sgst),
      igst: Math.max(0, outward.igst - itc.igst),
      totalTax: Math.max(0, outward.totalTax - itc.totalTax),
    };

    return {
      hasGstin: true,
      pharmacy: {
        id: pharmacy.id,
        name: pharmacy.name,
        gstin: pharmacy.gstin,
        state: pharmacy.state || 'Gujarat',
      },
      gstr1: {
        b2b: b2bRes.rows.map(r => ({
          invoiceNumber: r.invoiceNumber,
          invoiceDate: r.invoiceDate,
          receiverName: r.receiverName,
          receiverGstin: r.receiverGstin,
          tradeName: r.tradeName,
          taxableValue: parseFloat(r.taxableValue || 0),
          cgst: parseFloat(r.cgst || 0),
          sgst: parseFloat(r.sgst || 0),
          igst: parseFloat(r.igst || 0),
          invoiceValue: parseFloat(r.invoiceValue || 0),
        })),
        b2cs: b2csRes.rows.map(r => ({
          rate: parseFloat(r.rate || 0),
          taxableValue: parseFloat(r.taxableValue || 0),
          cgst: parseFloat(r.cgst || 0),
          sgst: parseFloat(r.sgst || 0),
          igst: parseFloat(r.igst || 0),
          totalValue: parseFloat(r.totalValue || 0),
        })),
        hsnSummary: hsnRes.rows.map(r => ({
          hsnCode: r.hsnCode,
          description: r.description,
          uqc: r.uqc,
          totalQuantity: parseInt(r.totalQuantity || 0, 10),
          totalValue: parseFloat(r.totalValue || 0),
          taxableValue: parseFloat(r.taxableValue || 0),
          rate: parseFloat(r.rate || 0),
          cgst: parseFloat(r.cgst || 0),
          sgst: parseFloat(r.sgst || 0),
          igst: parseFloat(r.igst || 0),
        })),
        docSummary: {
          fromSerial: docRes.rows[0]?.fromSerial || 'N/A',
          toSerial: docRes.rows[0]?.toSerial || 'N/A',
          totalCount: parseInt(docRes.rows[0]?.totalCount || 0, 10),
          cancelledCount: parseInt(docRes.rows[0]?.cancelledCount || 0, 10),
        },
      },
      gstr2: {
        b2b: gstr2B2bRes.rows.map(r => ({
          id: r.id,
          invoiceNumber: r.invoiceNumber,
          invoiceDate: r.invoiceDate,
          supplierName: r.supplierName,
          supplierGstin: r.supplierGstin,
          supplierCity: r.supplierCity,
          supplierState: r.supplierState,
          taxableValue: parseFloat(r.taxableValue || 0),
          cgst: parseFloat(r.cgst || 0),
          sgst: parseFloat(r.sgst || 0),
          igst: parseFloat(r.igst || 0),
          totalTax: parseFloat(r.totalTax || 0),
          invoiceValue: parseFloat(r.invoiceValue || 0),
          reverseCharge: r.reverseCharge,
          itcEligibility: r.itcEligibility,
        })),
        rateWise: gstr2RateWiseRes.rows.map(r => ({
          rate: parseFloat(r.rate || 0),
          taxableValue: parseFloat(r.taxableValue || 0),
          cgst: parseFloat(r.cgst || 0),
          sgst: parseFloat(r.sgst || 0),
          igst: parseFloat(r.igst || 0),
          totalTax: parseFloat(r.totalTax || 0),
          totalValue: parseFloat(r.totalValue || 0),
        })),
        hsnSummary: gstr2HsnRes.rows.map(r => ({
          hsnCode: r.hsnCode,
          description: r.description,
          uqc: r.uqc,
          totalQuantity: parseInt(r.totalQuantity || 0, 10),
          totalValue: parseFloat(r.totalValue || 0),
          taxableValue: parseFloat(r.taxableValue || 0),
          rate: parseFloat(r.rate || 0),
          cgst: parseFloat(r.cgst || 0),
          sgst: parseFloat(r.sgst || 0),
          igst: parseFloat(r.igst || 0),
        })),
        supplierSummary: gstr2SupplierRes.rows.map(r => ({
          supplierName: r.supplierName,
          supplierGstin: r.supplierGstin,
          supplierCity: r.supplierCity,
          totalInvoices: parseInt(r.totalInvoices || 0, 10),
          taxableValue: parseFloat(r.taxableValue || 0),
          cgst: parseFloat(r.cgst || 0),
          sgst: parseFloat(r.sgst || 0),
          igst: parseFloat(r.igst || 0),
          totalItc: parseFloat(r.totalItc || 0),
          totalPurchases: parseFloat(r.totalPurchases || 0),
        })),
        summary: {
          totalInvoices: itc.totalInvoices,
          taxableAmount: itc.taxableAmount,
          cgst: itc.cgst,
          sgst: itc.sgst,
          igst: itc.igst,
          totalTax: itc.totalTax,
          totalPurchases: itc.totalPurchases,
          eligibleItc: itc.totalTax
        }
      },
      gstr3b: {
        outwardSupplies: outward,
        eligibleItc: itc,
        netTaxPayable,
      },
    };
  }

  /**
   * 8. DEAD STOCK & SLOW MOVING INVENTORY REPORT
   */
  static async getDeadStockReport(pharmacyId: number, minDays = 30) {
    const query = `
      SELECT 
        m.id,
        m.name,
        m.generic_name as "genericName",
        m.category,
        m.strength,
        m.sku,
        m.barcode,
        m.current_stock as "currentStock",
        m.selling_price as "sellingPrice",
        COALESCE(m.mrp, m.selling_price * 1.15) as "mrp",
        COALESCE(
          (SELECT purchase_price FROM medicine_batches WHERE medicine_id = m.id AND purchase_price > 0 ORDER BY id DESC LIMIT 1),
          m.selling_price * 0.75
        ) as "purchasePrice",
        COALESCE(
          (SELECT MIN(expiry_date) FROM medicine_batches WHERE medicine_id = m.id AND available_quantity > 0),
          m.expiry_date
        ) as "nearestExpiry",
        m.created_at as "createdAt",
        (
          SELECT MAX(b.created_at) 
          FROM bill_items bi 
          JOIN bills b ON bi.bill_id = b.id 
          WHERE bi.medicine_name ILIKE m.name AND b.pharmacy_id = m.pharmacy_id AND b.payment_status != 'CANCELLED'
        ) as "lastSoldAt",
        (
          SELECT COALESCE(SUM(bi.quantity), 0)
          FROM bill_items bi 
          JOIN bills b ON bi.bill_id = b.id 
          WHERE bi.medicine_name ILIKE m.name AND b.pharmacy_id = m.pharmacy_id 
            AND b.created_at >= CURRENT_DATE - INTERVAL '90 days'
            AND b.payment_status != 'CANCELLED'
        ) as "soldLast90Days"
      FROM medicines m
      WHERE m.pharmacy_id = $1 
        AND m.current_stock > 0
      ORDER BY m.current_stock DESC;
    `;

    const result = await pool.query(query, [pharmacyId]);
    const now = Date.now();

    const items = result.rows.map(row => {
      const currentStock = parseInt(row.currentStock, 10) || 0;
      const purchasePrice = parseFloat(row.purchasePrice) || 0;
      const sellingPrice = parseFloat(row.sellingPrice) || 0;
      const mrp = parseFloat(row.mrp) || 0;
      const soldLast90 = parseInt(row.soldLast90Days, 10) || 0;

      let lastActiveDate = row.lastSoldAt ? new Date(row.lastSoldAt) : new Date(row.createdAt);
      let daysInactive = Math.max(0, Math.floor((now - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)));
      const neverSold = !row.lastSoldAt;

      let daysToExpiry = 999;
      let isNearExpiry = false;
      let isExpired = false;
      if (row.nearestExpiry) {
        const expDate = new Date(row.nearestExpiry);
        daysToExpiry = Math.ceil((expDate.getTime() - now) / (1000 * 60 * 60 * 24));
        isNearExpiry = daysToExpiry <= 180 && daysToExpiry > 0;
        isExpired = daysToExpiry <= 0;
      }

      const blockedCapital = currentStock * purchasePrice;
      const retailValue = currentStock * sellingPrice;

      let severity: 'CRITICAL' | 'WARNING' | 'MODERATE' = 'MODERATE';
      if (daysInactive >= 90 || isNearExpiry || isExpired) {
        severity = 'CRITICAL';
      } else if (daysInactive >= 60) {
        severity = 'WARNING';
      }

      return {
        id: row.id,
        name: row.name,
        genericName: row.genericName,
        category: row.category,
        strength: row.strength,
        barcode: row.barcode,
        currentStock,
        purchasePrice,
        sellingPrice,
        mrp,
        blockedCapital,
        retailValue,
        lastSoldAt: row.lastSoldAt,
        createdAt: row.createdAt,
        daysInactive,
        neverSold,
        soldLast90,
        nearestExpiry: row.nearestExpiry,
        daysToExpiry,
        isNearExpiry,
        isExpired,
        severity
      };
    }).filter(item => item.daysInactive >= minDays || item.isNearExpiry || item.neverSold);

    const totalBlockedCapital = items.reduce((sum, it) => sum + it.blockedCapital, 0);
    const totalRetailValue = items.reduce((sum, it) => sum + it.retailValue, 0);
    const totalDeadItems = items.length;
    const criticalItemsCount = items.filter(it => it.severity === 'CRITICAL').length;
    const nearExpiryItemsCount = items.filter(it => it.isNearExpiry || it.isExpired).length;
    const nearExpiryBlockedCapital = items.filter(it => it.isNearExpiry || it.isExpired).reduce((sum, it) => sum + it.blockedCapital, 0);

    return {
      summary: {
        totalDeadItems,
        totalBlockedCapital,
        totalRetailValue,
        criticalItemsCount,
        nearExpiryItemsCount,
        nearExpiryBlockedCapital
      },
      items
    };
  }
}
