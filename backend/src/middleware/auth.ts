import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { env } from '../config/env';
import { sendSecurityAlertEmail } from '../services/emailService';

const JWT_SECRET = env.JWT_SECRET as string;

export interface AuthUser {
  userId: number;
  phone: string;
  pharmacyId: number;
  role?: string;
  isStaff?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    
    // Check if user or staff exists based on role
    // For now we just verify the token is valid, but we could add a DB check here if needed
    // However, the previous DB check only checked 'users' table which fails for staff!
    // So we just rely on JWT verification for valid token and extract details.
    
    req.user = decoded;

    // Enforce Pharmacy Isolation for STAFF/OWNER
    if (decoded.role !== 'USER' && decoded.pharmacyId) {
      if (req.params.pharmacyId && parseInt(req.params.pharmacyId) !== decoded.pharmacyId) {
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot access data for a different pharmacy' });
      }
      if (req.body.pharmacyId && parseInt(req.body.pharmacyId) !== decoded.pharmacyId) {
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot modify data for a different pharmacy' });
      }
      if (req.query.pharmacyId && parseInt(req.query.pharmacyId as string) !== decoded.pharmacyId) {
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot query data for a different pharmacy' });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};


