export interface B2BClient {
  id: number;
  pharmacyId: number;
  businessName: string;
  ownerName?: string;
  phone: string;
  address?: string;
  gstin?: string;
  dlNumber?: string;
  creditLimit: number;
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface B2BLedger {
  id: number;
  b2bClientId: number;
  transactionType: 'DR' | 'CR';
  amount: number;
  referenceId?: number;
  description?: string;
  transactionDate: string;
}

export interface TradeScheme {
  id: number;
  pharmacyId: number;
  medicineId: number;
  minQuantity: number;
  freeQuantity: number;
  discountPercent: number;
  validUntil?: string;
  createdAt: string;
}
