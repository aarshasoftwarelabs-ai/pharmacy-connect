import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

export const reviewController = {
  getPublicReviews: async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT r.*, p.name as pharmacy_name 
        FROM software_reviews r
        JOIN pharmacies p ON r.pharmacy_id = p.id
        WHERE r.is_public = true
        ORDER BY r.created_at DESC
        LIMIT 20
      `);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching public reviews:', error);
      res.status(500).json({ error: 'Failed to fetch reviews', details: error instanceof Error ? error.message : String(error) });
    }
  },

  getMyReview: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const pharmacyId = req.user?.pharmacyId;
      if (!pharmacyId) return res.status(401).json({ error: 'Unauthorized' });

      const result = await pool.query(
        'SELECT * FROM software_reviews WHERE pharmacy_id = $1',
        [pharmacyId]
      );
      
      res.json(result.rows[0] || null);
    } catch (error) {
      console.error('Error fetching my review:', error);
      res.status(500).json({ error: 'Failed to fetch review' });
    }
  },

  submitReview: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const pharmacyId = req.user?.pharmacyId;
      if (!pharmacyId) return res.status(401).json({ error: 'Unauthorized' });

      const { ui_rating, features_rating, service_rating, comment } = req.body;

      if (!ui_rating || !features_rating || !service_rating) {
        return res.status(400).json({ error: 'All ratings are required' });
      }

      const result = await pool.query(`
        INSERT INTO software_reviews (pharmacy_id, ui_rating, features_rating, service_rating, comment)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (pharmacy_id) 
        DO UPDATE SET 
          ui_rating = EXCLUDED.ui_rating,
          features_rating = EXCLUDED.features_rating,
          service_rating = EXCLUDED.service_rating,
          comment = EXCLUDED.comment,
          created_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [pharmacyId, ui_rating, features_rating, service_rating, comment]);

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error submitting review:', error);
      res.status(500).json({ error: 'Failed to submit review' });
    }
  }
};
