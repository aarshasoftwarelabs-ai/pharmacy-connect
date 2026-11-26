import { Response } from 'express';
import pool from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { PrescriptionService } from '../services/prescriptionService';
import { NotificationService, NotificationType } from '../services/notificationService';

export const PrescriptionController = {
  // Upload a prescription
  async upload(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.userId;
    const role = (req.user!.role || '').toUpperCase();
    const { customerId, fileUrl, fileName, mimeType, notes } = req.body;
    const pharmacyId = role === 'USER' || role === 'ADMIN'
      ? Number(req.body.pharmacyId)
      : Number(req.user!.pharmacyId);

    if (!Number.isInteger(pharmacyId) || pharmacyId <= 0) {
      return res.status(400).json({ error: 'Valid pharmacyId is required' });
    }
    
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(mimeType)) {
      return res.status(422).json({ error: 'Unsupported file format. Only JPG, PNG, and PDF are allowed.' });
    }

    try {
      if (customerId) {
        const custCheck = await pool.query(
          'SELECT user_id, pharmacy_id FROM customer_profiles WHERE id = $1',
          [Number(customerId)]
        );
        if (custCheck.rows.length > 0) {
          const row = custCheck.rows[0];
          if (role === 'USER' && Number(row.user_id) !== Number(userId)) {
            return res.status(403).json({ error: 'Forbidden: Customer profile mismatch' });
          }
          if (role !== 'USER' && role !== 'ADMIN' && Number(row.pharmacy_id) !== pharmacyId) {
            return res.status(403).json({ error: 'Forbidden: Customer belongs to another pharmacy' });
          }
        }
      }
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
      try {
        const { getIo } = require('../socket');
        const io = getIo();
        io.to(`pharmacy_${pharmacyId}`).emit('new_prescription', result);
        io.to(`pharmacy_${pharmacyId}`).emit('new_request', {
          id: result.id,
          pharmacy_id: pharmacyId,
          medicineName: null,
          prescriptionUrl: fileUrl,
          customerName: 'App Customer',
          isPrescription: true,
          created_at: new Date()
        });
      } catch (e) {
        console.error('Socket emit error for prescription:', e);
      }

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

  // Customer gets their own prescriptions (strictly ownership-checked)
  async getCustomerPrescriptions(req: AuthenticatedRequest, res: Response) {
    const customerIdNum = parseInt(req.params.customerId, 10);
    if (isNaN(customerIdNum)) {
      return res.status(400).json({ error: 'Invalid customerId' });
    }

    const user = req.user!;
    const role = (user.role || '').toUpperCase();

    try {
      if (role !== 'ADMIN') {
        const ownerRes = await pool.query(
          'SELECT user_id, pharmacy_id FROM customer_profiles WHERE id = $1',
          [customerIdNum]
        );
        if (ownerRes.rows.length === 0) {
          return res.status(404).json({ error: 'Customer profile not found' });
        }
        const profile = ownerRes.rows[0];
        const isCustomerOwner = role === 'USER' && Number(profile.user_id) === Number(user.userId);
        const isPharmacyOwner = role !== 'USER' && Number(profile.pharmacy_id) === Number(user.pharmacyId);
        if (!isCustomerOwner && !isPharmacyOwner) {
          return res.status(403).json({ error: 'Forbidden: Access denied' });
        }
      }

      const result = await PrescriptionService.getCustomerPrescriptions(customerIdNum);
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
