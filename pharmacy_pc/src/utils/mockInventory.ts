import { InventoryItem, StockMovement } from '../types/inventory';
import { initialMedicines } from './mockMedicines';

// Derive inventory items from the medicine mock data to keep them in sync
export const initialInventoryItems: InventoryItem[] = initialMedicines.map(med => ({
  id: `INV-${med.id.split('-')[1]}`,
  medicineId: med.id,
  medicineName: med.name,
  genericName: med.genericName,
  category: med.category,
  sku: med.sku,
  currentStock: med.currentStock,
  minimumStock: med.minimumStock,
  lastUpdated: med.updatedAt,
}));

export const initialStockMovements: StockMovement[] = [
  {
    id: 'MOV-1001',
    medicineId: 'MED-001',
    type: 'STOCK_IN',
    quantity: 50,
    reason: 'Purchase',
    supplier: 'ABC Pharma',
    batchNumber: 'PCM2026A',
    expiryDate: '2028-05-31',
    purchasePrice: 18,
    notes: 'Regular stock replenishment',
    createdAt: '2026-09-23T10:30:00Z',
    createdBy: 'Pharmacy Owner',
  },
  {
    id: 'MOV-1002',
    medicineId: 'MED-001',
    type: 'STOCK_OUT',
    quantity: -5,
    reason: 'Damaged',
    notes: 'Packaging damaged in transit',
    createdAt: '2026-09-23T11:15:00Z',
    createdBy: 'Pharmacy Owner',
  },
  {
    id: 'MOV-1003',
    medicineId: 'MED-002',
    type: 'ADJUSTMENT',
    quantity: -2,
    reason: 'Physical stock count',
    notes: 'Discrepancy found during monthly audit',
    createdAt: '2026-09-22T09:42:00Z',
    createdBy: 'Pharmacy Owner',
  }
];
