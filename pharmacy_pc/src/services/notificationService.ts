import { API_BASE_URL as API_URL, apiFetch as fetch } from '../config/api';

export interface Notification {
  id: number;
  recipient_user_id: number;
  pharmacy_id: number;
  type: string;
  title: string;
  message: string;
  reference_type?: string;
  reference_id?: number;
  data?: any;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export const NotificationService = {
  getNotifications: async (limit = 50, offset = 0): Promise<Notification[]> => {
    try {
      const response = await fetch(`${API_URL}/api/notifications?limit=${limit}&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/unread-count`);
      if (!response.ok) throw new Error('Failed to fetch unread count');
      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  },

  markAsRead: async (id: number): Promise<void> => {
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, { method: 'POST' });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, { method: 'POST' });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }
};
