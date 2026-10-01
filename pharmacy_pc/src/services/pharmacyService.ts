import { API_BASE_URL, apiFetch } from '../config/api';

export interface PharmacyProfile {
  id: number;
  ownerId?: number;
  name: string;
  address: string;
  phone: string;
  email?: string;
  regNo?: string;
  gstin?: string;
  gstRegistered?: boolean;
  state?: string;
  ownerName?: string;
  planType?: string;
  trialStartDate?: string;
  subscriptionEndDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class PharmacyService {
  static async getPharmacyProfile(pharmacyId: number): Promise<PharmacyProfile> {
    const response = await apiFetch(`${API_BASE_URL}/pharmacies/${pharmacyId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Pharmacy not found');
      }
      throw new Error(`Failed to fetch pharmacy profile: ${response.statusText}`);
    }
    
    return await response.json();
  }

  static async updatePharmacyProfile(pharmacyId: number, data: Partial<PharmacyProfile>): Promise<PharmacyProfile> {
    const response = await apiFetch(`${API_BASE_URL}/pharmacies/${pharmacyId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 403) throw new Error('Forbidden: Insufficient permissions');
      throw new Error('Failed to update pharmacy profile');
    }

    return await response.json();
  }

  static async updateSubscription(pharmacyId: number, planType: string, durationMonths?: number): Promise<PharmacyProfile> {
    const response = await apiFetch(`${API_BASE_URL}/pharmacies/${pharmacyId}/subscription`, {
      method: 'POST',
      body: JSON.stringify({ planType, durationMonths }),
    });

    if (!response.ok) {
      if (response.status === 403) throw new Error('Forbidden: Insufficient permissions');
      throw new Error('Failed to update subscription');
    }

    return await response.json();
  }

  static async getSubscriptionStats(): Promise<{ paidCount: number }> {
    const response = await apiFetch(`${API_BASE_URL}/pharmacies/stats/subscription`);
    
    if (!response.ok) {
      if (response.status === 403) throw new Error('Forbidden: Insufficient permissions');
      throw new Error('Failed to fetch subscription stats');
    }
    
    const result = await response.json();
    return result.data;
  }
}
