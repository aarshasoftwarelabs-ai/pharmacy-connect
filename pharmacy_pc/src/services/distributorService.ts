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
