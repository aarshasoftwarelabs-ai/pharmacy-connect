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
  static async scanPrescription(req: any, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No prescription image provided' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, message: 'Gemini API Key is not configured' });
      }

      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);


      const imageParts = [
        {
          inlineData: {
            data: req.file.buffer.toString("base64"),
            mimeType: req.file.mimetype
          }
        }
      ];

      const prompt = `Analyze this image. First, determine if it is a medical prescription or medical bill/invoice.
If it is CLEARLY NOT a prescription (e.g., a random selfie, animal, car, or completely irrelevant document), you MUST return this exact JSON: { "is_valid": false }.
If it IS a prescription or medical document, return ONLY a valid JSON object matching this structure exactly (do not wrap in markdown):
{
  "is_valid": true,
  "patient_name": "string or null",
  "items": [
    {
      "medicineName": "string",
      "quantity": number
    }
  ]
}
If any field cannot be found, use null or 0.`;

      let result;
      let lastError;
      const fallbackModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.7-flash', 'gemini-3.5-flash'];
      
      for (const modelName of fallbackModels) {
        try {
          const aiModel = genAI.getGenerativeModel({ model: modelName });
          result = await aiModel.generateContent([prompt, ...imageParts]);
          break; // Success! Exit the loop
        } catch (err: any) {
          console.log(`Model ${modelName} failed:`, err.message);
          lastError = err;
          // Continue to next model in the list
        }
      }
      
      if (!result) {
        throw lastError || new Error('All AI models failed');
      }
      let text = result.response.text();
      
      text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      
      let parsedData;
      try {
        parsedData = JSON.parse(text);
      } catch(e) {
        throw new Error('AI returned invalid JSON: ' + text);
      }

      if (parsedData.is_valid === false) {
        return res.status(400).json({ 
          success: false, 
          message: 'please Prescription Image Upload now this not image Prescription',
          isInvalidImage: true 
        });
      }

      return res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error('AI Scan Error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to scan using AI' });
    }
  }
}
