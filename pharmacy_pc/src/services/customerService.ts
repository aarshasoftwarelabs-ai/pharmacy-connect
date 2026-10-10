import { API_BASE_URL, apiFetch } from '../config/api';

export interface CustomerProfile {
  id: number;
  pharmacy_id: number;
  user_id: number | null;
  display_name: string;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  total_bills: number;
  total_spend: number;
  last_purchase_date: string | null;
}

export const CustomerService = {
  getCustomers: async (search?: string, filter?: string): Promise<CustomerProfile[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filter && filter !== 'All') params.append('filter', filter.toLowerCase());
    
    const response = await apiFetch(`${API_BASE_URL}/customers?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to fetch customers');
    }
    return data;
  },

  getCustomerById: async (id: number): Promise<CustomerProfile> => {
    const response = await apiFetch(`${API_BASE_URL}/customers/${id}`);
    return await response.json();
  },

  getCustomerBills: async (id: number): Promise<any[]> => {
    const response = await apiFetch(`${API_BASE_URL}/customers/${id}/bills`);
    return await response.json();
  },

  getCustomerRequests: async (id: number): Promise<any[]> => {
    const response = await apiFetch(`${API_BASE_URL}/customers/${id}/requests`);
    return await response.json();
  },

  updateCustomer: async (id: number, data: Partial<CustomerProfile>): Promise<CustomerProfile> => {
    const response = await apiFetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return await response.json();
  }
};
