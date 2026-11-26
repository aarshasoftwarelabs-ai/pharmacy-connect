import { Request, Response } from 'express';
import { PharmacyService } from '../services/pharmacyService';

export class PharmacyController {
  private static isAuthorizedForPharmacy(req: Request, pharmacyId: number): boolean {
    const user = (req as any).user;
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    return role === 'ADMIN' || Number(user.pharmacyId) === pharmacyId;
  }

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

  static async getAllPharmacies(_req: Request, res: Response) {
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

  static async getSubscriptionStatus(req: Request, res: Response) {
    try {
      const pharmacyId = parseInt(req.params.id, 10);
      if (isNaN(pharmacyId)) {
        return res.status(400).json({ success: false, message: 'Invalid pharmacy ID' });
      }
      if (!PharmacyController.isAuthorizedForPharmacy(req, pharmacyId)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Store access denied' });
      }

      const pharmacy = await PharmacyService.getPharmacyById(pharmacyId);
      if (!pharmacy) {
        return res.status(404).json({ success: false, message: 'Pharmacy not found' });
      }

      const planType = pharmacy.planType || 'FREE_TRIAL';
      const now = new Date();
      let endDate = pharmacy.subscriptionEndDate ? new Date(pharmacy.subscriptionEndDate) : null;
      
      // If trial without end date, default to 14 days from trial start or now
      if (!endDate && planType === 'FREE_TRIAL') {
        const start = pharmacy.trialStartDate ? new Date(pharmacy.trialStartDate) : now;
        endDate = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
      }

      let daysRemaining = 0;
      let status: 'ACTIVE' | 'TRIAL' | 'EXPIRING_SOON' | 'GRACE_PERIOD' | 'EXPIRED' = 'ACTIVE';

      if (planType === 'LIFETIME') {
        status = 'ACTIVE';
        daysRemaining = 9999;
      } else if (endDate) {
        const diffMs = endDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysRemaining > 15) {
          status = planType === 'FREE_TRIAL' ? 'TRIAL' : 'ACTIVE';
        } else if (daysRemaining >= 0 && daysRemaining <= 15) {
          status = 'EXPIRING_SOON';
        } else if (daysRemaining >= -7 && daysRemaining < 0) {
          status = 'GRACE_PERIOD';
        } else {
          status = 'EXPIRED';
        }
      } else {
        status = 'TRIAL';
        daysRemaining = 14;
      }

      const canBill = status !== 'EXPIRED';

      const planNames: Record<string, string> = {
        MOBILE_YEARLY: 'Mobile-Only Pro (1-Year Pass)',
        MONTHLY: 'Monthly Pro',
        HALF_YEARLY: 'Half-Yearly Pro (6-Month Pass)',
        YEARLY: 'Yearly Pro',
        LIFETIME: 'Founder Lifetime',
      };

      res.status(200).json({
        success: true,
        data: {
          pharmacyId: pharmacy.id,
          pharmacyName: pharmacy.name,
          planType,
          planName: planNames[planType] || '14-Day Free Trial',
          trialStartDate: pharmacy.trialStartDate,
          subscriptionEndDate: endDate ? endDate.toISOString() : null,
          daysRemaining: Math.max(0, daysRemaining),
          rawDaysRemaining: daysRemaining,
          status,
          canBill,
          isMobileOnly: planType === 'MOBILE_YEARLY',
          supportsPc: planType !== 'MOBILE_YEARLY',
          pricing: {
            mobileYearly: 1499,
            originalPrice: 2499,
            dailyPrice: '4.10',
            discountPercent: 40,
            currency: 'INR'
          }
        }
      });
    } catch (error: any) {
      console.error('Error getting subscription status:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch subscription status' });
    }
  }

  static async updateSubscription(req: Request, res: Response) {
    try {
      const pharmacyId = parseInt(req.params.id, 10);
      const { planType, durationMonths, amount, paymentMethod, transactionId, upiId, agentNote } = req.body;

      if (isNaN(pharmacyId) || !planType) {
        return res.status(400).json({ success: false, message: 'Invalid parameters' });
      }

      const current = await PharmacyService.getPharmacyById(pharmacyId);
      if (!current) {
        return res.status(404).json({ success: false, message: 'Pharmacy not found' });
      }

      const defaultDurations: Record<string, number> = {
        MONTHLY: 1,
        HALF_YEARLY: 6,
        MOBILE_YEARLY: 12,
        YEARLY: 12,
      };
      const defaultAmounts: Record<string, number> = {
        MONTHLY: 799.00,
        HALF_YEARLY: 3499.00,
        MOBILE_YEARLY: 1499.00,
        YEARLY: 5999.00,
        LIFETIME: 24999.00,
      };

      let endDate: string | null = null;
      const monthsToAdd = durationMonths ? parseInt(durationMonths, 10) : (defaultDurations[planType] ?? 1);
      
      if (planType !== 'LIFETIME') {
        let baseDate = new Date();

        if (current.subscriptionEndDate) {
          const existingEnd = new Date(current.subscriptionEndDate);
          if (existingEnd > baseDate) {
            // User is renewing early: extend from their current expiry date without losing remaining days!
            baseDate = existingEnd;
          }
        }

        baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
        endDate = baseDate.toISOString();
      }

      const result = await PharmacyService.updateSubscriptionPlan(
        pharmacyId, 
        planType, 
        endDate,
        {
          amount: typeof amount === 'number' ? amount : parseFloat(amount) || (defaultAmounts[planType] ?? 5999.00),
          paymentMethod: paymentMethod || 'UPI',
          transactionId,
          upiId: upiId || 'lodaliya@ptyes',
          agentNote: agentNote || (planType === 'MOBILE_YEARLY' ? 'Mobile-Only 1-Year Pass (No PC/Laptop)' : undefined),
          durationMonths: monthsToAdd,
        }
      );

      if (!result) {
        return res.status(500).json({ success: false, message: 'Failed to update subscription in database' });
      }
      
      res.status(200).json({
        success: true,
        message: 'Subscription successfully activated!',
        data: result.pharmacy,
        payment: result.payment,
      });
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      res.status(500).json({ success: false, message: 'Failed to update subscription', error: error.message });
    }
  }

  static async getSubscriptionPayments(req: Request, res: Response) {
    try {
      const pharmacyId = parseInt(req.params.id, 10);
      if (isNaN(pharmacyId)) {
        return res.status(400).json({ success: false, message: 'Invalid pharmacy ID' });
      }
      if (!PharmacyController.isAuthorizedForPharmacy(req, pharmacyId)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Store access denied' });
      }
      const payments = await PharmacyService.getSubscriptionPayments(pharmacyId);
      res.status(200).json({ success: true, data: payments });
    } catch (error: any) {
      console.error('Error fetching subscription payments:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payments' });
    }
  }

  static async getSubscriptionStats(_req: Request, res: Response) {
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
