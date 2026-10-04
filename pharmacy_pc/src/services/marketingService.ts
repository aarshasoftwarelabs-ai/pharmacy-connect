import { API_URL } from '../config/development';

export interface Offer {
  id: number;
  pharmacy_id: number;
  title: string;
  description?: string;
  coupon_code: string;
  discount_percentage?: number;
  max_discount_amount?: number;
  min_order_value?: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

export interface Campaign {
  id: number;
  pharmacy_id: number;
  title: string;
  message: string;
  target_audience: string;
  status: string;
  sent_at: string;
}

export const MarketingService = {
  getOffers: async (pharmacyId: number): Promise<Offer[]> => {
    try {
      const response = await fetch(`${API_URL}/api/marketing/offers/${pharmacyId}`);
      if (!response.ok) throw new Error('Failed to fetch offers');
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  createOffer: async (pharmacyId: number, data: Partial<Offer>): Promise<Offer> => {
    const response = await fetch(`${API_URL}/api/marketing/offers/${pharmacyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create offer');
    return await response.json();
  },

  updateOffer: async (id: number, data: Partial<Offer>): Promise<Offer> => {
    const response = await fetch(`${API_URL}/api/marketing/offers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update offer');
    return await response.json();
  },

  deleteOffer: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/marketing/offers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete offer');
  },

  getCampaigns: async (pharmacyId: number): Promise<Campaign[]> => {
    try {
      const response = await fetch(`${API_URL}/api/marketing/campaigns/${pharmacyId}`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  sendCampaign: async (pharmacyId: number, data: Partial<Campaign>): Promise<Campaign> => {
    const response = await fetch(`${API_URL}/api/marketing/campaigns/${pharmacyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to send campaign');
    return await response.json();
  },
};
