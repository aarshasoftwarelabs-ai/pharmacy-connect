export interface BillItem {
  id?: number;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
  hsnCode?: string;
  gstRate?: number;
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
}

export interface Bill {
  id: number;
  billNumber: string;
  medicineRequestId: number;
  userId: number;
  pharmacyId: number;
  customerName: string;
  customerPhone?: string;
  billDate: string;
  subtotal: string | number;
  discount: string | number;
  total: string | number;
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
