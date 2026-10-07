import api from '../config/api';

export interface SoftwareReview {
  id?: string;
  pharmacy_id?: string;
  pharmacy_name?: string;
  ui_rating: number;
  features_rating: number;
  service_rating: number;
  comment: string;
  is_public?: boolean;
  created_at?: string;
}

export const ReviewService = {
  getPublicReviews: async (): Promise<SoftwareReview[]> => {
    const response = await api.get('/reviews/public');
    return response.data;
  },

  getMyReview: async (): Promise<SoftwareReview | null> => {
    const response = await api.get('/reviews/my');
    return response.data;
  },

  submitReview: async (review: Partial<SoftwareReview>): Promise<SoftwareReview> => {
    const response = await api.post('/reviews', review);
    return response.data;
  }
};
