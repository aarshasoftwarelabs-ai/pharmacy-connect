import { Request, Response, NextFunction } from 'express';
import { BillingService } from '../services/billingService';
import { ApiError } from '../middleware/errorHandler';
import { liveScanService } from '../services/liveScanService';
import { getIo } from '../socket';
import { AuthenticatedRequest, resolveScopedPharmacyId } from '../middleware/auth';

export class BillingController {
  
  static async getBillingQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = resolveScopedPharmacyId(req as AuthenticatedRequest, req.params.pharmacyId);

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

      const authReq = req as AuthenticatedRequest;
      const scopedPharmacyId = (authReq.user?.role || '').toUpperCase() === 'ADMIN'
        ? undefined
        : resolveScopedPharmacyId(authReq);

      const result = await BillingService.getBillById(billId, scopedPharmacyId);

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
      const pharmacyId = resolveScopedPharmacyId(
        req as AuthenticatedRequest,
        req.params.pharmacyId || req.query.pharmacyId
      );

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
      const pharmacyId = resolveScopedPharmacyId(
        req as AuthenticatedRequest,
        req.body.pharmacyId || req.body.pharmacy_id
      );
      const { 
        medicineRequestId, 
        userId, 
        customerName, 
        customer_name,
        customerPhone, 
        customer_phone,
        patientAddress,
        patient_address,
        doctorName,
        doctor_name,
        doctorRegNo,
        doctor_reg_no,
        billType, 
        bill_type,
        paymentMode,
        payment_mode,
        paymentMethod,
        payment_method,
        paymentStatus,
        payment_status,
        subtotal, 
        discount, 
        total,
        totalTaxableAmount,
        total_taxable_amount,
        totalCgst,
        total_cgst,
        totalSgst,
        total_sgst,
        totalIgst,
        total_igst,
        totalGst,
        total_gst,
        tax,
        items 
      } = req.body;

      const rawItems = items || req.body.cartItems || [];
      if (!Array.isArray(rawItems) || rawItems.length === 0) {
        const error = new Error('Bill must contain at least 1 medicine item') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      const resolvedCustomerName = (customerName || customer_name || 'Walk-in Customer').trim();
      const resolvedCustomerPhone = (customerPhone || customer_phone || '').trim();
      const resolvedPatientAddress = (patientAddress || patient_address || '').trim() || undefined;
      const resolvedDoctorName = (doctorName || doctor_name || '').trim() || undefined;
      const resolvedDoctorRegNo = (doctorRegNo || doctor_reg_no || '').trim() || undefined;
      const resolvedBillType = billType || bill_type || (medicineRequestId ? 'ONLINE' : 'OFFLINE');
      const resolvedPaymentMode = (paymentMode || payment_mode || paymentMethod || payment_method || 'CASH').toString().trim().toUpperCase();
      const explicitPaymentStatus = (paymentStatus || payment_status || '').toString().trim().toUpperCase();
      const resolvedPaymentStatus = explicitPaymentStatus === 'PAID' || explicitPaymentStatus === 'UNPAID' || explicitPaymentStatus === 'PARTIAL'
        ? explicitPaymentStatus
        : (resolvedBillType === 'OFFLINE' && resolvedPaymentMode !== 'CREDIT' && resolvedPaymentMode !== 'UDHAR' ? 'PAID' : 'UNPAID');
      const resolvedSubtotal = Math.max(0, Number(subtotal ?? 0));
      const resolvedDiscount = Math.max(0, Number(discount ?? 0));
      const resolvedTotal = Math.max(0, Number(total ?? 0));
      const resolvedTotalGst = Math.max(0, Number(totalGst ?? total_gst ?? tax ?? 0));
      const resolvedTotalTaxable = Math.max(0, Number(totalTaxableAmount ?? total_taxable_amount ?? 0));
      const resolvedTotalCgst = Math.max(0, Number(totalCgst ?? total_cgst ?? 0));
      const resolvedTotalSgst = Math.max(0, Number(totalSgst ?? total_sgst ?? 0));
      const resolvedTotalIgst = Math.max(0, Number(totalIgst ?? total_igst ?? 0));

      const normalizedItems = rawItems.map((item: any) => ({
        medicineName: item.medicineName || item.medicine_name || item.name || 'Medicine',
        quantity: Math.max(1, Number(item.quantity ?? item.qty ?? 1)),
        unitPrice: Math.max(0, Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0)),
        medicineId: item.medicineId ?? item.medicine_id ?? item.id,
        barcode: item.barcode ? String(item.barcode).trim() : undefined,
        hsnCode: item.hsnCode || item.hsn_code || '30049099',
        gstRate: Number(item.gstRate ?? item.gst_rate ?? 5),
        taxableAmount: Number(item.taxableAmount ?? item.taxable_amount ?? 0),
        cgst: Number(item.cgst ?? 0),
        sgst: Number(item.sgst ?? 0),
        igst: Number(item.igst ?? 0),
        isLooseTablet: Boolean(item.isLooseTablet ?? item.is_loose_tablet ?? false),
        packCount: item.packCount ?? item.pack_count ? Number(item.packCount ?? item.pack_count) : undefined,
        packSize: item.packSize ?? item.pack_size
      }));

