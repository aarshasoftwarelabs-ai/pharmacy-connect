import { Request, Response, NextFunction } from 'express';
import { MedicineRequestService } from '../services/medicineRequestService';
import { ApiError } from '../middleware/errorHandler';

import { getIo } from '../socket';

export class MedicineRequestController {
  
  static async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, pharmacyId, medicineName, imageReference } = req.body;

      if (!userId || !pharmacyId) {
        const error = new Error('userId and pharmacyId are required') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      const requestData = {
        userId: Number(userId),
        pharmacyId: Number(pharmacyId),
        medicineName,
        imageReference
      };

      const result = await MedicineRequestService.createRequest(requestData);

      // Emit real-time notification to the specific pharmacy
      try {
        const io = getIo();
        io.to(`pharmacy_${pharmacyId}`).emit('new_request', result);
      } catch (err) {
        console.error('Socket emit error:', err);
      }

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.params.userId);
      if (isNaN(userId)) {
        const error = new Error('Invalid userId format') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      const result = await MedicineRequestService.getUserRequests(userId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPharmacyRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = Number(req.params.pharmacyId);
      if (isNaN(pharmacyId)) {
        const error = new Error('Invalid pharmacyId format') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      const status = req.query.status as string | undefined;
      const validStatuses = ['WAITING', 'AVAILABLE', 'CAN_ARRANGE', 'NOT_AVAILABLE'];

      if (status && !validStatuses.includes(status)) {
        const error = new Error('Invalid status filter value') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      const result = await MedicineRequestService.getPharmacyRequests(pharmacyId, status);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRequestById(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = Number(req.params.requestId);
      if (isNaN(requestId)) {
        const error = new Error('Invalid requestId format') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      const result = await MedicineRequestService.getRequestById(requestId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = Number(req.params.requestId);
      if (isNaN(requestId)) {
        const error = new Error('Invalid requestId format') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      const { status, responseMessage } = req.body;

      const validStatuses = ['AVAILABLE', 'CAN_ARRANGE', 'NOT_AVAILABLE'];
      if (!status || !validStatuses.includes(status)) {
        const error = new Error('Invalid status. Allowed values: AVAILABLE, CAN_ARRANGE, NOT_AVAILABLE') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      const result = await MedicineRequestService.updateStatus(requestId, {
        status,
        responseMessage
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async confirmRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = Number(req.params.requestId);
      if (isNaN(requestId)) {
        const error = new Error('Invalid requestId format') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      const result = await MedicineRequestService.confirmRequest(requestId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = Number(req.params.requestId);
      if (isNaN(requestId)) {
        const error = new Error('Invalid requestId format') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      const result = await MedicineRequestService.cancelRequest(requestId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
