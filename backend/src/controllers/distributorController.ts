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
}
