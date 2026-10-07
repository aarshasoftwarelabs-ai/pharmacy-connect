import { Response, NextFunction } from 'express';
import pool from '../config/database';
import { AuthenticatedRequest } from './auth';

export const requirePermission = (permissionKey: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      // OWNER has full access
      if (user.role === 'OWNER') {
        return next();
      }

      // Staff must have the explicit permission granted
      if (user.isStaff) {
        const staffId = user.userId;
        const pharmacyId = user.pharmacyId;

        const checkQuery = `
          SELECT granted FROM staff_permissions 
          WHERE staff_id = $1 AND pharmacy_id = $2 AND permission_key = $3
        `;
        const result = await pool.query(checkQuery, [staffId, pharmacyId, permissionKey]);

        if (result.rows.length > 0 && result.rows[0].granted === true) {
          return next();
        } else {
          return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to perform this action' });
        }
      }

      // Any other role (like USER from Flutter app) should not have access to pharmacy routes
      return res.status(403).json({ success: false, message: 'Forbidden: Invalid role' });
    } catch (error) {
      console.error('Permission Check Error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error during permission check' });
    }
  };
};
