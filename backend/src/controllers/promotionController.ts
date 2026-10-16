import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

export class PromotionController {
  /**
   * Get all active sponsored banners for mobile/PC apps
   */
  static async getActiveBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const query = `
        SELECT 
          id, title, company_name AS "companyName", badge_text AS "badgeText",
          description, scheme_offer AS "schemeOffer", banner_image_url AS "bannerImageUrl",
          bg_gradient_start AS "bgGradientStart", bg_gradient_end AS "bgGradientEnd",
          action_type AS "actionType", action_value AS "actionValue",
          contact_person AS "contactPerson", priority, is_active AS "isActive",
          click_count AS "clickCount", impression_count AS "impressionCount",
          created_at AS "createdAt"
        FROM sponsored_banners
        WHERE is_active = true
        ORDER BY priority DESC, id DESC
      `;
      const result = await pool.query(query);
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all banners including inactive ones for Admin management
   */
  static async getAllBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const query = `
        SELECT 
          id, title, company_name AS "companyName", badge_text AS "badgeText",
          description, scheme_offer AS "schemeOffer", banner_image_url AS "bannerImageUrl",
          bg_gradient_start AS "bgGradientStart", bg_gradient_end AS "bgGradientEnd",
          action_type AS "actionType", action_value AS "actionValue",
          contact_person AS "contactPerson", priority, is_active AS "isActive",
          click_count AS "clickCount", impression_count AS "impressionCount",
          created_at AS "createdAt"
        FROM sponsored_banners
        ORDER BY priority DESC, id DESC
      `;
      const result = await pool.query(query);
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new sponsored banner
   */
  static async createBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        title,
        companyName,
        badgeText,
        description,
        schemeOffer,
        bannerImageUrl,
        bgGradientStart,
        bgGradientEnd,
        actionType,
        actionValue,
        contactPerson,
        priority,
        isActive
      } = req.body;

      if (!title || !companyName) {
        return res.status(400).json({ success: false, message: 'Title and companyName are required' });
      }

      const insertQuery = `
        INSERT INTO sponsored_banners (
          title, company_name, badge_text, description, scheme_offer,
          banner_image_url, bg_gradient_start, bg_gradient_end,
          action_type, action_value, contact_person, priority, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING 
          id, title, company_name AS "companyName", badge_text AS "badgeText",
          description, scheme_offer AS "schemeOffer", banner_image_url AS "bannerImageUrl",
          bg_gradient_start AS "bgGradientStart", bg_gradient_end AS "bgGradientEnd",
          action_type AS "actionType", action_value AS "actionValue",
          contact_person AS "contactPerson", priority, is_active AS "isActive",
          click_count AS "clickCount", impression_count AS "impressionCount",
          created_at AS "createdAt"
      `;

      const values = [
        title,
        companyName,
        badgeText || 'SPONSORED SCHEME',
        description || '',
        schemeOffer || '',
        bannerImageUrl || null,
        bgGradientStart || '#059669',
        bgGradientEnd || '#0f766e',
        actionType || 'WHATSAPP',
        actionValue || '',
        contactPerson || '',
        Number(priority || 1),
        isActive !== undefined ? Boolean(isActive) : true
      ];

      const result = await pool.query(insertQuery, values);
      res.status(201).json({
        success: true,
        message: 'Sponsored banner created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing sponsored banner
   */
  static async updateBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const bannerId = Number(req.params.id);
      if (isNaN(bannerId)) {
        return res.status(400).json({ success: false, message: 'Invalid banner ID' });
      }

      const {
        title,
        companyName,
        badgeText,
        description,
        schemeOffer,
        bannerImageUrl,
        bgGradientStart,
        bgGradientEnd,
        actionType,
        actionValue,
        contactPerson,
        priority,
        isActive
      } = req.body;

      const updateQuery = `
        UPDATE sponsored_banners SET
          title = COALESCE($1, title),
          company_name = COALESCE($2, company_name),
          badge_text = COALESCE($3, badge_text),
          description = COALESCE($4, description),
          scheme_offer = COALESCE($5, scheme_offer),
          banner_image_url = COALESCE($6, banner_image_url),
          bg_gradient_start = COALESCE($7, bg_gradient_start),
          bg_gradient_end = COALESCE($8, bg_gradient_end),
          action_type = COALESCE($9, action_type),
          action_value = COALESCE($10, action_value),
          contact_person = COALESCE($11, contact_person),
          priority = COALESCE($12, priority),
          is_active = COALESCE($13, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $14
        RETURNING 
          id, title, company_name AS "companyName", badge_text AS "badgeText",
          description, scheme_offer AS "schemeOffer", banner_image_url AS "bannerImageUrl",
          bg_gradient_start AS "bgGradientStart", bg_gradient_end AS "bgGradientEnd",
          action_type AS "actionType", action_value AS "actionValue",
          contact_person AS "contactPerson", priority, is_active AS "isActive",
          click_count AS "clickCount", impression_count AS "impressionCount",
          updated_at AS "updatedAt"
      `;

      const values = [
        title,
        companyName,
        badgeText,
        description,
        schemeOffer,
        bannerImageUrl,
        bgGradientStart,
        bgGradientEnd,
        actionType,
        actionValue,
        contactPerson,
        priority !== undefined ? Number(priority) : null,
        isActive !== undefined ? Boolean(isActive) : null,
        bannerId
      ];

      const result = await pool.query(updateQuery, values);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Banner not found' });
      }

      res.json({
        success: true,
        message: 'Sponsored banner updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a sponsored banner
   */
  static async deleteBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const bannerId = Number(req.params.id);
      if (isNaN(bannerId)) {
        return res.status(400).json({ success: false, message: 'Invalid banner ID' });
      }

      const result = await pool.query('DELETE FROM sponsored_banners WHERE id = $1 RETURNING id', [bannerId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Banner not found' });
      }

      res.json({
        success: true,
        message: 'Sponsored banner deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Track banner click
   */
  static async trackClick(req: Request, res: Response, next: NextFunction) {
    try {
      const bannerId = Number(req.params.id);
      if (!isNaN(bannerId)) {
        await pool.query('UPDATE sponsored_banners SET click_count = click_count + 1 WHERE id = $1', [bannerId]);
      }
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Track banner impression
   */
  static async trackImpression(req: Request, res: Response, next: NextFunction) {
    try {
      const bannerId = Number(req.params.id);
      if (!isNaN(bannerId)) {
        await pool.query('UPDATE sponsored_banners SET impression_count = impression_count + 1 WHERE id = $1', [bannerId]);
      }
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
