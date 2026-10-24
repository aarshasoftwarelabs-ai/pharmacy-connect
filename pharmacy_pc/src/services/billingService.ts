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
   * Create a new bill (with offline resilience and auto-queue)
   */
  static async createBill(billData: any): Promise<Bill> {
    const { offlineSyncService } = await import('./offlineSyncService');

    // If device is offline, instantly queue locally
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn('Network offline: queuing bill locally for cloud auto-sync.');
      return offlineSyncService.queueBill(billData);
    }

    try {
      const response = await apiFetch(`${API_BASE_URL}/billing`, {
        method: 'POST',
        body: JSON.stringify(billData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create bill');
      }
      
      return data.data;
    } catch (networkOrFetchErr: any) {
      // If network failed (e.g. Failed to fetch, timeout, connection refused)
      if (
        networkOrFetchErr?.name === 'TypeError' ||
        networkOrFetchErr?.message?.includes('Failed to fetch') ||
        networkOrFetchErr?.message?.includes('NetworkError') ||
        (typeof navigator !== 'undefined' && !navigator.onLine)
      ) {
        console.warn('Backend server unreachable during bill save. Queuing bill offline for auto-sync:', networkOrFetchErr);
        return offlineSyncService.queueBill(billData);
      }
      throw networkOrFetchErr;
    }
  }

  /**
   * Scan Prescription using AI
   */
  static async scanPrescription(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('prescriptionImage', file);

    const response = await apiFetch(`${API_BASE_URL}/billing/scan-prescription`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (data.isInvalidImage) {
        throw new Error('please Prescription Image Upload now this not image Prescription');
      }
      throw new Error(data.message || 'Failed to scan prescription');
    }
    
    return data.data;
  }

  /**
   * Update Delivery Staff Assignment and Cash Collection
   */
  static async updateDeliveryAssignment(billId: number, data: {
    deliveryStaffId?: number | null;
    deliveryStatus?: string;
    cashCollectionStatus?: string;
    cashCollectedAmount?: number;
    deliveryNotes?: string;
  }): Promise<Bill> {
    const response = await apiFetch(`${API_BASE_URL}/billing/${billId}/delivery`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.message || 'Failed to update delivery assignment');
    }

    return resData.data;
  }

  /**
   * Fetch any pending barcode items scanned from mobile phones
   */
  static async getPendingLiveScans(pharmacyId: number): Promise<any[]> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/billing/pending-scans/${pharmacyId}`);
      if (!response.ok) return [];
      const res = await response.json();
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Acknowledge that a scanned item has been added into PC POS cart
   */
  static async acknowledgeLiveScan(pharmacyId: number, scanId: string): Promise<void> {
    try {
      await apiFetch(`${API_BASE_URL}/billing/pending-scans/${pharmacyId}/${scanId}`, {
        method: 'DELETE'
      });
    } catch {}
  }

  /**
   * Clear all pending scans for a pharmacy
   */
  static async clearPendingLiveScans(pharmacyId: number): Promise<void> {
    try {
      await apiFetch(`${API_BASE_URL}/billing/pending-scans/${pharmacyId}`, {
        method: 'DELETE'
      });
    } catch {}
  }

  /**
   * Resend automated bill invoice via WhatsApp/SMS gateway
   */
  static async resendBillMessage(billId: number, phone?: string): Promise<{ success: boolean; message: string }> {
    const response = await apiFetch(`${API_BASE_URL}/billing/${billId}/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.message || 'Failed to dispatch invoice message');
    }

    return resData;
  }
}
