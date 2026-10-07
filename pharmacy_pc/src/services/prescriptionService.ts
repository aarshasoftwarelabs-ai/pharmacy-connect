import { API_BASE_URL, apiFetch } from '../config/api';

export interface Prescription {
  id: number;
  customer_id: number;
  pharmacy_id: number;
  uploaded_by_user_id: number | null;
  file_url: string;
  file_name: string;
  mime_type: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'REJECTED';
  notes: string | null;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
}

export const PrescriptionService = {
  getPharmacyPrescriptions: async (status?: string): Promise<Prescription[]> => {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.append('status', status);
    
    const response = await apiFetch(`${API_BASE_URL}/prescriptions?${params.toString()}`);
    return await response.json();
  },

  updatePrescriptionStatus: async (id: number, status: string): Promise<Prescription> => {
    const response = await apiFetch(`${API_BASE_URL}/prescriptions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    return await response.json();
  }
};
