import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { RefillService } from '../services/refillService';

export const RefillController = {
  // Trigger refill calculation manually
  async calculateRefills(req: AuthenticatedRequest, res: Response) {
    const pharmacyId = req.user!.pharmacyId;
    
    try {
      const result = await RefillService.calculateRefillReminders(pharmacyId);
      res.json(result);
    } catch (error) {
      console.error('Error calculating refills:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get reminders for a pharmacy
  async getPharmacyReminders(req: AuthenticatedRequest, res: Response) {
    const pharmacyId = req.user!.pharmacyId;
    const { status } = req.query;
    
    try {
      const result = await RefillService.getRemindersForPharmacy(pharmacyId, status as string);
      res.json(result);
    } catch (error) {
      console.error('Error fetching pharmacy reminders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update reminder status
  async updateReminderStatus(req: AuthenticatedRequest, res: Response) {
    const pharmacyId = req.user!.pharmacyId;
    const reminderId = parseInt(req.params.id);
    const { status } = req.body;
    
    try {
      const result = await RefillService.updateReminderStatus(reminderId, pharmacyId, status);
      res.json(result);
    } catch (error: any) {
      console.error('Error updating reminder status:', error);
      if (error.message === 'Reminder not found') {
        res.status(404).json({ error: 'Reminder not found' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
};
