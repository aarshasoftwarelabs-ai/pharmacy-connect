import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import pool from '../config/database';

export const CustomerController = {
  // Get all customers for the pharmacy
  async getCustomers(req: AuthenticatedRequest, res: Response) {
    const pharmacyId = req.user!.pharmacyId;
    const { search, filter } = req.query;
    
    try {
      let query = `
        SELECT c.*,
               COUNT(b.id) as total_bills,
               COALESCE(SUM(b.total), 0) as total_spend,
               MAX(b.bill_date) as last_purchase_date
        FROM customer_profiles c
        LEFT JOIN bills b ON b.customer_profile_id = c.id
        WHERE c.pharmacy_id = $1
      `;
      const queryParams: any[] = [pharmacyId];

      if (search) {
        query += ` AND (c.display_name ILIKE $2 OR c.phone ILIKE $2 OR c.email ILIKE $2)`;
        queryParams.push(`%${search}%`);
      }
      
      if (filter === 'active') {
        query += ` AND c.is_active = true`;
      } else if (filter === 'inactive') {
        query += ` AND c.is_active = false`;
      }

      query += ` GROUP BY c.id ORDER BY last_purchase_date DESC NULLS LAST, c.created_at DESC`;

      const result = await pool.query(query, queryParams);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get single customer profile
  async getCustomerById(req: AuthenticatedRequest, res: Response) {
    const pharmacyId = req.user!.pharmacyId;
    const customerId = req.params.id;
    
    try {
      const result = await pool.query(`
        SELECT c.*,
               COUNT(b.id) as total_bills,
               COALESCE(SUM(b.total), 0) as total_spend,
               MAX(b.bill_date) as last_purchase_date
        FROM customer_profiles c
        LEFT JOIN bills b ON b.customer_profile_id = c.id
        WHERE c.pharmacy_id = $1 AND c.id = $2
        GROUP BY c.id
      `, [pharmacyId, customerId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching customer:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get customer bills
  async getCustomerBills(req: AuthenticatedRequest, res: Response) {
    const pharmacyId = req.user!.pharmacyId;
    const customerId = req.params.id;
    
    try {
      const result = await pool.query(`
        SELECT * FROM bills 
        WHERE pharmacy_id = $1 AND customer_profile_id = $2 
        ORDER BY bill_date DESC
      `, [pharmacyId, customerId]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching customer bills:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get customer medicine requests
  async getCustomerRequests(req: AuthenticatedRequest, res: Response) {
    const pharmacyId = req.user!.pharmacyId;
    const customerId = req.params.id;
    
    try {
      const result = await pool.query(`
        SELECT * FROM medicine_requests 
        WHERE pharmacy_id = $1 AND customer_profile_id = $2 
        ORDER BY created_at DESC
      `, [pharmacyId, customerId]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching customer requests:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update customer profile
  async updateCustomer(req: AuthenticatedRequest, res: Response) {
    const pharmacyId = req.user!.pharmacyId;
    const customerId = req.params.id;
    const { display_name, phone, email, date_of_birth, gender, address, notes, is_active } = req.body;
    
    try {
      const result = await pool.query(`
        UPDATE customer_profiles 
        SET display_name = COALESCE($1, display_name),
            phone = COALESCE($2, phone),
            email = COALESCE($3, email),
            date_of_birth = COALESCE($4, date_of_birth),
            gender = COALESCE($5, gender),
            address = COALESCE($6, address),
            notes = COALESCE($7, notes),
            is_active = COALESCE($8, is_active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $9 AND pharmacy_id = $10
        RETURNING *
      `, [display_name, phone, email, date_of_birth, gender, address, notes, is_active, customerId, pharmacyId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
