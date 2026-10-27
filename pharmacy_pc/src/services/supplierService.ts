import { API_BASE_URL, apiFetch } from '../config/api';

export interface Supplier {
  id?: number;
  pharmacy_id?: number;
  supplier_name: string;
  contact_person?: string | null;
  mobile?: string | null;
  alternate_phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstin?: string | null;
  drug_license_number?: string | null;
  fssai_number?: string | null;
  pan_number?: string | null;
  credit_period_days?: number | null;
  opening_balance?: number | string | null;
  current_balance?: number | string | null;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  branch_name?: string | null;
  upi_id?: string | null;
  deals_in_brands?: string | null;
  notes?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

export class SupplierService {
  static async getSuppliers(): Promise<Supplier[]> {
    const res = await apiFetch(`${API_BASE_URL}/suppliers`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch suppliers');
    return data.data;
  }

  static async getSupplierById(id: number): Promise<Supplier> {
    const res = await apiFetch(`${API_BASE_URL}/suppliers/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch supplier');
    return data.data;
  }

  static async createSupplier(payload: Partial<Supplier>): Promise<Supplier> {
    const res = await apiFetch(`${API_BASE_URL}/suppliers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create supplier');
    return data.data;
  }

  static async updateSupplier(id: number, payload: Partial<Supplier>): Promise<Supplier> {
    const res = await apiFetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update supplier');
    return data.data;
  }

  static async deactivateSupplier(id: number): Promise<Supplier> {
    const res = await apiFetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to deactivate supplier');
    return data.data;
  }
}

