import { Request, Response } from 'express';
import { DistributorService } from '../services/distributorService';
import { AuthenticatedRequest } from '../middleware/auth';

export class DistributorController {
  static async getDistributors(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user?.pharmacyId;
      if (!pharmacyId) return res.status(401).json({ error: 'Unauthorized' });

      const distributors = await DistributorService.getDistributors(pharmacyId);
      res.json(distributors);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createDistributor(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user?.pharmacyId;
      if (!pharmacyId) return res.status(401).json({ error: 'Unauthorized' });

      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });

      const distributor = await DistributorService.createDistributor(pharmacyId, req.body);
      res.status(201).json(distributor);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateDistributor(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user?.pharmacyId;
      const { id } = req.params;
      if (!pharmacyId) return res.status(401).json({ error: 'Unauthorized' });

      const distributor = await DistributorService.updateDistributor(Number(id), pharmacyId, req.body);
      if (!distributor) return res.status(404).json({ error: 'Distributor not found' });
      
      res.json(distributor);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteDistributor(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user?.pharmacyId;
      const { id } = req.params;
      if (!pharmacyId) return res.status(401).json({ error: 'Unauthorized' });

      await DistributorService.deleteDistributor(Number(id), pharmacyId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getExpiringMedicines(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user?.pharmacyId || 1;
      const days = parseInt(req.query.days as string) || 90;
      const expiring = await DistributorService.getExpiringMedicines(pharmacyId, days);
      res.json(expiring);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createReturnChallan(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user?.pharmacyId || 1;
      const { items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Return items are required' });
      }

      const result = await DistributorService.createReturnChallan(pharmacyId, req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getReturnChallans(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user?.pharmacyId || 1;
      const returns = await DistributorService.getReturnChallans(pharmacyId);
      res.json(returns);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
