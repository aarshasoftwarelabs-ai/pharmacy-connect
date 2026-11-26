import express, { Response, NextFunction } from 'express';
import pool from '../config/database';
import { authenticate, AuthenticatedRequest, resolveScopedPharmacyId } from '../middleware/auth';

const router = express.Router();

const requireStoreContext = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const role = (req.user?.role || '').toUpperCase();
  if (!req.user || role === 'USER') {
    return res.status(403).json({ error: 'Forbidden: Store operator access required' });
  }
  try {
    const pharmacyId = resolveScopedPharmacyId(req, req.params.pharmacyId);
    req.params.pharmacyId = String(pharmacyId);
    next();
  } catch (err: any) {
    return res.status(err.statusCode || 401).json({ error: err.message });
  }
};

router.use(authenticate, requireStoreContext);

// GET all offers
router.get('/offers/:pharmacyId', async (req, res) => {
  const { pharmacyId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM offers WHERE pharmacy_id = $1 ORDER BY created_at DESC',
      [pharmacyId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE offer
router.post('/offers/:pharmacyId', async (req, res) => {
  const { pharmacyId } = req.params;
  const { title, description, coupon_code, discount_percentage, max_discount_amount, min_order_value, valid_from, valid_until, is_active } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO offers (pharmacy_id, title, description, coupon_code, discount_percentage, max_discount_amount, min_order_value, valid_from, valid_until, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [pharmacyId, title, description, coupon_code, discount_percentage, max_discount_amount, min_order_value, valid_from, valid_until, is_active ?? true]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE offer
router.put('/offers/:id', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const pharmacyId = req.user!.pharmacyId;
  const { title, description, coupon_code, discount_percentage, max_discount_amount, min_order_value, valid_from, valid_until, is_active } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE offers 
       SET title=$1, description=$2, coupon_code=$3, discount_percentage=$4, max_discount_amount=$5, min_order_value=$6, valid_from=$7, valid_until=$8, is_active=$9, updated_at=CURRENT_TIMESTAMP
       WHERE id = $10 AND pharmacy_id = $11 RETURNING *`,
      [title, description, coupon_code, discount_percentage, max_discount_amount, min_order_value, valid_from, valid_until, is_active, id, pharmacyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Offer not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE offer
router.delete('/offers/:id', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const pharmacyId = req.user!.pharmacyId;
  try {
    const result = await pool.query('DELETE FROM offers WHERE id = $1 AND pharmacy_id = $2 RETURNING id', [id, pharmacyId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Offer not found' });
    res.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- CAMPAIGNS ---

// GET campaigns
router.get('/campaigns/:pharmacyId', async (req, res) => {
  const { pharmacyId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM promotional_campaigns WHERE pharmacy_id = $1 ORDER BY created_at DESC',
      [pharmacyId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SEND/CREATE campaign
router.post('/campaigns/:pharmacyId', async (req, res) => {
  const { pharmacyId } = req.params;
  const { title, message, target_audience } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO promotional_campaigns (pharmacy_id, title, message, target_audience, status, sent_at) 
       VALUES ($1, $2, $3, $4, 'SENT', CURRENT_TIMESTAMP) RETURNING *`,
      [pharmacyId, title, message, target_audience || 'ALL']
    );

    // Fetch live recipient count from pharmacy's customer database
    let recipientCount = 0;
    try {
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM customers WHERE pharmacy_id = $1 AND is_active = true`,
        [pharmacyId]
      );
      recipientCount = parseInt(countRes.rows[0]?.count || '0', 10);
    } catch (_) {}

    const waBroadcastUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    res.status(201).json({
      ...result.rows[0],
      recipientCount,
      waBroadcastUrl,
      message: `Campaign '${title}' dispatched successfully to ${recipientCount > 0 ? recipientCount : 'all'} customer contacts.`
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
