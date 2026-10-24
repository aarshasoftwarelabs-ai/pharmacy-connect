import pool from '../config/database';
import { env } from '../config/env';

export interface MessagingSettings {
  id?: number;
  pharmacyId: number;
  autoSendBillWhatsapp: boolean;
  gatewayProvider: 'WHATSAPP_CLOUD' | 'SIMULATED';
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  whatsappTemplateName?: string;
  customWhatsappTemplate?: string;
  isActive: boolean;
  isConfigured?: boolean;
}

export interface DispatchResult {
  channel: 'WHATSAPP';
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  gateway: string;
  phone: string;
  message?: string;
  error?: string;
}

export class MessagingService {
  /**
   * Normalize Indian phone numbers:
   * Strips non-digits, extracts 10-digit base, returns 10-digit and 91-prefixed versions.
   */
  static normalizePhone(rawPhone: string): { tenDigit: string; withCountryCode: string; isValid: boolean } {
    if (!rawPhone) return { tenDigit: '', withCountryCode: '', isValid: false };
    const digits = rawPhone.replace(/\D/g, '');
    
    let tenDigit = '';
    if (digits.length === 10) {
      tenDigit = digits;
    } else if (digits.length === 12 && digits.startsWith('91')) {
      tenDigit = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
      tenDigit = digits.slice(1);
    } else if (digits.length > 10) {
      tenDigit = digits.slice(-10);
    }

    const isValid = /^[6-9]\d{9}$/.test(tenDigit);
    return {
      tenDigit,
      withCountryCode: `91${tenDigit}`,
      isValid
    };
  }

  /**
   * Fetch WhatsApp messaging configuration for a pharmacy
   */
  static async getSettings(pharmacyId: number): Promise<MessagingSettings> {
    try {
      const res = await pool.query(
        `SELECT * FROM pharmacy_messaging_settings WHERE pharmacy_id = $1`,
        [pharmacyId]
      );

      if (res.rows.length === 0) {
        return {
          pharmacyId,
          autoSendBillWhatsapp: true,
          gatewayProvider: 'WHATSAPP_CLOUD',
          whatsappPhoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID || '',
          whatsappAccessToken: env.WHATSAPP_ACCESS_TOKEN || '',
          isActive: true,
          isConfigured: !!(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID)
        };
      }

      const row = res.rows[0];
      const hasKey = !!(row.whatsapp_access_token || env.WHATSAPP_ACCESS_TOKEN);

      return {
        id: row.id,
        pharmacyId: row.pharmacy_id,
        autoSendBillWhatsapp: row.auto_send_bill_whatsapp ?? true,
        gatewayProvider: row.gateway_provider === 'SIMULATED' ? 'SIMULATED' : 'WHATSAPP_CLOUD',
        whatsappPhoneNumberId: row.whatsapp_phone_number_id || env.WHATSAPP_PHONE_NUMBER_ID || '',
        whatsappAccessToken: row.whatsapp_access_token || env.WHATSAPP_ACCESS_TOKEN || '',
        whatsappTemplateName: row.whatsapp_template_name || 'bill_invoice',
        customWhatsappTemplate: row.custom_whatsapp_template,
        isActive: row.is_active ?? true,
        isConfigured: hasKey
      };
    } catch (error) {
      console.warn('Could not read messaging settings, falling back to default:', error);
      return {
        pharmacyId,
        autoSendBillWhatsapp: true,
        gatewayProvider: 'WHATSAPP_CLOUD',
        isActive: true,
        isConfigured: false
      };
    }
  }

