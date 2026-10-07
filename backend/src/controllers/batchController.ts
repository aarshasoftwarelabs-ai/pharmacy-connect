import { Response } from 'express';
import pool from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

export class BatchController {
  
  static async getBatches(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const result = await pool.query(
        `SELECT b.*, m.name as medicine_name 
         FROM medicine_batches b
         JOIN medicines m ON b.medicine_id = m.id
         WHERE b.pharmacy_id = $1
         ORDER BY b.expiry_date ASC`,
        [pharmacyId]
      );
      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      console.error('Error fetching batches:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  static async getBatchById(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const batchId = parseInt(req.params.id);
      
      const result = await pool.query(
        `SELECT b.*, m.name as medicine_name 
         FROM medicine_batches b
         JOIN medicines m ON b.medicine_id = m.id
         WHERE b.id = $1 AND b.pharmacy_id = $2`,
        [batchId, pharmacyId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }
      
      res.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      console.error('Error fetching batch:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  static async getExpiringBatches(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      // configurable period, for now 90 days
      const result = await pool.query(
        `SELECT b.*, m.name as medicine_name 
         FROM medicine_batches b
         JOIN medicines m ON b.medicine_id = m.id
         WHERE b.pharmacy_id = $1 
         AND b.expiry_date > CURRENT_DATE 
         AND b.expiry_date <= CURRENT_DATE + INTERVAL '90 days'
         ORDER BY b.expiry_date ASC`,
        [pharmacyId]
      );
      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      console.error('Error fetching expiring batches:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  static async getExpiredBatches(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const result = await pool.query(
        `SELECT b.*, m.name as medicine_name 
         FROM medicine_batches b
         JOIN medicines m ON b.medicine_id = m.id
         WHERE b.pharmacy_id = $1 
         AND b.expiry_date < CURRENT_DATE
         ORDER BY b.expiry_date DESC`,
        [pharmacyId]
      );
      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      console.error('Error fetching expired batches:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}
