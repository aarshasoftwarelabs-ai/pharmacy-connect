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

  static async getCaTaxFilingReport(pharmacyId: number, params: ReportDateRange): Promise<CaTaxFilingData> {
    const response = await apiFetch(`${API_BASE_URL}/reports/ca-tax-filing/${pharmacyId}${this.buildQuery(params)}`);
    if (!response.ok) throw new Error('Failed to fetch CA tax filing report');
    const data = await response.json();
    return data.data;
  }
}

export interface CaTaxFilingData {
  hasGstin?: boolean;
  message?: string;
  pharmacy: {
    id?: number;
    name: string;
    gstin: string | null;
    state?: string;
    address?: string;
    phone?: string;
  };
  gstr1?: {
    b2b: {
      invoiceNumber: string;
      invoiceDate: string;
      receiverName: string;
      receiverGstin: string;
      tradeName: string;
      taxableValue: number;
      cgst: number;
      sgst: number;
      igst: number;
      invoiceValue: number;
    }[];
    b2cs: {
      rate: number;
      taxableValue: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalValue: number;
    }[];
    hsnSummary: {
      hsnCode: string;
      description: string;
      uqc: string;
      totalQuantity: number;
      totalValue: number;
      taxableValue: number;
      rate: number;
      cgst: number;
      sgst: number;
      igst: number;
    }[];
    docSummary: {
      fromSerial: string;
      toSerial: string;
      totalCount: number;
      cancelledCount: number;
    };
  };
  gstr2?: {
    b2b: {
      id: number;
      invoiceNumber: string;
      invoiceDate: string;
      supplierName: string;
      supplierGstin: string;
      supplierCity?: string;
      supplierState?: string;
      taxableValue: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalTax: number;
      invoiceValue: number;
      reverseCharge: string;
      itcEligibility: string;
    }[];
    rateWise: {
      rate: number;
      taxableValue: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalTax: number;
      totalValue: number;
    }[];
    hsnSummary: {
      hsnCode: string;
      description: string;
      uqc: string;
      totalQuantity: number;
      totalValue: number;
      taxableValue: number;
      rate: number;
      cgst: number;
      sgst: number;
      igst: number;
    }[];
    supplierSummary: {
      supplierName: string;
      supplierGstin: string;
      supplierCity?: string;
      totalInvoices: number;
      taxableValue: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalItc: number;
      totalPurchases: number;
    }[];
    summary: {
      totalInvoices: number;
      taxableAmount: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalTax: number;
      totalPurchases: number;
      eligibleItc: number;
    };
  };
  gstr3b?: {
    outwardSupplies: {
      taxableAmount: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalTax: number;
      totalAmount: number;
    };
    eligibleItc: {
      taxableAmount: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalTax: number;
      totalPurchases: number;
      totalInvoices: number;
    };
    netTaxPayable: {
      cgst: number;
      sgst: number;
      igst: number;
      totalTax: number;
    };
  };
}
