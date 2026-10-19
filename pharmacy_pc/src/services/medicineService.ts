import { Medicine } from '../types/medicine';
import { API_BASE_URL, apiFetch } from '../config/api';

export const fetchMedicines = async (): Promise<Medicine[]> => {
  const response = await apiFetch(`${API_BASE_URL}/medicines`);
  if (!response.ok) {
    if (response.status === 403) throw new Error('Forbidden: Insufficient permissions');
    throw new Error('Failed to fetch medicines');
  }
  return response.json();
};

export const createMedicine = async (medicineData: Partial<Medicine>): Promise<Medicine> => {
  const response = await apiFetch(`${API_BASE_URL}/medicines`, {
    method: 'POST',
    body: JSON.stringify(medicineData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to create medicine');
  }
  return response.json();
};

export const updateMedicine = async (id: string, medicineData: Partial<Medicine>): Promise<Medicine> => {
  const response = await apiFetch(`${API_BASE_URL}/medicines/${id}`, {
    method: 'PUT',
    body: JSON.stringify(medicineData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to update medicine');
  }
  return response.json();
};

export const deleteMedicine = async (id: string): Promise<void> => {
  const response = await apiFetch(`${API_BASE_URL}/medicines/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to delete medicine');
  }
};

export const bulkImportMedicines = async (items: any[]): Promise<{ success: boolean; importedCount: number; totalStockAdded: number; message: string }> => {
  const response = await apiFetch(`${API_BASE_URL}/medicines/bulk-import`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to bulk import medicines');
  }
  return response.json();
};

export const generateMissingBarcodes = async (): Promise<{ success: boolean; updatedCount: number; message: string }> => {
  const response = await apiFetch(`${API_BASE_URL}/medicines/generate-barcodes`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to auto-generate barcodes');
  }
  return response.json();
};

export const lookupMedicineByBarcode = async (barcode: string): Promise<any> => {
  try {
    const clean = (barcode || '').trim();
    if (!clean) return null;
    const response = await apiFetch(`${API_BASE_URL}/medicines/lookup-barcode/${encodeURIComponent(clean)}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (err) {
    console.warn('Barcode lookup error:', err);
    return null;
  }
};

export interface DeadStockItem {
  id: number;
  name: string;
  genericName?: string;
  category: string;
  strength?: string;
  barcode?: string;
  currentStock: number;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  blockedCapital: number;
  retailValue: number;
  lastSoldAt?: string;
  createdAt: string;
  daysInactive: number;
  neverSold: boolean;
  soldLast90: number;
  nearestExpiry?: string;
  daysToExpiry: number;
  isNearExpiry: boolean;
  isExpired: boolean;
  severity: 'CRITICAL' | 'WARNING' | 'MODERATE';
}

export interface DeadStockResponse {
  summary: {
    totalDeadItems: number;
    totalBlockedCapital: number;
    totalRetailValue: number;
    criticalItemsCount: number;
    nearExpiryItemsCount: number;
    nearExpiryBlockedCapital: number;
  };
  items: DeadStockItem[];
}

export const fetchDeadStock = async (minDays = 30): Promise<DeadStockResponse> => {
  const response = await apiFetch(`${API_BASE_URL}/medicines/dead-stock?minDays=${minDays}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to fetch dead stock');
  }
  const result = await response.json();
  return result.data;
};

export interface ScannedMedicineBoxData {
  medicine_name?: string | null;
  generic_name?: string | null;
  batch_number?: string | null;
  mfg_date?: string | null;
  expiry_date?: string | null;
  raw_expiry?: string | null;
  days_until_expiry?: number;
  expiry_status?: 'HEALTHY' | 'NEAR_EXPIRY' | 'EXPIRED';
  mrp?: number;
  pack_size?: string | null;
  mfg_lic_no?: string | null;
  manufacturer?: string | null;
  confidence?: number;
  matched_medicine?: any;
  synced_item?: any;
}

export const scanMedicineBox = async (
  input: File | string,
  pharmacyId?: number,
  syncToPc?: boolean
): Promise<ScannedMedicineBoxData> => {
  let response: Response;

  if (input instanceof File) {
    const formData = new FormData();
    formData.append('image', input);
    if (pharmacyId) formData.append('pharmacyId', String(pharmacyId));
    if (syncToPc !== undefined) formData.append('syncToPc', String(syncToPc));

    response = await apiFetch(`${API_BASE_URL}/medicines/scan-box`, {
      method: 'POST',
      body: formData,
    });
  } else {
    // Base64 string
    response = await apiFetch(`${API_BASE_URL}/medicines/scan-box`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: input,
        pharmacyId: pharmacyId || 1,
        syncToPc: syncToPc ?? false,
      }),
    });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to scan medicine box');
  }

  const result = await response.json();
  return result.data;
};

