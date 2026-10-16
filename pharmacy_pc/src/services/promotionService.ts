import { API_BASE_URL as API_URL, apiFetch as fetch } from '../config/api';
import { SponsoredBanner } from '../types/promotion';

export const PromotionService = {
  /**
   * Get all active sponsored banners
   */
  getActiveBanners: async (): Promise<SponsoredBanner[]> => {
    try {
      const response = await fetch(`${API_URL}/promotions/banners`);
      if (!response.ok) return [];
      const res = await response.json();
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  /**
   * Get all sponsored banners (including inactive, for Admin management)
   */
  getAllBanners: async (): Promise<SponsoredBanner[]> => {
    try {
      const response = await fetch(`${API_URL}/promotions/banners/all`);
      if (!response.ok) return [];
      const res = await response.json();
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  /**
   * Create a new sponsored banner
   */
  createBanner: async (data: Partial<SponsoredBanner>): Promise<SponsoredBanner> => {
    const response = await fetch(`${API_URL}/promotions/banners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const res = await response.json();
    if (!response.ok) throw new Error(res.message || 'Failed to create banner');
    return res.data;
  },

  /**
   * Update an existing sponsored banner
   */
  updateBanner: async (id: number, data: Partial<SponsoredBanner>): Promise<SponsoredBanner> => {
    const response = await fetch(`${API_URL}/promotions/banners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const res = await response.json();
    if (!response.ok) throw new Error(res.message || 'Failed to update banner');
    return res.data;
  },

  /**
   * Delete a sponsored banner
   */
  deleteBanner: async (id: number): Promise<boolean> => {
    const response = await fetch(`${API_URL}/promotions/banners/${id}`, {
      method: 'DELETE',
    });
    const res = await response.json();
    if (!response.ok) throw new Error(res.message || 'Failed to delete banner');
    return true;
  },
};
