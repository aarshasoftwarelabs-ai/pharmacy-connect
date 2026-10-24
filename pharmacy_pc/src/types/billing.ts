export interface BillItem {
  id?: number;
  medicineId?: string | number;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  mrp?: number;
  lineTotal?: number;
  hsnCode?: string;
  gstRate?: number;
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
}

export interface Bill {
  id: number | string;
  billNumber: string;
  medicineRequestId?: number | null;
  userId?: number | null;
  pharmacyId?: number;
  customerName: string;
  customerPhone?: string;
  billDate?: string;
  subtotal: string | number;
  discount: string | number;
  total: string | number;
  paymentMode?: string;
  paymentStatus: 'UNPAID' | 'PAID';
  billType?: 'ONLINE' | 'OFFLINE' | 'RETAIL' | 'WHOLESALE';
  b2bClientId?: number;
  dueDate?: string;
  totalTaxableAmount?: number;
  totalCgst?: number;
  totalSgst?: number;
  totalIgst?: number;
  totalGst?: number;
  deliveryStaffId?: number | null;
  deliveryStaffName?: string;
  deliveryStaffPhone?: string;
  deliveryStatus?: 'DIRECT_PICKUP' | 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  cashCollectionStatus?: 'PAID' | 'COD_PENDING' | 'COLLECTED' | 'SETTLED';
  cashCollectedAmount?: number;
  deliveryNotes?: string;
  assignedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  isOfflineQueued?: boolean;
  items?: BillItem[];
}

export interface BillingQueueItem {
  id: number;
  userId: number;
  pharmacyId: number;
  medicineName: string | null;
  customerConfirmation: string;
  confirmedAt: string;
  customerName: string;
  customerPhone: string;
}
