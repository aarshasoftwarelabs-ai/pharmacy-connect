import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { SCHEDULE_H1_DRUGS_REGEX, ScheduleH1Service } from '../services/scheduleH1Service';
import pool from '../config/database';

export class ScheduleH1Controller {
  /**
   * Get Schedule H1 statutory register entries
   */
  static async getRegister(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const { startDate, endDate, search, limit, offset } = req.query;

      const result = await ScheduleH1Service.getRegister(pharmacyId, {
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        search: search ? String(search) : undefined,
        limit: limit ? parseInt(String(limit), 10) : 50,
        offset: offset ? parseInt(String(offset), 10) : 0
      });

      res.json({
        success: true,
        data: result.data,
        total: result.total,
        limit: result.limit,
        offset: result.offset
      });
    } catch (error: any) {
      console.error('Error fetching Schedule H1 register:', error);
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
  }

  /**
   * Get Schedule H1 statistics
   */
  static async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const stats = await ScheduleH1Service.getStats(pharmacyId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('Error fetching Schedule H1 stats:', error);
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
  }

  /**
   * Manual record addition into Schedule H1 statutory register
   */
  static async addManualEntry(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const body = req.body || {};
      const patientName = (body.patientName ?? body.patient_name ?? '').toString().trim();
      const patientPhone = (body.patientPhone ?? body.patient_phone ?? '').toString().trim() || null;
      const patientAddress = (body.patientAddress ?? body.patient_address ?? '').toString().trim() || null;
      const doctorName = (body.doctorName ?? body.doctor_name ?? '').toString().trim();
      const doctorRegNo = (body.doctorRegNo ?? body.doctor_reg_no ?? '').toString().trim() || null;
      const doctorAddress = (body.doctorAddress ?? body.doctor_address ?? '').toString().trim() || null;
      const medicineName = (body.medicineName ?? body.medicine_name ?? '').toString().trim();
      const genericName = (body.genericName ?? body.generic_name ?? '').toString().trim() || null;
      const batchNumber = (body.batchNumber ?? body.batch_number ?? '').toString().trim();
      const parsedQty = parseInt(String(body.quantity ?? '0'), 10);
      const unit = (body.unit ?? 'Strip').toString().trim() || 'Strip';
      const supplyDate = (body.supplyDate ?? body.supply_date ?? '').toString().trim() || new Date().toISOString().split('T')[0];

      if (!patientName || !doctorName || !medicineName || !batchNumber || !Number.isFinite(parsedQty) || parsedQty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Patient Name, Doctor Name, Medicine Name, Batch Number, and valid Quantity (> 0) are mandatory for Schedule H1 compliance'
        });
      }

      const record = await ScheduleH1Service.recordDispensation({
        pharmacyId,
        patientName,
        patientPhone,
        patientAddress,
        doctorName,
        doctorRegNo,
        doctorAddress,
        medicineName,
        genericName,
        batchNumber,
        quantity: parsedQty,
        unit,
        supplyDate
      });

      res.status(201).json({
        success: true,
        message: 'Schedule H1 entry recorded in statutory digital register',
        data: record
      });
    } catch (error: any) {
      console.error('Error recording manual Schedule H1 entry:', error);
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
  }

  /**
   * Get all Schedule H1 medicines in pharmacy stock
   */
  static async getH1Medicines(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const query = `
        SELECT m.id, m.name, m.generic_name, m.manufacturer, m.strength, m.current_stock, m.is_schedule_h1,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', b.id,
                     'batchNumber', b.batch_number,
                     'availableQuantity', b.available_quantity,
                     'expiryDate', b.expiry_date
                   )
                 ) FILTER (WHERE b.id IS NOT NULL), '[]'
               ) as batches
        FROM medicines m
        LEFT JOIN medicine_batches b ON m.id = b.medicine_id AND b.available_quantity > 0
        WHERE m.pharmacy_id = $1 AND (
          m.is_schedule_h1 = true OR
          m.name ~* $2 OR
          COALESCE(m.generic_name, '') ~* $2
        )
        GROUP BY m.id
        ORDER BY m.name ASC
      `;
      const result = await pool.query(query, [pharmacyId, SCHEDULE_H1_DRUGS_REGEX.source]);
      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      console.error('Error fetching Schedule H1 medicines:', error);
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
  }
}
