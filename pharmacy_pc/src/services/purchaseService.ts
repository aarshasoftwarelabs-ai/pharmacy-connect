import { API_BASE_URL, apiFetch } from '../config/api';

export class PurchaseService {
  static async getPurchases() {
    const res = await apiFetch(`${API_BASE_URL}/purchases`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch purchases');
    return data.data;
  }

  static async getPurchaseItems(id: number) {
    const res = await apiFetch(`${API_BASE_URL}/purchases/${id}/items`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch items');
    return data.data;
  }

  static async createPurchase(payload: any) {
    const res = await apiFetch(`${API_BASE_URL}/purchases`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create purchase');
    return data.data;
  }

  static async scanBill(file: File) {
    const formData = new FormData();
    formData.append('billImage', file);

    const res = await apiFetch(`${API_BASE_URL}/purchases/scan-bill`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to scan bill using AI');
    return data.data;
  }
}