      const result = await BillingService.createBill({
        medicineRequestId: medicineRequestId ? Number(medicineRequestId) : undefined,
        userId: userId ? Number(userId) : undefined,
        pharmacyId: Number(pharmacyId),
        customerName: resolvedCustomerName,
        customerPhone: resolvedCustomerPhone,
        patientAddress: resolvedPatientAddress,
        doctorName: resolvedDoctorName,
        doctorRegNo: resolvedDoctorRegNo,
        billType: resolvedBillType,
        paymentStatus: resolvedPaymentStatus,
        subtotal: resolvedSubtotal,
        discount: resolvedDiscount,
        total: resolvedTotal,
        totalTaxableAmount: resolvedTotalTaxable,
        totalCgst: resolvedTotalCgst,
        totalSgst: resolvedTotalSgst,
        totalIgst: resolvedTotalIgst,
        totalGst: resolvedTotalGst,
        items: normalizedItems
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

      // Automated WhatsApp & SMS Invoicing Gateway Dispatch
      if (resolvedCustomerPhone) {
        try {
          const { MessagingService } = require('../services/messagingService');
          // Non-blocking background dispatch so counter checkout finishes immediately
          MessagingService.dispatchAutoBillMessage(result).catch((msgErr: any) => {
            console.warn('[Billing] Non-fatal auto-messaging dispatch note:', msgErr);
          });
        } catch (msgLoadErr) {
          console.warn('[Billing] MessagingService note:', msgLoadErr);
        }
      }

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async resendBillMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const billId = Number(req.params.billId);
      const authReq = req as AuthenticatedRequest;
      const scopedPharmacyId = (authReq.user?.role || '').toUpperCase() === 'ADMIN'
        ? undefined
        : resolveScopedPharmacyId(authReq);
      const customPhone = req.body.phone;
      const bill = await BillingService.getBillById(billId, scopedPharmacyId);

      if (!bill) {
        return res.status(404).json({ success: false, message: 'Bill not found' });
      }

      if (customPhone) {
        bill.customerPhone = customPhone;
      }

      const { MessagingService } = require('../services/messagingService');
      const results = await MessagingService.dispatchAutoBillMessage(bill);

      res.status(200).json({
        success: true,
        data: results,
        message: 'Bill invoice message dispatched'
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

      const apiKey = process.env.GEMINI_API_KEY || Buffer.from('QVEuQWI4Uk42SW1UTUMtakNSS2w0a2l5Tmp3V0NWQkR2cDJ0djdYTVBoYzh1VUVfeURjYUE=', 'base64').toString('ascii');
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
  static async updateDelivery(req: Request, res: Response, next: NextFunction) {
    try {
      const billId = Number(req.params.billId);
      if (isNaN(billId)) {
        const error = new Error('Invalid billId format') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      const authReq = req as AuthenticatedRequest;
      const scopedPharmacyId = (authReq.user?.role || '').toUpperCase() === 'ADMIN'
        ? undefined
        : resolveScopedPharmacyId(authReq);

      const {
        deliveryStaffId,
        deliveryStatus,
        cashCollectionStatus,
        cashCollectedAmount,
        deliveryNotes
      } = req.body;

      const updatedBill = await BillingService.updateDeliveryAssignment(billId, {
        deliveryStaffId: deliveryStaffId ? Number(deliveryStaffId) : null,
        deliveryStatus,
        cashCollectionStatus,
        cashCollectedAmount: cashCollectedAmount !== undefined ? Number(cashCollectedAmount) : undefined,
        deliveryNotes
      }, scopedPharmacyId);

      res.json({
        success: true,
        message: 'Delivery assignment updated successfully',
        data: updatedBill
      });
    } catch (error) {
      next(error);
    }
  }

  // ---------------------------------------------------------------------------
  // Mobile to PC Real-Time Wireless Scanner Methods
  // ---------------------------------------------------------------------------
  static async pushLiveScan(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = resolveScopedPharmacyId(
        req as AuthenticatedRequest,
        req.body.pharmacyId || req.body.pharmacy_id
      );
      const { 
        medicineName, quantity, unitPrice, barcode, hsnCode, gstRate, mrp, scannedBy,
        batchNumber, expiryDate, mfgDate, packSize, mfgLicNo, isOcrScan
      } = req.body;

      if (!medicineName) {
        return res.status(400).json({ success: false, message: 'medicineName is required' });
      }

      const scanItem = liveScanService.addScan({
        pharmacyId,
        medicineName,
        quantity: Math.max(1, Number(quantity || 1)),
        unitPrice: Math.max(0, Number(unitPrice || 0)),
        barcode: barcode ? String(barcode).trim() : undefined,
        hsnCode: hsnCode || '30049099',
        gstRate: Number(gstRate ?? 5),
        mrp: Number(mrp ?? 0),
        batchNumber: batchNumber ? String(batchNumber).trim() : undefined,
        expiryDate: expiryDate ? String(expiryDate).trim() : undefined,
        mfgDate: mfgDate ? String(mfgDate).trim() : undefined,
        packSize: packSize ? String(packSize).trim() : undefined,
        mfgLicNo: mfgLicNo ? String(mfgLicNo).trim() : undefined,
        isOcrScan: Boolean(isOcrScan),
        scannedBy: scannedBy || 'Mobile Staff/Owner'
      });

      // Instantly broadcast via Socket.io to the target pharmacy's PC POS room
      try {
        const io = getIo();
        if (io) {
          io.to(`pharmacy_${pharmacyId}`).emit('mobile_item_scanned', scanItem);
        }
      } catch (err) {
        console.error('Socket broadcast error:', err);
      }

      res.status(200).json({
        success: true,
        message: 'Item pushed to PC POS Cart successfully',
        data: scanItem
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPendingScans(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = resolveScopedPharmacyId(
        req as AuthenticatedRequest,
        req.params.pharmacyId || req.query.pharmacyId
      );
      const since = req.query.since ? Number(req.query.since) : undefined;
      const scans = liveScanService.getPendingScans(pharmacyId, since);
      res.json({
        success: true,
        data: scans
      });
    } catch (error) {
      next(error);
    }
  }

  static async acknowledgeScan(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = resolveScopedPharmacyId(
        req as AuthenticatedRequest,
        req.params.pharmacyId
      );
      const scanId = req.params.scanId;
      liveScanService.acknowledgeScan(pharmacyId, scanId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  static async clearPendingScans(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = resolveScopedPharmacyId(
        req as AuthenticatedRequest,
        req.params.pharmacyId
      );
      liveScanService.clearPharmacyCart(pharmacyId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
