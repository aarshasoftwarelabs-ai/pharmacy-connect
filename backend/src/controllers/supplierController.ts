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
        supplier_name, contact_person, mobile, alternate_phone, email, address,
        city, state, pincode, gstin, drug_license_number, fssai_number, pan_number,
        credit_period_days, opening_balance, bank_name, account_number,
        ifsc_code, branch_name, upi_id, deals_in_brands, notes
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
          pharmacy_id, supplier_name, contact_person, mobile, alternate_phone, email,
          address, city, state, pincode, gstin, drug_license_number, fssai_number, pan_number,
          credit_period_days, opening_balance, current_balance, bank_name, account_number,
          ifsc_code, branch_name, upi_id, deals_in_brands, notes, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $16, $17, $18,
          $19, $20, $21, $22, $23, 'ACTIVE'
        )
        RETURNING *`,
        [
          pharmacyId,
          supplier_name,
          contact_person || null,
          mobile || null,
          alternate_phone || null,
          email || null,
          address || null,
          city || null,
          state || 'Gujarat',
          pincode || null,
          gstin ? gstin.toUpperCase().trim() : null,
          drug_license_number || null,
          fssai_number || null,
          pan_number ? pan_number.toUpperCase().trim() : null,
          credit_period_days ? parseInt(credit_period_days) : 21,
          opening_balance ? parseFloat(opening_balance) : 0,
          bank_name || null,
          account_number || null,
          ifsc_code ? ifsc_code.toUpperCase().trim() : null,
          branch_name || null,
          upi_id || null,
          deals_in_brands || null,
          notes || null
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
        supplier_name, contact_person, mobile, alternate_phone, email, address,
        city, state, pincode, gstin, drug_license_number, fssai_number, pan_number,
        credit_period_days, bank_name, account_number, ifsc_code, branch_name,
        upi_id, deals_in_brands, status, notes
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
          alternate_phone = COALESCE($4, alternate_phone),
          email = COALESCE($5, email),
          address = COALESCE($6, address),
          city = COALESCE($7, city),
          state = COALESCE($8, state),
          pincode = COALESCE($9, pincode),
          gstin = COALESCE($10, gstin),
          drug_license_number = COALESCE($11, drug_license_number),
          fssai_number = COALESCE($12, fssai_number),
          pan_number = COALESCE($13, pan_number),
          credit_period_days = COALESCE($14, credit_period_days),
          bank_name = COALESCE($15, bank_name),
          account_number = COALESCE($16, account_number),
          ifsc_code = COALESCE($17, ifsc_code),
          branch_name = COALESCE($18, branch_name),
          upi_id = COALESCE($19, upi_id),
          deals_in_brands = COALESCE($20, deals_in_brands),
          status = COALESCE($21, status),
          notes = COALESCE($22, notes),
          updated_at = NOW()
        WHERE id = $23 AND pharmacy_id = $24
        RETURNING *`,
        [
          supplier_name, contact_person, mobile, alternate_phone, email,
          address, city, state, pincode,
          gstin ? gstin.toUpperCase().trim() : null,
          drug_license_number, fssai_number,
          pan_number ? pan_number.toUpperCase().trim() : null,
          credit_period_days !== undefined ? parseInt(credit_period_days) : null,
          bank_name, account_number,
          ifsc_code ? ifsc_code.toUpperCase().trim() : null,
          branch_name, upi_id, deals_in_brands,
          status, notes,
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
