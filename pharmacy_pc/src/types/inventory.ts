export interface InventoryItem {
  id: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  category: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  lastUpdated: string;
}

export type MovementType = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  medicineId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  supplier?: string;
  batchNumber?: string;
  expiryDate?: string;
  purchasePrice?: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
}
