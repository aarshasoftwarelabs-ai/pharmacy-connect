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
