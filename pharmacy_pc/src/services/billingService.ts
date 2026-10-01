import { API_BASE_URL, apiFetch } from '../config/api';
import { Bill, BillingQueueItem } from '../types/billing';

export class BillingService {
  /**
   * Get the billing queue (confirmed requests without bills)
   */
  static async getBillingQueue(pharmacyId: number): Promise<BillingQueueItem[]> {
    const response = await apiFetch(`${API_BASE_URL}/billing/pharmacy/${pharmacyId}/queue`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch billing queue');
    }
    
    return data.data;
  }

  /**
   * Get all finalized bills for the pharmacy
   */
  static async getPharmacyBills(pharmacyId: number): Promise<Bill[]> {
    const response = await apiFetch(`${API_BASE_URL}/billing/pharmacy/${pharmacyId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch bills');
    }
    
    return data.data;
  }

  /**
   * Get a single bill by ID
   */
  static async getBillById(billId: number): Promise<Bill> {
    const response = await apiFetch(`${API_BASE_URL}/billing/${billId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch bill');
    }
    
    return data.data;
  }

  /**
   * Create a new bill
   */
  static async createBill(billData: any): Promise<Bill> {
    const response = await apiFetch(`${API_BASE_URL}/billing`, {
      method: 'POST',
      body: JSON.stringify(billData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create bill');
    }
    
    return data.data;
  }
}
