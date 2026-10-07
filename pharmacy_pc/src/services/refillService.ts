import { API_BASE_URL, apiFetch } from '../config/api';

export interface RefillReminder {
  id: number;
  customer_id: number;
  pharmacy_id: number;
  medicine_id: number | null;
  medicine_name: string | null;
  last_purchase_date: string | null;
  estimated_refill_date: string;
  status: 'PENDING' | 'SENT' | 'DISMISSED' | 'COMPLETED';
  customer_name: string;
  customer_phone: string;
}

export const RefillService = {
  calculateRefills: async (): Promise<{ success: boolean, count: number }> => {
    const response = await apiFetch(`${API_BASE_URL}/refills/calculate`, { method: 'POST' });
    return await response.json();
  },

  getPharmacyReminders: async (status?: string): Promise<RefillReminder[]> => {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.append('status', status);
    
    const response = await apiFetch(`${API_BASE_URL}/refills?${params.toString()}`);
    return await response.json();
  },

  updateReminderStatus: async (id: number, status: string): Promise<RefillReminder> => {
    const response = await apiFetch(`${API_BASE_URL}/refills/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    return await response.json();
  }
};
