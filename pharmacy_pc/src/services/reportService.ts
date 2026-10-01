import { API_BASE_URL, apiFetch } from '../config/api';

export interface ReportDateRange {
  from?: string;
  to?: string;
}

export interface SalesReportData {
  totalSales: number;
  totalDiscount: number;
  netSales: number;
  netProfit: number;
  totalBills: number;
  averageBillValue: number;
}

export interface BillingReportItem {
  id: number;
  billNumber: string;
  customerName: string;
  billDate: string;
  subtotal: number;
  discount: number;
  total: number;
  totalProfit: number;
  paymentStatus: string;
  billType: string;
}

export interface MedicineSalesReportItem {
  medicineName: string;
  quantitySold: number;
  totalSales: number;
}

export interface MedicineRequestReportData {
  totalRequests: number;
  waiting: number;
  available: number;
  canArrange: number;
  notAvailable: number;
  confirmed: number;
  cancelled: number;
}

export interface CustomerReportData {
  summary: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
  };
  customers: {
    customerName: string;
    customerPhone: string;
    firstVisit: string;
    lastVisit: string;
    totalBills: number;
    totalSpent: number;
  }[];
}

export class ReportService {
  private static buildQuery(params: ReportDateRange & { search?: string; sortBy?: string }): string {
    const query = new URLSearchParams();
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.search) query.append('search', params.search);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    const str = query.toString();
    return str ? `?${str}` : '';
  }

  static async getSalesReport(pharmacyId: number, params: ReportDateRange): Promise<SalesReportData> {
    const response = await apiFetch(`${API_BASE_URL}/reports/sales/${pharmacyId}${this.buildQuery(params)}`);
    if (!response.ok) throw new Error('Failed to fetch sales report');
    const data = await response.json();
    return data.data;
  }

  static async getBillingReport(pharmacyId: number, params: ReportDateRange & { search?: string }): Promise<BillingReportItem[]> {
    const response = await apiFetch(`${API_BASE_URL}/reports/billing/${pharmacyId}${this.buildQuery(params)}`);
    if (!response.ok) throw new Error('Failed to fetch billing report');
    const data = await response.json();
    return data.data;
  }

  static async getMedicineSalesReport(pharmacyId: number, params: ReportDateRange & { search?: string; sortBy?: 'quantity' | 'sales' }): Promise<MedicineSalesReportItem[]> {
    const response = await apiFetch(`${API_BASE_URL}/reports/medicine-sales/${pharmacyId}${this.buildQuery(params)}`);
    if (!response.ok) throw new Error('Failed to fetch medicine sales report');
    const data = await response.json();
    return data.data;
  }

  static async getMedicineRequestReport(pharmacyId: number, params: ReportDateRange): Promise<MedicineRequestReportData> {
    const response = await apiFetch(`${API_BASE_URL}/reports/medicine-requests/${pharmacyId}${this.buildQuery(params)}`);
    if (!response.ok) throw new Error('Failed to fetch medicine request report');
    const data = await response.json();
    return data.data;
  }

  static async getCustomerReport(pharmacyId: number, params: ReportDateRange & { search?: string }): Promise<CustomerReportData> {
    const response = await apiFetch(`${API_BASE_URL}/reports/customers/${pharmacyId}${this.buildQuery(params)}`);
    if (!response.ok) throw new Error('Failed to fetch customer report');
    const data = await response.json();
    return data.data;
  }

  static async getGstReport(pharmacyId: number, params: ReportDateRange): Promise<any[]> {
    const response = await apiFetch(`${API_BASE_URL}/reports/gst/${pharmacyId}${this.buildQuery(params)}`);
    if (!response.ok) throw new Error('Failed to fetch GST report');
    const data = await response.json();
    return data.data;
  }
}
