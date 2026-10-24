import { API_BASE_URL, apiFetch } from '../config/api';

export interface MessagingSettings {
  id?: number;
  pharmacyId: number;
  autoSendBillSms: boolean;
  autoSendBillWhatsapp: boolean;
  preferredChannel: 'WHATSAPP' | 'SMS' | 'WHATSAPP_AND_SMS';
  gatewayProvider: 'FAST2SMS' | 'MSG91' | 'WHATSAPP_CLOUD' | 'SIMULATED';
  smsApiKey?: string;
  smsApiKeyMasked?: string;
  smsSenderId?: string;
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  whatsappAccessTokenMasked?: string;
  whatsappTemplateName?: string;
  customSmsTemplate?: string;
  customWhatsappTemplate?: string;
  isActive: boolean;
  isConfigured?: boolean;
}

export interface MessageLogItem {
  id: number;
  billId: number | null;
  billNumber?: string;
  recipientPhone: string;
  channel: 'SMS' | 'WHATSAPP';
  gatewayProvider: string;
  status: 'SENT' | 'FAILED' | 'SIMULATED';
  messageContent: string;
  errorMessage?: string;
  createdAt: string;
}

export class MessagingService {
  /**
   * Get pharmacy messaging settings
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
   * Update messaging settings
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
   * Send a test message via SMS or WhatsApp gateway
   */
  static async sendTestMessage(phone: string, channel: 'SMS' | 'WHATSAPP'): Promise<{ success: boolean; message: string; gateway: string; status: string }> {
    const res = await apiFetch(`${API_BASE_URL}/messaging/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, channel }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Test dispatch failed');
    }
    return json;
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
