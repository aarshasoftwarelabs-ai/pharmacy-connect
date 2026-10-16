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

const CACHE_KEY = 'davasetu_distributors_cache';

const getLocalDistributors = (): Distributor[] => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

const setLocalDistributors = (data: Distributor[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save distributors to local storage', e);
  }
};

export const fetchDistributors = async (): Promise<Distributor[]> => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/distributors`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        setLocalDistributors(data);
        return data;
      }
    }
  } catch (err) {
    console.warn('Network issue fetching distributors, using local data:', err);
  }
  // Return cached or empty list gracefully
  return getLocalDistributors();
};

export const createDistributor = async (distributorData: Partial<Distributor>): Promise<Distributor> => {
  const current = getLocalDistributors();
  const localItem: Distributor = {
    id: Date.now(),
    name: distributorData.name || '',
    email: distributorData.email || null,
    whatsappNumber: distributorData.whatsappNumber || null,
    address: distributorData.address || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const response = await apiFetch(`${API_BASE_URL}/distributors`, {
      method: 'POST',
      body: JSON.stringify(distributorData),
    });
    if (response.ok) {
      const serverItem = await response.json();
      const updated = [serverItem, ...current.filter(d => d.id !== serverItem.id)];
      setLocalDistributors(updated);
      return serverItem;
    }
  } catch (err) {
    console.warn('Backend unavailable, saved distributor locally:', err);
  }

  const updated = [localItem, ...current];
  setLocalDistributors(updated);
  return localItem;
};

export const updateDistributor = async (id: number, distributorData: Partial<Distributor>): Promise<Distributor> => {
  const current = getLocalDistributors();
  const updated = current.map(d => d.id === id ? { ...d, ...distributorData, updatedAt: new Date().toISOString() } : d);
  setLocalDistributors(updated);

  try {
    const response = await apiFetch(`${API_BASE_URL}/distributors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(distributorData),
    });
    if (response.ok) {
      const serverItem = await response.json();
      const refreshed = current.map(d => d.id === id ? serverItem : d);
      setLocalDistributors(refreshed);
      return serverItem;
    }
  } catch (err) {
    console.warn('Backend unavailable, updated distributor locally:', err);
  }

  return updated.find(d => d.id === id) || (distributorData as Distributor);
};

export const deleteDistributor = async (id: number): Promise<void> => {
  const current = getLocalDistributors();
  const updated = current.filter(d => d.id !== id);
  setLocalDistributors(updated);

  try {
    await apiFetch(`${API_BASE_URL}/distributors/${id}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('Backend unavailable, deleted distributor locally:', err);
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