  /**
   * Save WhatsApp messaging configuration for a pharmacy
   */
  static async updateSettings(pharmacyId: number, data: Partial<MessagingSettings>): Promise<MessagingSettings> {
    const query = `
      INSERT INTO pharmacy_messaging_settings (
        pharmacy_id, auto_send_bill_whatsapp, preferred_channel,
        gateway_provider, whatsapp_phone_number_id, whatsapp_access_token,
        whatsapp_template_name, custom_whatsapp_template, is_active, updated_at
      ) VALUES ($1, $2, 'WHATSAPP', $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      ON CONFLICT (pharmacy_id) DO UPDATE SET
        auto_send_bill_whatsapp = EXCLUDED.auto_send_bill_whatsapp,
        preferred_channel = 'WHATSAPP',
        gateway_provider = EXCLUDED.gateway_provider,
        whatsapp_phone_number_id = COALESCE(EXCLUDED.whatsapp_phone_number_id, pharmacy_messaging_settings.whatsapp_phone_number_id),
        whatsapp_access_token = COALESCE(EXCLUDED.whatsapp_access_token, pharmacy_messaging_settings.whatsapp_access_token),
        whatsapp_template_name = COALESCE(EXCLUDED.whatsapp_template_name, pharmacy_messaging_settings.whatsapp_template_name),
        custom_whatsapp_template = EXCLUDED.custom_whatsapp_template,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      pharmacyId,
      data.autoSendBillWhatsapp !== undefined ? data.autoSendBillWhatsapp : true,
      data.gatewayProvider || 'WHATSAPP_CLOUD',
      data.whatsappPhoneNumberId || '',
      data.whatsappAccessToken || '',
      data.whatsappTemplateName || 'bill_invoice',
      data.customWhatsappTemplate || null,
      data.isActive !== undefined ? data.isActive : true
    ];

    await pool.query(query, values);
    return this.getSettings(pharmacyId);
  }

  /**
   * Format WhatsApp receipt text
   */
  static formatWhatsAppText(bill: any, pharmacy: { name: string; phone?: string }): string {
    const formattedDate = new Date(bill.createdAt || bill.billDate || Date.now()).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const items = bill.items || [];
    const itemsList = items
      .map((item: any, idx: number) => {
        const lineTotal = Number(item.lineTotal || (item.quantity * item.unitPrice)).toFixed(2);
        return `${idx + 1}. *${item.medicineName || item.name}* (Qty: ${item.quantity}) - ₹${lineTotal}`;
      })
      .join('\n');

    let text = `🧾 *TAX INVOICE / DIGITAL RECEIPT*\n`;
    text += `🏥 *${pharmacy.name || 'DavaSetu Medical Store'}*\n`;
    if (pharmacy.phone) text += `📞 Helpline: ${pharmacy.phone}\n`;
    text += `------------------------------------\n`;
    text += `📄 *Bill No:* ${bill.billNumber}\n`;
    text += `👤 *Customer:* ${bill.customerName || 'Valued Patient'}\n`;
    text += `📅 *Date:* ${formattedDate}\n`;
    text += `💳 *Payment:* ${bill.paymentStatus || 'PAID'}\n`;
    text += `------------------------------------\n`;
    text += `💊 *Prescribed Medicines:*\n`;
    text += `${itemsList || 'General Medical Supplies'}\n`;
    text += `------------------------------------\n`;
    text += `Subtotal: ₹${Number(bill.subtotal || bill.total).toFixed(2)}\n`;
    if (Number(bill.discount) > 0) {
      text += `Discount: -₹${Number(bill.discount).toFixed(2)}\n`;
    }
    if (Number(bill.totalGst || 0) > 0) {
      text += `GST Included: ₹${Number(bill.totalGst || 0).toFixed(2)}\n`;
    }
    text += `*GRAND TOTAL: ₹${Number(bill.total).toFixed(2)}*\n`;
    text += `------------------------------------\n`;
    text += `🙏 Thank you for choosing us! Wishing you good health and a speedy recovery.\n`;
    text += `_Powered by DavaSetu Healthcare Solutions_`;

    return text;
  }

  /**
   * Send WhatsApp message via Meta Cloud API
   */
  static async sendViaWhatsAppCloud(
    phoneWithCode: string,
    message: string,
    phoneNumberId: string,
    accessToken: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneWithCode,
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        })
      });

      const data = await response.json();
      if (response.ok && data.messages) {
        return { success: true, data };
      }
      return { success: false, data, error: data.error?.message || 'WhatsApp Cloud API returned error' };
    } catch (err: any) {
      return { success: false, error: err.message || 'WhatsApp Cloud API network timeout' };
    }
  }

  /**
   * Log delivery result to database
   */
  static async logMessage(
    pharmacyId: number,
    billId: number | null,
    phone: string,
    channel: 'WHATSAPP',
    provider: string,
    status: 'SENT' | 'SIMULATED' | 'FAILED',
    messageContent: string,
    gatewayResponse?: any,
    errorMessage?: string
  ) {
    try {
      await pool.query(
        `INSERT INTO bill_message_logs (
          pharmacy_id, bill_id, recipient_phone, channel, gateway_provider,
          status, message_content, gateway_response, error_message, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
        [
          pharmacyId,
          billId,
          phone,
          channel,
          provider,
          status,
          messageContent,
          gatewayResponse ? JSON.stringify(gatewayResponse) : null,
          errorMessage || null
        ]
      );
    } catch (logErr) {
      console.warn('Non-fatal error logging WhatsApp bill message:', logErr);
    }
  }

  /**
   * Main Dispatch Routine: Triggered automatically when a bill is created.
   * Completely safe and non-blocking: never throws or crashes caller.
   */
  static async dispatchAutoBillMessage(bill: any): Promise<DispatchResult[]> {
    const results: DispatchResult[] = [];
    try {
      const pharmacyId = Number(bill.pharmacyId || bill.pharmacy_id);
      const rawPhone = bill.customerPhone || bill.customer_phone;
      if (!pharmacyId || !rawPhone) {
        return results;
      }

      const { withCountryCode, isValid } = this.normalizePhone(rawPhone);
      if (!isValid) {
        console.log(`[WhatsApp Gateway] Skipping auto-dispatch: invalid phone "${rawPhone}"`);
        return results;
      }

      // Fetch settings & pharmacy details
      const [settings, pharmacyRes] = await Promise.all([
        this.getSettings(pharmacyId),
        pool.query('SELECT name, phone FROM pharmacies WHERE id = $1', [pharmacyId])
      ]);

      if (!settings.isActive || !settings.autoSendBillWhatsapp) {
        console.log(`[WhatsApp Gateway] Auto-messaging is disabled for pharmacy #${pharmacyId}`);
        return results;
      }

      const pharmacy = pharmacyRes.rows[0] || { name: 'DavaSetu Pharmacy', phone: '' };
      const waText = this.formatWhatsAppText(bill, pharmacy);

      if (settings.whatsappAccessToken && settings.whatsappPhoneNumberId) {
        // Real live Meta Cloud WhatsApp
        const waRes = await this.sendViaWhatsAppCloud(
          withCountryCode,
          waText,
          settings.whatsappPhoneNumberId,
          settings.whatsappAccessToken
        );

        if (waRes.success) {
          await this.logMessage(pharmacyId, bill.id, withCountryCode, 'WHATSAPP', 'WHATSAPP_CLOUD', 'SENT', waText, waRes.data);
          results.push({ channel: 'WHATSAPP', status: 'SENT', gateway: 'WHATSAPP_CLOUD', phone: withCountryCode });
        } else {
          await this.logMessage(pharmacyId, bill.id, withCountryCode, 'WHATSAPP', 'WHATSAPP_CLOUD', 'FAILED', waText, waRes.data, waRes.error);
          results.push({ channel: 'WHATSAPP', status: 'FAILED', gateway: 'WHATSAPP_CLOUD', phone: withCountryCode, error: waRes.error });
        }
      } else {
        // Cloud Simulated / Auto-Log Mode (Zero Setup Mode)
        await this.logMessage(pharmacyId, bill.id, withCountryCode, 'WHATSAPP', 'SIMULATED', 'SIMULATED', waText, { note: 'Auto-logged receipt in WhatsApp cloud queue' });
        results.push({ channel: 'WHATSAPP', status: 'SIMULATED', gateway: 'SIMULATED', phone: withCountryCode });
      }

      console.log(`[WhatsApp Gateway] Auto-dispatch finished for Bill #${bill.billNumber}:`, results);
    } catch (err) {
      console.error('[WhatsApp Gateway] Non-fatal error during auto-bill dispatch:', err);
    }
    return results;
  }

  /**
   * Send a test WhatsApp receipt to any phone number
   */
  static async sendTestMessage(
    pharmacyId: number,
    targetPhone: string
  ): Promise<{ success: boolean; message: string; gateway: string; status: string; data?: any; waUrl?: string }> {
    const { withCountryCode, isValid } = this.normalizePhone(targetPhone);
    if (!isValid) {
      throw new Error('Please enter a valid 10-digit Indian mobile number');
    }

    const settings = await this.getSettings(pharmacyId);
    const pharmacyRes = await pool.query('SELECT name, phone FROM pharmacies WHERE id = $1', [pharmacyId]);
    const pharmacy = pharmacyRes.rows[0] || { name: 'DavaSetu Test Pharmacy', phone: '9876543210' };

    const mockBill = {
      id: null,
      billNumber: `TEST-${Date.now().toString().slice(-4)}`,
      customerName: 'Test Customer',
      createdAt: new Date().toISOString(),
      subtotal: 150.00,
      discount: 10.00,
      total: 140.00,
      paymentStatus: 'PAID',
      items: [
        { medicineName: 'Paracetamol 650mg', quantity: 1, unitPrice: 30, lineTotal: 30 },
        { medicineName: 'Azithromycin 500mg', quantity: 1, unitPrice: 110, lineTotal: 110 }
      ]
    };

    const waText = this.formatWhatsAppText(mockBill, pharmacy);
    const waUrl = `https://wa.me/${withCountryCode}?text=${encodeURIComponent(waText)}`;

    if (settings.whatsappAccessToken && settings.whatsappPhoneNumberId) {
      const res = await this.sendViaWhatsAppCloud(withCountryCode, waText, settings.whatsappPhoneNumberId, settings.whatsappAccessToken);
      if (res.success) {
        await this.logMessage(pharmacyId, null, withCountryCode, 'WHATSAPP', 'WHATSAPP_CLOUD', 'SENT', waText, res.data);
        return { success: true, message: `Live WhatsApp message delivered to +${withCountryCode}!`, gateway: 'WHATSAPP_CLOUD', status: 'SENT', data: res.data, waUrl };
      }
      await this.logMessage(pharmacyId, null, withCountryCode, 'WHATSAPP', 'WHATSAPP_CLOUD', 'FAILED', waText, res.data, res.error);
      return { success: false, message: `WhatsApp Cloud API error: ${res.error}`, gateway: 'WHATSAPP_CLOUD', status: 'FAILED', waUrl };
    }

    await this.logMessage(pharmacyId, null, withCountryCode, 'WHATSAPP', 'SIMULATED', 'SIMULATED', waText, { test: true });
    return { success: true, message: `Simulated WhatsApp invoice recorded for +${withCountryCode}. (Provide Meta WhatsApp Cloud API credentials to dispatch live messages).`, gateway: 'SIMULATED', status: 'SIMULATED', waUrl };
  }

  /**
   * Fetch recent delivery logs
   */
  static async getLogs(pharmacyId: number, limit = 50) {
    const res = await pool.query(
      `SELECT l.id, l.bill_id AS "billId", l.recipient_phone AS "recipientPhone",
              l.channel, l.gateway_provider AS "gatewayProvider", l.status,
              l.message_content AS "messageContent", l.error_message AS "errorMessage",
              l.created_at AS "createdAt", b.bill_number AS "billNumber"
       FROM bill_message_logs l
       LEFT JOIN bills b ON l.bill_id = b.id
       WHERE l.pharmacy_id = $1
       ORDER BY l.created_at DESC
       LIMIT $2`,
      [pharmacyId, limit]
    );
    return res.rows;
  }
}
