import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const router = express.Router();

import pool from '../config/database';

// Get all staff for a pharmacy
router.get('/pharmacy/:pharmacyId', async (req, res) => {
  const { pharmacyId } = req.params;
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
router.post('/pharmacy/:pharmacyId', async (req, res) => {
  const { pharmacyId } = req.params;
  const { name, phone, email, role, pin } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO staff_members (pharmacy_id, name, phone, email, role, pin) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, phone, email, role, pin, is_active, created_at',
      [pharmacyId, name, phone, email, role, pin]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update staff
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, role, pin, is_active } = req.body;
  try {
    const result = await pool.query(
      'UPDATE staff_members SET name = $1, phone = $2, email = $3, role = $4, pin = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING id, name, phone, email, role, pin, is_active, created_at',
      [name, phone, email, role, pin, is_active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete staff
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM staff_members WHERE id = $1', [id]);
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
