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
}
