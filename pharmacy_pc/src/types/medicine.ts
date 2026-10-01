export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  manufacturer?: string;
  category: string;
  strength: string;
  dosageForm: string;
  packSize: string;
  sku: string;
  barcode: string;
  mrp: number;
  sellingPrice: number;
  minimumStock: number;
  currentStock: number;
  prescriptionRequired: boolean;
  status: 'Active' | 'Inactive';
  hsnCode?: string;
  gstRate?: number;
  imageUrl?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}
