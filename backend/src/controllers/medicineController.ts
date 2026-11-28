import { Request, Response, NextFunction } from 'express';
import { MedicineService } from '../services/medicineService';
import { ReportService } from '../services/reportService';
import { AuthenticatedRequest, resolveScopedPharmacyId } from '../middleware/auth';

export class MedicineController {
  static async getMedicines(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = resolveScopedPharmacyId(req as AuthenticatedRequest);
      const medicines = await MedicineService.getMedicines(pharmacyId);
      res.json(medicines);
    } catch (error) {
      next(error);
    }
  }

  static async lookupBarcode(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = resolveScopedPharmacyId(req as AuthenticatedRequest);
      const barcode = req.params.barcode;
      const result = await MedicineService.lookupBarcode(pharmacyId, barcode);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async createMedicine(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = resolveScopedPharmacyId(req as AuthenticatedRequest, req.body?.pharmacyId);
      const medicine = await MedicineService.createMedicine(pharmacyId, req.body);
      res.status(201).json({ success: true, ...medicine });
    } catch (error) {
      next(error);
    }
  }

  static async updateMedicine(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = resolveScopedPharmacyId(req as AuthenticatedRequest, req.body?.pharmacyId);
      const medicineId = parseInt(req.params.id);
      const medicine = await MedicineService.updateMedicine(medicineId, pharmacyId, req.body);
      if (!medicine) {
        res.status(404).json({ success: false, message: 'Medicine not found' });
        return;
      }
      res.json({ success: true, ...medicine });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMedicine(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = resolveScopedPharmacyId(req as AuthenticatedRequest);
      const medicineId = parseInt(req.params.id);
      const success = await MedicineService.deleteMedicine(medicineId, pharmacyId);
      if (!success) {
        res.status(404).json({ success: false, message: 'Medicine not found' });
        return;
      }
      res.json({ success: true, message: 'Medicine deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async bulkImport(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = resolveScopedPharmacyId(req as AuthenticatedRequest);
      const { items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items array is required for bulk import' });
      }

      const result = await MedicineService.bulkImportMedicines(pharmacyId, items);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async generateBarcodes(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = resolveScopedPharmacyId(req as AuthenticatedRequest);
      const result = await MedicineService.generateMissingBarcodes(pharmacyId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getDeadStock(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = resolveScopedPharmacyId(req as AuthenticatedRequest);
      const parsedMinDays = req.query.minDays ? parseInt(req.query.minDays as string, 10) : 30;
      const minDays = Number.isFinite(parsedMinDays) && parsedMinDays >= 0 ? parsedMinDays : 30;
      const result = await ReportService.getDeadStockReport(pharmacyId, minDays);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getSubstitutes(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = resolveScopedPharmacyId(req as AuthenticatedRequest, req.query.pharmacyId);
      const genericName = req.query.genericName as string;
      const excludeId = req.query.excludeId as string;
      const strength = req.query.strength as string;

      if (!genericName) {
        return res.json([]);
      }

      const substitutes = await MedicineService.getSubstitutes(
        pharmacyId,
        genericName,
        excludeId,
        strength
      );
      res.json(substitutes);
    } catch (error) {
      next(error);
    }
  }

  static async getShortageMedicines(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = resolveScopedPharmacyId(req as AuthenticatedRequest, req.query.pharmacyId);
      const shortage = await MedicineService.getShortageMedicines(pharmacyId);
      res.json(shortage);
    } catch (error) {
      next(error);
    }
  }

  static async scanBox(req: any, res: Response, next: NextFunction) {
    try {
      const pharmacyId = resolveScopedPharmacyId(
        req as AuthenticatedRequest,
        req.body.pharmacyId || req.body.pharmacy_id
      );
      const syncToPc = req.body.syncToPc === true || req.body.syncToPc === 'true';

      const extractBase64Image = (raw: unknown): { buffer: Buffer; mimeType: string } | null => {
        if (!raw) return null;
        const rawStr = String(raw).trim();
        if (!rawStr) return null;
        const matches = rawStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          return { mimeType: matches[1], buffer: Buffer.from(matches[2], 'base64') };
        }
        return { mimeType: 'image/jpeg', buffer: Buffer.from(rawStr, 'base64') };
      };

      let buffer: Buffer | null = null;
      let mimeType = 'image/jpeg';

      if (req.file) {
        buffer = req.file.buffer;
        mimeType = req.file.mimetype || 'image/jpeg';
      } else {
        const primary = extractBase64Image(req.body.image);
        if (primary) {
          buffer = primary.buffer;
          mimeType = primary.mimeType;
        }
      }

      if (!buffer) {
        return res.status(400).json({
          success: false,
          message: 'No medicine box image provided (either as multipart file or base64 string).'
        });
      }

      const backImage = extractBase64Image(req.body.backImage);
      const data = await MedicineService.scanMedicineBox(buffer, mimeType, pharmacyId, syncToPc, backImage);
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  static async smartAutofill(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = resolveScopedPharmacyId(req as AuthenticatedRequest, req.body?.pharmacyId);
      const rawName = String(req.body?.name ?? req.query?.name ?? '').trim();
      if (rawName.length < 2) {
        return res.status(400).json({
          found: false,
          message: 'Please enter at least 2 characters of medicine name.'
        });
      }
      const result = await MedicineService.smartAutofillMedicine(pharmacyId, rawName);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
