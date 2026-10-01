import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { env } from '../config/env';
import { sendSecurityAlertEmail } from '../services/emailService';

const JWT_SECRET = env.JWT_SECRET || 'your_super_secret_jwt_key_here';

export interface AuthUser {
  userId: number;
  phone: string;
  pharmacyId: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    if (env.NODE_ENV === 'development') {
      req.user = { userId: 1, phone: '9876543210', pharmacyId: 1 };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    const userQuery = `SELECT id FROM users WHERE id = $1`;
    const userResult = await pool.query(userQuery, [decoded.userId]);
    if (userResult.rows.length === 0) {
      if (env.NODE_ENV === 'development') {
        req.user = { userId: 1, phone: '9876543210', pharmacyId: 1 };
        return next();
      }
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (env.NODE_ENV === 'development') {
      req.user = { userId: 1, phone: '9876543210', pharmacyId: 1 };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};


