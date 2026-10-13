import { API_BASE_URL, apiFetch } from '../config/api';

export interface Distributor {
  id: number;
  name: string;
  email: string | null;
  whatsappNumber: string | null;
  address: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const fetchDistributors = async (): Promise<Distributor[]> => {
  const response = await apiFetch(`${API_BASE_URL}/distributors`);
  if (!response.ok) {
    if (response.status === 403) throw new Error('Forbidden: Insufficient permissions');
    throw new Error('Failed to fetch distributors');
  }
  return response.json();
};

export const createDistributor = async (distributorData: Partial<Distributor>): Promise<Distributor> => {
  const response = await apiFetch(`${API_BASE_URL}/distributors`, {
    method: 'POST',
    body: JSON.stringify(distributorData),
  });
  if (!response.ok) {
    throw new Error('Failed to create distributor');
  }
  return response.json();
};

export const updateDistributor = async (id: number, distributorData: Partial<Distributor>): Promise<Distributor> => {
  const response = await apiFetch(`${API_BASE_URL}/distributors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(distributorData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update distributor');
  }
  return response.json();
};

export const deleteDistributor = async (id: number): Promise<void> => {
  const response = await apiFetch(`${API_BASE_URL}/distributors/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete distributor');
  }
};

export interface ExpiringMedicineItem {
  medicineId: number;
  medicineName: string;
  genericName?: string;
  category?: string;
  manufacturer?: string;
  currentStock: number;
  batchId: number;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  mrp: number;
  sellingPrice: number;
  daysRemaining: number;
  expiryStatus: 'EXPIRED' | 'CRITICAL_30' | 'WARNING_60' | 'UPCOMING_90';
}

export interface DistributorReturnItem {
  id?: number;
  medicineId?: number;
  batchId?: number;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  totalAmount?: number;
  reason?: string;
}

export interface DistributorReturn {
  id: number;
  challanNumber: string;
  returnDate: string;
  totalItems: number;
  totalAmount: number;
  status: string;
  creditNoteNumber?: string;
  reason?: string;
  createdAt: string;
  distributorName?: string;
  supplierName?: string;
  items: DistributorReturnItem[];
}

export const fetchExpiringMedicines = async (days: number = 90): Promise<ExpiringMedicineItem[]> => {
  const response = await apiFetch(`${API_BASE_URL}/distributors/expiring-medicines?days=${days}`);
  if (!response.ok) {
    throw new Error('Failed to fetch expiring medicines');
  }
  return response.json();
};

export const createDistributorReturn = async (data: {
  distributorId?: number;
  supplierId?: number;
  challanNumber?: string;
  returnDate?: string;
  reason?: string;
  items: DistributorReturnItem[];
}): Promise<DistributorReturn> => {
  const response = await apiFetch(`${API_BASE_URL}/distributors/returns`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create distributor return');
  }
  return response.json();
};

export const fetchDistributorReturns = async (): Promise<DistributorReturn[]> => {
  const response = await apiFetch(`${API_BASE_URL}/distributors/returns`);
  if (!response.ok) {
    throw new Error('Failed to fetch distributor returns');
  }
  return response.json();
};

