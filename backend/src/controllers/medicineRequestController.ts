import { Request, Response, NextFunction } from 'express';
import { MedicineRequestService } from '../services/medicineRequestService';
import { ApiError } from '../middleware/errorHandler';

import { getIo } from '../socket';
import { NotificationService, NotificationType } from '../services/notificationService';

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

      // Emit real-time notification to the specific pharmacy via socket
      try {
        const io = getIo();
        io.to(`pharmacy_${pharmacyId}`).emit('new_request', result);
      } catch (err) {
        console.error('Socket emit error:', err);
      }

      // Create persistent notifications for pharmacy staff and owner
      await NotificationService.notifyPharmacyUsers(
        pharmacyId,
        'MEDICINE_REQUESTS_VIEW',
        {
          type: NotificationType.MEDICINE_REQUEST_CREATED,
          title: 'New Medicine Request',
          message: medicineName ? `A customer has requested ${medicineName}.` : 'A customer uploaded a new prescription.',
          reference_type: 'MEDICINE_REQUEST',
          reference_id: result.id,
          data: { medicineName }
        }
      );

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
      const pharmacyId = (req as any).user!.pharmacyId;

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

      // Notify Customer
      const getStatusDetails = (s: string) => {
        switch(s) {
          case 'AVAILABLE': return { type: NotificationType.MEDICINE_REQUEST_AVAILABLE, msg: 'Your medicine request is available.' };
          case 'CAN_ARRANGE': return { type: NotificationType.MEDICINE_REQUEST_CAN_ARRANGE, msg: 'We can arrange your medicine.' };
          case 'NOT_AVAILABLE': return { type: NotificationType.MEDICINE_REQUEST_NOT_AVAILABLE, msg: 'Your medicine is currently unavailable.' };
          default: return { type: NotificationType.MEDICINE_REQUEST_AVAILABLE, msg: 'Your medicine request has been updated.' };
        }
      };

      const statusDetails = getStatusDetails(status);

      await NotificationService.createNotification({
        recipient_user_id: result.user_id,
        pharmacy_id: result.pharmacy_id,
        type: statusDetails.type,
        title: 'Request Update',
        message: statusDetails.msg,
        reference_type: 'MEDICINE_REQUEST',
        reference_id: result.id
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

      // Notify Pharmacy Users
      await NotificationService.notifyPharmacyUsers(
        result.pharmacy_id,
        'MEDICINE_REQUESTS_VIEW',
        {
          type: NotificationType.CUSTOMER_CONFIRMATION_RECEIVED,
          title: 'Request Confirmed',
          message: 'Customer confirmed the medicine request.',
          reference_type: 'MEDICINE_REQUEST',
          reference_id: result.id
        }
      );

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

      // Notify Pharmacy Users
      await NotificationService.notifyPharmacyUsers(
        result.pharmacy_id,
        'MEDICINE_REQUESTS_VIEW',
        {
          type: NotificationType.CUSTOMER_REQUEST_CANCELLED,
          title: 'Request Cancelled',
          message: 'Customer cancelled the medicine request.',
          reference_type: 'MEDICINE_REQUEST',
          reference_id: result.id
        }
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
