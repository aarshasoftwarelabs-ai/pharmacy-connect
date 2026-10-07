import { Request, Response, NextFunction } from 'express';
import { BillingService } from '../services/billingService';
import { ApiError } from '../middleware/errorHandler';

export class BillingController {
  
  static async getBillingQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = (req as any).user!.pharmacyId;

      const result = await BillingService.getBillingQueue(pharmacyId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBillById(req: Request, res: Response, next: NextFunction) {
    try {
      const billId = Number(req.params.billId);
      if (isNaN(billId)) {
        const error = new Error('Invalid billId format') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      const result = await BillingService.getBillById(billId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPharmacyBills(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = (req as any).user!.pharmacyId;

      const result = await BillingService.getPharmacyBills(pharmacyId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async createBill(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = (req as any).user!.pharmacyId;
      const { medicineRequestId, userId, customerName, customerPhone, billType, subtotal, discount, total, items } = req.body;

      // medicineRequestId and userId are optional for OFFLINE bills
      if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
        const error = new Error('Missing required fields for bill creation') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      if (subtotal < 0 || discount < 0 || total < 0) {
        const error = new Error('Amounts cannot be negative') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      const result = await BillingService.createBill({
        medicineRequestId: medicineRequestId ? Number(medicineRequestId) : undefined,
        userId: userId ? Number(userId) : undefined,
        pharmacyId: Number(pharmacyId),
        customerName,
        customerPhone,
        billType,
        subtotal: Number(subtotal),
        discount: Number(discount),
        total: Number(total),
        items
      });

      // Notify Customer if applicable
      if (userId) {
        const { NotificationService, NotificationType } = require('../services/notificationService');
        await NotificationService.createNotification({
          recipient_user_id: Number(userId),
          pharmacy_id: Number(pharmacyId),
          type: NotificationType.BILL_READY,
          title: 'Your Bill is Ready',
          message: 'Your bill has been generated.',
          reference_type: 'BILL',
          reference_id: result.id
        });
      }

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
