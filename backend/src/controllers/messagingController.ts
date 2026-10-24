import { Request, Response, NextFunction } from 'express';
import { MessagingService } from '../services/messagingService';
import { BillingService } from '../services/billingService';

export class MessagingController {
  /**
   * Get pharmacy messaging settings
   */
  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = (req as any).user?.pharmacyId || Number(req.query.pharmacyId) || 1;
      const settings = await MessagingService.getSettings(Number(pharmacyId));
      
      // Mask sensitive secret keys if returning to client
      const safeSettings = {
        ...settings,
        smsApiKeyMasked: settings.smsApiKey ? `${settings.smsApiKey.slice(0, 4)}••••${settings.smsApiKey.slice(-4)}` : '',
        whatsappAccessTokenMasked: settings.whatsappAccessToken ? `${settings.whatsappAccessToken.slice(0, 6)}••••` : ''
      };

      res.status(200).json({
        success: true,
        data: safeSettings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update pharmacy messaging settings
   */
  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = (req as any).user?.pharmacyId || Number(req.body.pharmacyId) || 1;
      const updated = await MessagingService.updateSettings(Number(pharmacyId), req.body);
      
      res.status(200).json({
        success: true,
        data: updated,
        message: 'Messaging settings saved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send a test message (SMS or WhatsApp)
   */
  static async sendTestMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = (req as any).user?.pharmacyId || Number(req.body.pharmacyId) || 1;
      const { phone, channel } = req.body;

      if (!phone) {
        return res.status(400).json({ success: false, message: 'Recipient phone number is required' });
      }

      const result = await MessagingService.sendTestMessage(
        Number(pharmacyId),
        String(phone),
        channel === 'SMS' ? 'SMS' : 'WHATSAPP'
      );

      res.status(result.success ? 200 : 400).json({
        success: result.success,
        data: result,
        message: result.message
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send test message'
      });
    }
  }

  /**
   * Fetch recent delivery logs
   */
  static async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = (req as any).user?.pharmacyId || Number(req.query.pharmacyId) || 1;
      const limit = Number(req.query.limit) || 50;
      const logs = await MessagingService.getLogs(Number(pharmacyId), limit);

      res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend a bill invoice via SMS or WhatsApp gateway
   */
  static async resendBill(req: Request, res: Response, next: NextFunction) {
    try {
      const billId = Number(req.params.billId);
      const customPhone = req.body.phone;
      const bill = await BillingService.getBillById(billId);

      if (!bill) {
        return res.status(404).json({ success: false, message: 'Bill not found' });
      }

      if (customPhone) {
        bill.customerPhone = customPhone;
      }

      const results = await MessagingService.dispatchAutoBillMessage(bill);

      res.status(200).json({
        success: true,
        data: results,
        message: 'Bill invoice dispatched via gateway'
      });
    } catch (error) {
      next(error);
    }
  }
}
