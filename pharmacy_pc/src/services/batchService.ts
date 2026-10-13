import { API_BASE_URL, apiFetch } from '../config/api';

export interface BatchItem {
  id: number;
  medicineId: number;
  pharmacyId?: number;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  availableQuantity: number;
  purchasePrice: number;
  mrp: number;
  sellingPrice: number;
  barcode?: string;
}

export interface CreateBatchPayload {
  medicineId: number;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice?: number;
  mrp?: number;
  sellingPrice?: number;
  barcode?: string;
}

export const BatchService = {
  async getBatchesByMedicine(medicineId: number | string): Promise<BatchItem[]> {
    const res = await apiFetch(`${API_BASE_URL}/inventory/batches/medicine/${medicineId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch batches for medicine');
    }
    const data = await res.json();
    return data.data || [];
  },

  async createBatch(payload: CreateBatchPayload): Promise<BatchItem> {
    const res = await apiFetch(`${API_BASE_URL}/inventory/batches`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create batch');
    }
    const data = await res.json();
    return data.data;
  },

  async deleteBatch(batchId: number): Promise<void> {
    const res = await apiFetch(`${API_BASE_URL}/inventory/batches/${batchId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete batch');
    }
  },

  async initializeMissingBatches(medicineId?: number | string): Promise<{ success: boolean; count: number; message: string }> {
    const res = await apiFetch(`${API_BASE_URL}/inventory/batches/initialize-missing`, {
      method: 'POST',
      body: JSON.stringify(medicineId ? { medicineId } : {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to initialize batches');
    }
    return res.json();
  }
};
