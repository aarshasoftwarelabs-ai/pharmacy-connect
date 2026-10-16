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

      const role = (user.role || '').toUpperCase();

      // OWNER, ADMIN, and Pharmacy operators have full access to manage their pharmacy
      if (role === 'OWNER' || role === 'ADMIN' || (user.pharmacyId && !user.isStaff)) {
        return next();
      }

      // Staff are counter operators who scan barcodes, add/inward stock, and create POS bills
      if (user.isStaff) {
        const staffId = user.userId;
        const pharmacyId = user.pharmacyId;

        const defaultStaffAllowed = [
          'MEDICINES_VIEW',
          'MEDICINES_CREATE',
          'MEDICINES_EDIT',
          'INVENTORY_ADJUST',
          'BILLING_VIEW',
          'BILLING_CREATE',
          'CUSTOMERS_VIEW',
          'CUSTOMERS_CREATE'
        ];

        // Check if explicitly revoked by pharmacy owner
        const checkRevoked = await pool.query(
          `SELECT 1 FROM staff_permissions 
           WHERE staff_id = $1 AND pharmacy_id = $2 AND permission_key = $3 AND granted = false`,
          [staffId, pharmacyId, permissionKey]
        );
        if (checkRevoked.rows.length > 0) {
          return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to perform this action' });
        }

        if (defaultStaffAllowed.includes(permissionKey)) {
          return next();
        }

        const checkQuery = `
          SELECT permission_key FROM staff_permissions 
          WHERE staff_id = $1 AND pharmacy_id = $2 AND granted = true
        `;
        const result = await pool.query(checkQuery, [staffId, pharmacyId]);
        const permissions = new Set(result.rows.map(r => r.permission_key));

        if (permissions.has(permissionKey)) {
          return next();
        }

        return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to perform this action' });
      }

      // If user is attached to a pharmacy, grant access
      if (user.pharmacyId) {
        return next();
      }

      return res.status(403).json({ success: false, message: 'Forbidden: Invalid role or missing pharmacy assignment' });
    } catch (error) {
      console.error('Permission Check Error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error during permission check' });
    }
  };
};
