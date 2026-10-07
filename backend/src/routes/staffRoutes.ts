import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const router = express.Router();

import pool from '../config/database';

router.use(authenticate);

// Get all staff for a pharmacy
router.get('/pharmacy/:pharmacyId', requirePermission('STAFF_VIEW'), async (req: AuthenticatedRequest, res) => {
  const pharmacyId = req.user!.pharmacyId; // Use JWT pharmacyId, not params
  try {
    const result = await pool.query(
      'SELECT id, name, phone, email, role, pin, is_active, created_at FROM staff_members WHERE pharmacy_id = $1 ORDER BY created_at ASC',
      [pharmacyId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new staff
router.post('/pharmacy/:pharmacyId', requirePermission('STAFF_CREATE'), async (req: AuthenticatedRequest, res) => {
  const pharmacyId = req.user!.pharmacyId; // Use JWT pharmacyId
  const { name, phone, email, role, pin } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO staff_members (pharmacy_id, name, phone, email, role, pin) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, phone, email, role, pin, is_active, created_at',
      [pharmacyId, name, phone, email, role, pin]
    );
    
    // Add default permissions for new staff
    const staffId = result.rows[0].id;
    const defaultPermissions = ['DASHBOARD_VIEW', 'BILLING_VIEW', 'BILLING_CREATE'];
    
    for (const perm of defaultPermissions) {
      await pool.query(
        'INSERT INTO staff_permissions (staff_id, pharmacy_id, permission_key, granted) VALUES ($1, $2, $3, $4)',
        [staffId, pharmacyId, perm, true]
      );
    }
    
    // Notify Staff Member
    const { NotificationService, NotificationType } = require('../services/notificationService');
    await NotificationService.notifyStaffMember(staffId, pharmacyId, {
      type: NotificationType.STAFF_ACCOUNT_CREATED,
      title: 'Account Created',
      message: 'Your staff account has been created.',
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update staff
router.put('/:id', requirePermission('STAFF_EDIT'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const pharmacyId = req.user!.pharmacyId;
  const { name, phone, email, role, pin, is_active } = req.body;
  try {
    // Only update if it belongs to the same pharmacy
    const result = await pool.query(
      'UPDATE staff_members SET name = $1, phone = $2, email = $3, role = $4, pin = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND pharmacy_id = $8 RETURNING id, name, phone, email, role, pin, is_active, created_at',
      [name, phone, email, role, pin, is_active, id, pharmacyId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found or unauthorized' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete staff
router.delete('/:id', requirePermission('STAFF_DEACTIVATE'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const pharmacyId = req.user!.pharmacyId;
  try {
    // Only delete if it belongs to the same pharmacy
    const result = await pool.query('DELETE FROM staff_members WHERE id = $1 AND pharmacy_id = $2 RETURNING id', [id, pharmacyId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found or unauthorized' });
    }
    // Notify Staff Member before deleting (wait, they might not be able to login, but notification stays in DB)
    const { NotificationService, NotificationType } = require('../services/notificationService');
    await NotificationService.notifyStaffMember(Number(id), pharmacyId, {
      type: NotificationType.STAFF_ACCOUNT_DEACTIVATED,
      title: 'Account Deactivated',
      message: 'Your staff account has been deactivated.',
    });

    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get staff permissions
router.get('/:id/permissions', requirePermission('STAFF_VIEW'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const pharmacyId = req.user!.pharmacyId;
  try {
    // Verify staff belongs to this pharmacy
    const staffCheck = await pool.query('SELECT id FROM staff_members WHERE id = $1 AND pharmacy_id = $2', [id, pharmacyId]);
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found or unauthorized' });
    }
    
    const result = await pool.query(
      'SELECT permission_key, granted FROM staff_permissions WHERE staff_id = $1 AND pharmacy_id = $2',
      [id, pharmacyId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting staff permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update staff permissions
router.put('/:id/permissions', requirePermission('STAFF_PERMISSIONS'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params; // Staff ID
  const pharmacyId = req.user!.pharmacyId;
  const { permissions } = req.body; // Array of { permission_key, granted }
  
  // Self-Permission Protection: Staff cannot modify their own permissions
  if (req.user!.isStaff && req.user!.userId === parseInt(id)) {
    return res.status(403).json({ error: 'Forbidden: Cannot modify your own permissions' });
  }
  
  try {
    // Verify staff belongs to this pharmacy
    const staffCheck = await pool.query('SELECT id FROM staff_members WHERE id = $1 AND pharmacy_id = $2', [id, pharmacyId]);
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found or unauthorized' });
    }
    
    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const perm of permissions) {
        await client.query(`
          INSERT INTO staff_permissions (staff_id, pharmacy_id, permission_key, granted)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (staff_id, pharmacy_id, permission_key) 
          DO UPDATE SET granted = EXCLUDED.granted, updated_at = CURRENT_TIMESTAMP
        `, [id, pharmacyId, perm.permission_key, perm.granted]);
      }
      
      await client.query('COMMIT');

      // Notify Staff Member
      const { NotificationService, NotificationType } = require('../services/notificationService');
      await NotificationService.notifyStaffMember(Number(id), pharmacyId, {
        type: NotificationType.STAFF_PERMISSION_CHANGED,
        title: 'Permissions Updated',
        message: 'Your staff permissions have been updated by the owner.',
      });

      res.json({ message: 'Permissions updated successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating staff permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
