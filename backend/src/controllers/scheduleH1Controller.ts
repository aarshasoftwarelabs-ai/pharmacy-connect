import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ScheduleH1Service } from '../services/scheduleH1Service';
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
      const {
        patientName, patientPhone, patientAddress,
        doctorName, doctorRegNo, doctorAddress,
        medicineName, genericName, batchNumber,
        quantity, unit, supplyDate
      } = req.body;

      if (!patientName || !doctorName || !medicineName || !batchNumber || !quantity) {
        return res.status(400).json({
          success: false,
          message: 'Patient Name, Doctor Name, Medicine Name, Batch Number, and Quantity are mandatory for Schedule H1 compliance'
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
        quantity: parseInt(String(quantity), 10),
        unit: unit || 'Strip',
        supplyDate: supplyDate || new Date().toISOString().split('T')[0]
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
          m.name ~* '\\b(alprazolam|tramadol|cefixime|cefpodoxime|ceftriaxone|meropenem|faropenem|colistin|levofloxacin|moxifloxacin|clonazepam|lorazepam|diazepam|zolpidem|chlordiazepoxide|clobazam|nitrazepam|linezolid|rifampicin|isoniazid|pyrazinamide|ethambutol)\\b' OR
          COALESCE(m.generic_name, '') ~* '\\b(alprazolam|tramadol|cefixime|cefpodoxime|ceftriaxone|meropenem|faropenem|colistin|levofloxacin|moxifloxacin|clonazepam|lorazepam|diazepam|zolpidem|chlordiazepoxide|clobazam|nitrazepam|linezolid|rifampicin|isoniazid|pyrazinamide|ethambutol)\\b'
        )
        GROUP BY m.id
        ORDER BY m.name ASC
      `;
      const result = await pool.query(query, [pharmacyId]);
      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      console.error('Error fetching Schedule H1 medicines:', error);
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
  }
}
