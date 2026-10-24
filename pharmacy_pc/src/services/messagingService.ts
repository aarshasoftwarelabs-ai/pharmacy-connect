import { API_BASE_URL, apiFetch } from '../config/api';

export interface MessagingSettings {
  id?: number;
  pharmacyId: number;
  autoSendBillWhatsapp: boolean;
  gatewayProvider?: 'SIMULATED' | string;
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  whatsappAccessTokenMasked?: string;
  whatsappTemplateName?: string;
  customWhatsappTemplate?: string;
  isActive: boolean;
  isConfigured?: boolean;
}

export interface MessageLogItem {
  id: number;
  billId: number | null;
  billNumber?: string;
  recipientPhone: string;
  channel: 'WHATSAPP';
  gatewayProvider: string;
  status: 'SENT' | 'FAILED' | 'SIMULATED';
  messageContent: string;
  errorMessage?: string;
  createdAt: string;
}

export class MessagingService {
  /**
   * Get pharmacy WhatsApp messaging settings
   */
  static async getSettings(): Promise<MessagingSettings> {
    const res = await apiFetch(`${API_BASE_URL}/messaging/settings`);
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch messaging settings');
    }
    return json.data;
  }

  /**
   * Update WhatsApp messaging settings
   */
  static async updateSettings(settings: Partial<MessagingSettings>): Promise<MessagingSettings> {
    const res = await apiFetch(`${API_BASE_URL}/messaging/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to update messaging settings');
    }
    return json.data;
  }

  /**
   * Send a test invoice via WhatsApp gateway
   */
  static async sendTestMessage(phone: string): Promise<{ success: boolean; message: string; gateway: string; status: string; waUrl?: string }> {
    const res = await apiFetch(`${API_BASE_URL}/messaging/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'WhatsApp test dispatch failed');
    }
    return {
      success: json.success,
      message: json.message,
      gateway: json.data?.gateway,
      status: json.data?.status,
      waUrl: json.data?.waUrl,
    };
  }

  /**
   * Fetch recent delivery logs
   */
  static async getLogs(limit = 20): Promise<MessageLogItem[]> {
    const res = await apiFetch(`${API_BASE_URL}/messaging/logs?limit=${limit}`);
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch logs');
    }
    return json.data || [];
  }
}
