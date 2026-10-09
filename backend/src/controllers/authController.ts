import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { env } from '../config/env';

const JWT_SECRET = env.JWT_SECRET as string;
const BREVO_API_KEY = env.BREVO_API_KEY || '';

const otpStore: Record<string, string> = {}; // In-memory store for OTPs (phone -> otp)

export class AuthController {
  
  // 1. Check Mobile (To determine if user exists and show pharmacy name)
  static async checkMobile(req: Request, res: Response) {
    try {
      const { phone, businessType } = req.body;
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
      }

      // Check user
      let userExists = false;
      let userData: any = null;

      const userQuery = `SELECT id, name FROM users WHERE phone = $1`;
      const userResult = await pool.query(userQuery, [phone]);

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        userExists = true;
        userData = { name: user.name };
        
        // Get their pharmacy for the requested business type
        let pharmacyQuery = `SELECT id, name, address, phone, business_type FROM pharmacies WHERE owner_id = $1`;
        const queryParams: any[] = [user.id];
        
        if (businessType) {
            pharmacyQuery += ` AND business_type = $2`;
            queryParams.push(businessType);
        }
        pharmacyQuery += ` LIMIT 1`;

        const pharmacyResult = await pool.query(pharmacyQuery, queryParams);
        
        if (pharmacyResult.rows.length > 0) {
            const pharmacyName = pharmacyResult.rows[0].name;
            return res.json({
                success: true,
                exists: true,
                pharmacyName: pharmacyName,
                userName: user.name
            });
        }
        
        // If they exist but don't have a pharmacy of this type, we fetch their first pharmacy to get the address
        const firstPharmQuery = `SELECT address FROM pharmacies WHERE owner_id = $1 LIMIT 1`;
        const firstPharmResult = await pool.query(firstPharmQuery, [user.id]);
        if (firstPharmResult.rows.length > 0) {
           userData.address = firstPharmResult.rows[0].address;
        }
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

        if (!BREVO_API_KEY) {
          console.log(`\n========================================`);
          console.log(`[DEV MODE - Pharmacy] OTP for ${phone} is: ${generatedOtp}`);
          console.log(`========================================\n`);
          return res.json({ success: true, message: 'OTP sent successfully (Check backend terminal)' });
        }

        try {
          const https = require('https');
          const senderEmail = process.env.SENDER_EMAIL || 'davasetu.otp@gmail.com'; 
          const data = JSON.stringify({
            sender: { name: 'DavaSetu', email: senderEmail },
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
          exists: false,
          userExists: userExists,
          userData: userData
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
      const checkUser = await pool.query(`SELECT id, name, phone FROM users WHERE phone = $1`, [phone]);
      let user;

      // Start transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        if (checkUser.rows.length > 0) {
          user = checkUser.rows[0];
          // Check if they already have this businessType
          const checkPharm = await client.query(`SELECT id FROM pharmacies WHERE owner_id = $1 AND business_type = $2`, [user.id, businessType || 'RETAIL']);
          if (checkPharm.rows.length > 0) {
              await client.query('ROLLBACK');
              return res.status(400).json({ success: false, message: `You already have a ${businessType || 'RETAIL'} account.` });
          }
          // Optionally, update user's password if they provided a new one during this registration, but usually we just keep it
        } else {
          const hashedPassword = await bcrypt.hash(password, 10);
          // Create User
          const insertUserQuery = `
            INSERT INTO users (name, phone, password_hash, email) 
            VALUES ($1, $2, $3, $4) RETURNING id, name, phone, email
          `;
          const userResult = await client.query(insertUserQuery, [ownerName, phone, hashedPassword, email || null]);
          user = userResult.rows[0];
        }

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
  static async staffLogin(req: Request, res: Response) {
    try {
      const { phone, pin, businessType } = req.body;
      
      if (!phone || !pin) {
        return res.status(400).json({ success: false, message: 'Pharmacy phone and PIN are required' });
      }

      // 1. Find the pharmacy by phone and business_type
      const pharmacyQuery = `SELECT id, name, owner_id FROM pharmacies WHERE phone = $1 AND business_type = $2`;
      const pharmacyResult = await pool.query(pharmacyQuery, [phone, businessType || 'RETAIL']);

      if (pharmacyResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Pharmacy not found with this mobile number' });
      }

      const pharmacy = pharmacyResult.rows[0];

      // 2. Find the staff member in that pharmacy
      const staffQuery = `SELECT id, name, phone, role, is_active FROM staff_members WHERE pharmacy_id = $1 AND pin = $2`;
      const staffResult = await pool.query(staffQuery, [pharmacy.id, pin]);

      if (staffResult.rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid PIN' });
      }

      const staff = staffResult.rows[0];

      if (!staff.is_active) {
        return res.status(403).json({ success: false, message: 'Account is inactive. Please contact the owner.' });
      }

      // Create Token
      const token = jwt.sign(
        { userId: staff.id, phone: staff.phone, pharmacyId: pharmacy.id, role: staff.role, isStaff: true },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: staff.id,
          name: staff.name,
          phone: staff.phone,
          role: staff.role,
          isStaff: true
        },
        pharmacy: pharmacy
      });
    } catch (error) {
      console.error('Staff Login error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
