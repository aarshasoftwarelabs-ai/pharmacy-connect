import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { PrescriptionService } from '../services/prescriptionService';
import { NotificationService, NotificationType } from '../services/notificationService';

export const PrescriptionController = {
  // Upload a prescription
  async upload(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.userId;
    const { customerId, pharmacyId, fileUrl, fileName, mimeType, notes } = req.body;
    
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(mimeType)) {
      return res.status(422).json({ error: 'Unsupported file format. Only JPG, PNG, and PDF are allowed.' });
    }
    
    try {
      const result = await PrescriptionService.uploadPrescription(
        customerId,
        pharmacyId,
        userId,
        fileUrl,
        fileName,
        mimeType,
        notes
      );
      
      // Notify Pharmacy Owner/Staff about the new prescription
      await NotificationService.notifyPharmacyUsers(pharmacyId, 'PRESCRIPTIONS_VIEW', {
        type: NotificationType.MEDICINE_REQUEST_CREATED, // Reuse or create a new type if needed
        title: 'New Prescription Uploaded',
        message: 'A customer has uploaded a new prescription.',
        reference_type: 'PRESCRIPTION',
        reference_id: result.id
      });
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error uploading prescription:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get pharmacy prescriptions
  async getPharmacyPrescriptions(req: AuthenticatedRequest, res: Response) {
    const pharmacyId = req.user!.pharmacyId;
    const { status } = req.query;
    
    try {
      const result = await PrescriptionService.getPharmacyPrescriptions(pharmacyId, status as string);
      res.json(result);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Customer gets their own prescriptions
  async getCustomerPrescriptions(req: AuthenticatedRequest, res: Response) {
    // Assuming the customerId is passed or derived from the user
    // For simplicity, we just use the user's customer profiles. Wait, user can have multiple customer profiles across pharmacies.
    const { customerId } = req.params;
    
    try {
      const result = await PrescriptionService.getCustomerPrescriptions(parseInt(customerId));
      res.json(result);
    } catch (error) {
      console.error('Error fetching customer prescriptions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update prescription status (e.g. ARCHIVE)
  async updateStatus(req: AuthenticatedRequest, res: Response) {
    const pharmacyId = req.user!.pharmacyId;
    const prescriptionId = parseInt(req.params.id);
    const { status } = req.body;
    
    try {
      const result = await PrescriptionService.updatePrescriptionStatus(prescriptionId, pharmacyId, status);
      res.json(result);
    } catch (error: any) {
      console.error('Error updating prescription status:', error);
      if (error.message === 'Prescription not found') {
        res.status(404).json({ error: 'Prescription not found' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
};
