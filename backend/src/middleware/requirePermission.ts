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

      // Staff must have the explicit permission granted
      if (user.isStaff) {
        const staffId = user.userId;
        const pharmacyId = user.pharmacyId;

        // Viewing medicines is a baseline requirement for any pharmacy staff / POS
        if (permissionKey === 'MEDICINES_VIEW') {
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

        // Convenient mappings for staff scanning & inventory:
        if ((permissionKey === 'MEDICINES_EDIT' || permissionKey === 'INVENTORY_ADJUST') && 
            (permissions.has('INVENTORY_ADJUST') || permissions.has('MEDICINES_EDIT') || permissions.has('BILLING_CREATE'))) {
          return next();
        }
        if (permissionKey === 'MEDICINES_CREATE' && (permissions.has('INVENTORY_ADJUST') || permissions.has('BILLING_CREATE') || permissions.has('MEDICINES_EDIT'))) {
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
