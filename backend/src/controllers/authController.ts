import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { env } from '../config/env';

const JWT_SECRET = env.JWT_SECRET || 'your_super_secret_jwt_key_here';
const BREVO_API_KEY = env.BREVO_API_KEY || '';

const otpStore: Record<string, string> = {}; // In-memory store for OTPs (phone -> otp)

export class AuthController {
  
  // 1. Check Mobile (To determine if user exists and show pharmacy name)
  static async checkMobile(req: Request, res: Response) {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
      }

      // Check user
      const userQuery = `SELECT id, name FROM users WHERE phone = $1`;
      const userResult = await pool.query(userQuery, [phone]);

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        
        // Get their pharmacy
        const pharmacyQuery = `SELECT id, name, address, phone FROM pharmacies WHERE owner_id = $1 LIMIT 1`;
        const pharmacyResult = await pool.query(pharmacyQuery, [user.id]);
        
        const pharmacyName = pharmacyResult.rows.length > 0 ? pharmacyResult.rows[0].name : 'Unknown Pharmacy';
        
        return res.json({
          success: true,
          exists: true,
          pharmacyName: pharmacyName,
          userName: user.name
        });
      }

      // User does not exist, send OTP for registration
      const { email } = req.body;
        if (!email) {
          return res.status(400).json({ success: false, message: 'Email address is required for new registration' });
        }

        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[phone] = generatedOtp;

        // Auto-expire OTP after 60 seconds
        setTimeout(() => {
          if (otpStore[phone] === generatedOtp) {
            delete otpStore[phone];
          }
        }, 60000);

        try {
          const https = require('https');
          const data = JSON.stringify({
            sender: { name: 'DavaSetu', email: 'davasetu.otp@gmail.com' },
            to: [{ email: email }],
            subject: 'Your DavaSetu Verification Code',
            htmlContent: `<div style="font-family: sans-serif; text-align: center; padding: 20px;">
              <h1 style="color: #059669;">DavaSetu</h1>
              <h2>Your Verification Code</h2>
              <p>Please use the following 6-digit code to verify your account.</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; margin: 20px 0;">${generatedOtp}</div>
              <p>If you did not request this code, please ignore this email.</p>
            </div>`
          });

          const options = {
            hostname: 'api.brevo.com',
            port: 443,
            path: '/v3/smtp/email',
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': BREVO_API_KEY,
              'content-type': 'application/json',
              'Content-Length': data.length
            }
          };

          await new Promise((resolve, reject) => {
            const req = https.request(options, (res: any) => {
              let resData = '';
              res.on('data', (chunk: any) => resData += chunk);
              res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  resolve(resData);
                } else {
                  console.error('Brevo API Error:', resData);
                  reject(new Error(`Brevo API returned status ${res.statusCode}`));
                }
              });
            });
            req.on('error', (e: any) => reject(e));
            req.write(data);
            req.end();
          });
        } catch (emailError) {
          console.error('Error calling Brevo API:', emailError);
          return res.status(500).json({ success: false, message: 'Internal error sending OTP' });
        }

        return res.json({
          success: true,
          exists: false
        });
    } catch (error) {
      console.error('Check mobile error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // 1.5 Verify OTP
  static async verifyOtp(req: Request, res: Response) {
    try {
      const { phone, otp } = req.body;
      if (!phone || !otp) {
        return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
      }

      if (!otpStore[phone] && otp !== '123456') {
        return res.status(400).json({ success: false, message: 'OTP Expired. Please click Resend OTP.' });
      }

      if (otpStore[phone] === otp || otp === '123456') { // Kept 123456 as master password for easy dev
        delete otpStore[phone];
        return res.json({ success: true, message: 'OTP verified successfully' });
      } else {
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // 2. Login
  static async login(req: Request, res: Response) {
    try {
      const { phone, password } = req.body;
      
      if (!phone || !password) {
        return res.status(400).json({ success: false, message: 'Phone and password are required' });
      }

      // Check users (OWNER)
      const userQuery = `SELECT id, name, phone, password_hash FROM users WHERE phone = $1`;
      const userResult = await pool.query(userQuery, [phone]);

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Get their pharmacy
        const pharmacyQuery = `SELECT * FROM pharmacies WHERE owner_id = $1 LIMIT 1`;
        const pharmacyResult = await pool.query(pharmacyQuery, [user.id]);
        
        const pharmacy = pharmacyResult.rows.length > 0 ? pharmacyResult.rows[0] : null;
        if (pharmacy) {
          const requestedBusinessType = req.body.businessType;
          if (requestedBusinessType && pharmacy.business_type !== requestedBusinessType) {
             return res.status(403).json({ success: false, message: `Access Denied: This account is registered as ${pharmacy.business_type === 'WHOLESALE' ? 'a Wholesale Distributor' : 'a Retail Pharmacy'}. Please select the correct login option.` });
          }
          pharmacy.ownerName = user.name;
        }

        // Create Token
        const token = jwt.sign(
          { userId: user.id, phone: user.phone, pharmacyId: pharmacy?.id, role: 'OWNER' },
          JWT_SECRET,
          { expiresIn: '30d' }
        );

        return res.json({
          success: true,
          token,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: 'OWNER'
          },
          pharmacy: pharmacy
        });
      }

      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // 3. Register (with simulated OTP verified)
  static async register(req: Request, res: Response) {
    try {
      const { phone, password, ownerName, pharmacyName, address, email, businessType } = req.body;

      if (!phone || !password || !ownerName || !pharmacyName || !address) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }

      // Check if user already exists
      const checkUser = await pool.query(`SELECT id FROM users WHERE phone = $1`, [phone]);
      if (checkUser.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Start transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Create User
        const insertUserQuery = `
          INSERT INTO users (name, phone, password_hash, email) 
          VALUES ($1, $2, $3, $4) RETURNING id, name, phone, email
        `;
        const userResult = await client.query(insertUserQuery, [ownerName, phone, hashedPassword, email || null]);
        const user = userResult.rows[0];

        // Create Pharmacy
        const insertPharmacyQuery = `
          INSERT INTO pharmacies (owner_id, name, address, phone, business_type) 
          VALUES ($1, $2, $3, $4, $5) RETURNING *
        `;
        const pharmacyResult = await client.query(insertPharmacyQuery, [user.id, pharmacyName, address, phone, businessType || 'RETAIL']);
        const pharmacy = pharmacyResult.rows[0];
        pharmacy.ownerName = user.name;

        await client.query('COMMIT');

        // Create Token
        const token = jwt.sign(
          { userId: user.id, phone: user.phone, pharmacyId: pharmacy.id, role: 'OWNER' },
          JWT_SECRET,
          { expiresIn: '30d' }
        );

        res.json({
          success: true,
          token,
          user: user,
          pharmacy: pharmacy
        });

      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
