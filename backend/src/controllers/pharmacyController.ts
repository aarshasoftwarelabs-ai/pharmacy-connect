import { Request, Response } from 'express';
import { PharmacyService } from '../services/pharmacyService';

export class PharmacyController {
  static async getPharmacyProfile(req: Request, res: Response) {
    try {
      const pharmacyId = parseInt(req.params.id, 10);
      if (isNaN(pharmacyId)) {
        return res.status(400).json({ error: 'Invalid pharmacy ID' });
      }

      const pharmacy = await PharmacyService.getPharmacyById(pharmacyId);
      
      if (!pharmacy) {
        return res.status(404).json({ error: 'Pharmacy not found' });
      }

      res.status(200).json(pharmacy);
    } catch (error: any) {
      console.error('Error fetching pharmacy profile:', error);
      res.status(500).json({ error: 'Failed to fetch pharmacy profile' });
    }
  }

  static async getAllPharmacies(req: Request, res: Response) {
    try {
      const pharmacies = await PharmacyService.getAllPharmacies();
      res.status(200).json({
        success: true,
        data: pharmacies
      });
    } catch (error: any) {
      console.error('Error fetching all pharmacies:', error);
      res.status(500).json({ error: 'Failed to fetch pharmacies' });
    }
  }

  static async updatePharmacyProfile(req: Request, res: Response) {
    try {
      const pharmacyId = (req as any).user!.pharmacyId;

      const { name, address, phone, regNo, gstin, gstRegistered, state, ownerName, email, operationalHours } = req.body;

      const updatedPharmacy = await PharmacyService.updatePharmacyProfile(pharmacyId, {
        name, address, phone, regNo, gstin, gstRegistered, state, ownerName, email, operationalHours
      });

      if (!updatedPharmacy) {
        return res.status(404).json({ error: 'Pharmacy not found' });
      }

      res.status(200).json(updatedPharmacy);
    } catch (error: any) {
      console.error('Error updating pharmacy profile:', error);
      res.status(500).json({ error: 'Failed to update pharmacy profile' });
    }
  }

  static async updateSubscription(req: Request, res: Response) {
    try {
      const pharmacyId = parseInt(req.params.id, 10);
      const { planType, durationMonths } = req.body;

      if (isNaN(pharmacyId) || !planType) {
        return res.status(400).json({ error: 'Invalid parameters' });
      }

      let endDate: string | null = null;
      
      if (planType !== 'LIFETIME' && durationMonths) {
        const date = new Date();
        date.setMonth(date.getMonth() + durationMonths);
        endDate = date.toISOString();
      }

      const pharmacy = await PharmacyService.updateSubscriptionPlan(pharmacyId, planType, endDate);
      
      if (!pharmacy) {
        return res.status(404).json({ error: 'Pharmacy not found' });
      }

      res.status(200).json(pharmacy);
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      res.status(500).json({ error: 'Failed to update subscription' });
    }
  }

  static async getSubscriptionStats(req: Request, res: Response) {
    try {
      const paidCount = await PharmacyService.getPaidPharmaciesCount();
      res.status(200).json({
        success: true,
        data: {
          paidCount
        }
      });
    } catch (error: any) {
      console.error('Error fetching subscription stats:', error);
      res.status(500).json({ error: 'Failed to fetch subscription stats' });
    }
  }
}
