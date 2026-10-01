import { Request, Response, NextFunction } from 'express';
import { MedicineService } from '../services/medicineService';
import { ApiError } from '../middleware/errorHandler';

export class MedicineController {
  static async getMedicines(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = (req as any).user?.pharmacyId || 1;
      const medicines = await MedicineService.getMedicines(pharmacyId);
      res.json(medicines);
    } catch (error) {
      next(error);
    }
  }

  static async createMedicine(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = (req as any).user?.pharmacyId || 1;
      const medicine = await MedicineService.createMedicine(pharmacyId, req.body);
      res.json(medicine);
    } catch (error) {
      next(error);
    }
  }

  static async updateMedicine(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = (req as any).user?.pharmacyId || 1;
      const medicineId = parseInt(req.params.id);
      const medicine = await MedicineService.updateMedicine(medicineId, pharmacyId, req.body);
      if (!medicine) {
        res.status(404).json({ success: false, message: 'Medicine not found' });
        return;
      }
      res.json(medicine);
    } catch (error) {
      next(error);
    }
  }

  static async deleteMedicine(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = (req as any).user?.pharmacyId || 1;
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
}
