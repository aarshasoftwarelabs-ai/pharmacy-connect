import { Response } from 'express';
import pool from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

export class SupplierController {
  
  static async getSuppliers(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const result = await pool.query(
        'SELECT * FROM suppliers WHERE pharmacy_id = $1 ORDER BY supplier_name ASC',
        [pharmacyId]
      );
      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({ success: false, message: 'Server error fetching suppliers' });
    }
  }

  static async getSupplierById(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const supplierId = parseInt(req.params.id);
      
      const result = await pool.query(
        'SELECT * FROM suppliers WHERE id = $1 AND pharmacy_id = $2',
        [supplierId, pharmacyId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }
      
      res.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      console.error('Error fetching supplier:', error);
      res.status(500).json({ success: false, message: 'Server error fetching supplier' });
    }
  }

  static async createSupplier(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const {
        supplier_name, contact_person, mobile, email, address,
        city, state, pincode, gstin, drug_license_number,
        opening_balance, notes
      } = req.body;

      if (!supplier_name) {
        return res.status(400).json({ success: false, message: 'Supplier name is required' });
      }

      // Check duplicate
      const checkResult = await pool.query(
        'SELECT id FROM suppliers WHERE pharmacy_id = $1 AND supplier_name = $2',
        [pharmacyId, supplier_name]
      );
      
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'A supplier with this name already exists' });
      }

      const result = await pool.query(
        `INSERT INTO suppliers (
          pharmacy_id, supplier_name, contact_person, mobile, email,
          address, city, state, pincode, gstin, drug_license_number,
          opening_balance, current_balance, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12, $13)
        RETURNING *`,
        [
          pharmacyId, supplier_name, contact_person, mobile, email,
          address, city, state, pincode, gstin, drug_license_number,
          opening_balance || 0, notes
        ]
      );

      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      console.error('Error creating supplier:', error);
      res.status(500).json({ success: false, message: 'Server error creating supplier' });
    }
  }

  static async updateSupplier(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const supplierId = parseInt(req.params.id);
      
      const {
        supplier_name, contact_person, mobile, email, address,
        city, state, pincode, gstin, drug_license_number,
        status, notes
      } = req.body;

      // Ensure supplier belongs to pharmacy
      const checkResult = await pool.query(
        'SELECT id FROM suppliers WHERE id = $1 AND pharmacy_id = $2',
        [supplierId, pharmacyId]
      );
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }

      const result = await pool.query(
        `UPDATE suppliers SET 
          supplier_name = COALESCE($1, supplier_name),
          contact_person = COALESCE($2, contact_person),
          mobile = COALESCE($3, mobile),
          email = COALESCE($4, email),
          address = COALESCE($5, address),
          city = COALESCE($6, city),
          state = COALESCE($7, state),
          pincode = COALESCE($8, pincode),
          gstin = COALESCE($9, gstin),
          drug_license_number = COALESCE($10, drug_license_number),
          status = COALESCE($11, status),
          notes = COALESCE($12, notes),
          updated_at = NOW()
        WHERE id = $13 AND pharmacy_id = $14
        RETURNING *`,
        [
          supplier_name, contact_person, mobile, email, address,
          city, state, pincode, gstin, drug_license_number, status, notes,
          supplierId, pharmacyId
        ]
      );

      res.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      console.error('Error updating supplier:', error);
      res.status(500).json({ success: false, message: 'Server error updating supplier' });
    }
  }

  static async deleteSupplier(req: AuthenticatedRequest, res: Response) {
    try {
      const pharmacyId = req.user!.pharmacyId;
      const supplierId = parseInt(req.params.id);
      
      // We will softly deactivate rather than hard delete if they have invoices, 
      // but for simplicity, we'll try to delete or catch RESTRICT error.
      // Easiest is to set status to INACTIVE.
      
      const result = await pool.query(
        'UPDATE suppliers SET status = $1 WHERE id = $2 AND pharmacy_id = $3 RETURNING *',
        ['INACTIVE', supplierId, pharmacyId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }

      res.json({ success: true, message: 'Supplier deactivated', data: result.rows[0] });
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({ success: false, message: 'Server error deleting supplier' });
    }
  }
}
