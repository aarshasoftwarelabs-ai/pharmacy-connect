import { API_BASE_URL, apiFetch } from '../config/api';

export class SupplierService {
  static async getSuppliers() {
    const res = await apiFetch(`${API_BASE_URL}/suppliers`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch suppliers');
    return data.data;
  }

  static async createSupplier(payload: any) {
    const res = await apiFetch(`${API_BASE_URL}/suppliers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create supplier');
    return data.data;
  }

  static async updateSupplier(id: number, payload: any) {
    const res = await apiFetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update supplier');
    return data.data;
  }

  static async deactivateSupplier(id: number) {
    const res = await apiFetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to deactivate supplier');
    return data.data;
  }
}
