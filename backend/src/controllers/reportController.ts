import { Request, Response, NextFunction } from 'express';
import { ReportService, ReportDateRange } from '../services/reportService';
import { ApiError } from '../middleware/errorHandler';

const extractDateRange = (req: Request): ReportDateRange => {
  return {
    startDate: req.query.from as string | undefined,
    endDate: req.query.to as string | undefined,
  };
};

export class ReportController {
  
  static async getSalesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId, 10);
      if (isNaN(pharmacyId)) throw Object.assign(new Error('Invalid pharmacy ID'), { statusCode: 400 });
      
      const params = extractDateRange(req);
      const data = await ReportService.getSalesReport(pharmacyId, params);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getBillingReport(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId, 10);
      if (isNaN(pharmacyId)) throw Object.assign(new Error('Invalid pharmacy ID'), { statusCode: 400 });
      
      const params = {
        ...extractDateRange(req),
        search: req.query.search as string | undefined,
      };
      
      const data = await ReportService.getBillingReport(pharmacyId, params);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getMedicineSalesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId, 10);
      if (isNaN(pharmacyId)) throw Object.assign(new Error('Invalid pharmacy ID'), { statusCode: 400 });
      
      const params = {
        ...extractDateRange(req),
        search: req.query.search as string | undefined,
        sortBy: (req.query.sortBy as 'quantity' | 'sales') || 'quantity',
      };
      
      const data = await ReportService.getMedicineSalesReport(pharmacyId, params);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getMedicineRequestReport(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId, 10);
      if (isNaN(pharmacyId)) throw Object.assign(new Error('Invalid pharmacy ID'), { statusCode: 400 });
      
      const params = extractDateRange(req);
      const data = await ReportService.getMedicineRequestReport(pharmacyId, params);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerReport(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId, 10);
      if (isNaN(pharmacyId)) throw Object.assign(new Error('Invalid pharmacy ID'), { statusCode: 400 });
      
      const params = {
        ...extractDateRange(req),
        search: req.query.search as string | undefined,
      };
      
      const data = await ReportService.getCustomerReport(pharmacyId, params);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getGstReport(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId, 10);
      if (isNaN(pharmacyId)) throw Object.assign(new Error('Invalid pharmacy ID'), { statusCode: 400 });
      
      const params = extractDateRange(req);
      const data = await ReportService.getGstReport(pharmacyId, params);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
