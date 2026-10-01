import { Request, Response, NextFunction } from 'express';
import { BillingService } from '../services/billingService';
import { ApiError } from '../middleware/errorHandler';

export class BillingController {
  
  static async getBillingQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = Number(req.params.pharmacyId);
      if (isNaN(pharmacyId)) {
        const error = new Error('Invalid pharmacyId format') as ApiError;
        error.statusCode = 400;
        throw error;
      }

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
      const pharmacyId = Number(req.params.pharmacyId);
      if (isNaN(pharmacyId)) {
        const error = new Error('Invalid pharmacyId format') as ApiError;
        error.statusCode = 400;
        throw error;
      }

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
      const { medicineRequestId, userId, pharmacyId, customerName, customerPhone, billType, subtotal, discount, total, items } = req.body;

      // medicineRequestId and userId are optional for OFFLINE bills
      if (!pharmacyId || !customerName || !items || !Array.isArray(items) || items.length === 0) {
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

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
