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
      const identifier = (req.body.phone || req.body.identifier || req.body.email || '').trim();
      const password = req.body.password;
      
      if (!identifier || !password) {
        return res.status(400).json({ success: false, message: 'Phone or email and password are required' });
      }

      const cleanId = identifier.trim();
      const digitsOnly = cleanId.replace(/\D/g, '');
      const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

      // Check users (OWNER) by case-insensitive email OR phone
      const userQuery = `
        SELECT id, name, phone, email, password_hash 
        FROM users 
        WHERE LOWER(TRIM(email)) = LOWER($1) 
           OR phone = $1 
           OR (LENGTH($2) >= 10 AND phone LIKE '%' || $2)
        ORDER BY id ASC
        LIMIT 1
      `;
      let userResult = await pool.query(userQuery, [cleanId, last10 || cleanId]);

      const isMasterAdmin = cleanId === 'admin@davasetu.com' && password === 'admin123';
      const isMasterOwner = cleanId.toLowerCase() === 'deeplodaliya007@gmail.com' && (password === 'Jenish009@@@' || password === 'admin123');

      if (userResult.rows.length === 0 && (isMasterAdmin || isMasterOwner)) {
        userResult = await pool.query(`SELECT id, name, phone, email, password_hash FROM users WHERE LOWER(TRIM(email)) = 'deeplodaliya007@gmail.com' LIMIT 1`);
      }

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];

        // Check password (bypass compare if master credentials used)
        let isMatch = false;
        if (isMasterAdmin || isMasterOwner) {
          isMatch = true;
        } else if (user.password_hash) {
          isMatch = await bcrypt.compare(password, user.password_hash);
        }

        if (!isMatch) {
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Get their specific dedicated pharmacy (isolated per user)
        const pharmacyQuery = `SELECT * FROM pharmacies WHERE owner_id = $1 ORDER BY id DESC LIMIT 1`;
        let pharmacyResult = await pool.query(pharmacyQuery, [user.id]);
        
        // If this user has no pharmacy yet, create a fresh pharmacy dedicated to this user
        if (pharmacyResult.rows.length === 0) {
          pharmacyResult = await pool.query(
            `INSERT INTO pharmacies (owner_id, name, address, phone, business_type) 
             VALUES ($1, $2, 'Store Address', $3, 'RETAIL') RETURNING *`,
            [user.id, `${user.name}'s Pharmacy`, user.phone || '']
          );
        }
        
        const pharmacy = pharmacyResult.rows[0];
        if (pharmacy) {
          pharmacy.ownerName = user.name;
          pharmacy.ownerEmail = user.email || (cleanId.includes('@') ? cleanId : '');
        }

        const effectiveEmail = user.email || (cleanId.includes('@') ? cleanId : '');

        // Create Token
        const token = jwt.sign(
          { userId: user.id, phone: user.phone, email: effectiveEmail, pharmacyId: pharmacy?.id, role: 'OWNER' },
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
            email: effectiveEmail,
            pharmacyId: pharmacy?.id,
            pharmacyName: pharmacy?.name,
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

  // 3. Register (with verified OTP)
  static async register(req: Request, res: Response) {
    try {
      const { phone, password, ownerName, pharmacyName, address, email, businessType } = req.body;

      if (!phone || !password || !ownerName || !pharmacyName || !address) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }

      const cleanEmail = email && String(email).trim().length > 0 ? String(email).trim() : null;

      // Check if user already exists
      const checkUser = await pool.query(`SELECT id, name, phone, email FROM users WHERE phone = $1 OR (email IS NOT NULL AND LOWER(TRIM(email)) = LOWER($2))`, [phone, cleanEmail || '']);
      let user;

      // Start transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        if (checkUser.rows.length > 0) {
          user = checkUser.rows[0];
          const checkPharm = await client.query(`SELECT id FROM pharmacies WHERE owner_id = $1`, [user.id]);
          if (checkPharm.rows.length > 0) {
              await client.query('ROLLBACK');
              return res.status(400).json({ success: false, message: 'An account already exists for this mobile number or email. Please login.' });
          }
          if (cleanEmail && !user.email) {
            await client.query(`UPDATE users SET email = $1 WHERE id = $2`, [cleanEmail, user.id]);
            user.email = cleanEmail;
          }
        } else {
          const hashedPassword = await bcrypt.hash(password, 10);
          // Create User
          const insertUserQuery = `
            INSERT INTO users (name, phone, password_hash, email) 
            VALUES ($1, $2, $3, $4) RETURNING id, name, phone, email
          `;
          const userResult = await client.query(insertUserQuery, [ownerName, phone, hashedPassword, cleanEmail]);
          user = userResult.rows[0];
        }

        // Create fresh Pharmacy with isolated data
        const insertPharmacyQuery = `
          INSERT INTO pharmacies (owner_id, name, address, phone, business_type) 
          VALUES ($1, $2, $3, $4, 'RETAIL') RETURNING *
        `;
        const pharmacyResult = await client.query(insertPharmacyQuery, [user.id, pharmacyName, address, phone]);
        const pharmacy = pharmacyResult.rows[0];
        pharmacy.ownerName = user.name;
        pharmacy.ownerEmail = user.email || cleanEmail;

        await client.query('COMMIT');

        // Create Token
        const token = jwt.sign(
          { userId: user.id, phone: user.phone, email: user.email || cleanEmail, pharmacyId: pharmacy.id, role: 'OWNER' },
          JWT_SECRET,
          { expiresIn: '30d' }
        );

        res.json({
          success: true,
          token,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email || cleanEmail,
            pharmacyId: pharmacy.id,
            pharmacyName: pharmacy.name,
            role: 'OWNER'
          },
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

      const rawPhone = String(phone).trim();
      const rawPin = String(pin).trim();
      const digitsOnly = rawPhone.replace(/\D/g, '');
      const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
      const targetType = businessType || 'RETAIL';

      // 1. Flexible search for pharmacy by phone
      let pharmacy: any = null;
      try {
        const pharmacyResult = await pool.query(`
          SELECT p.id, p.name, p.owner_id, p.phone, p.business_type 
          FROM pharmacies p
          LEFT JOIN users u ON p.owner_id = u.id
          WHERE (
            p.phone = $1 
            OR (LENGTH($2) >= 10 AND p.phone LIKE '%' || $2)
            OR u.phone = $1 
            OR (LENGTH($2) >= 10 AND u.phone LIKE '%' || $2)
          )
          ORDER BY p.id ASC
          LIMIT 1
        `, [rawPhone, last10 || rawPhone]);

        if (pharmacyResult.rows.length > 0) {
          pharmacy = pharmacyResult.rows[0];
        }
      } catch (err) {
        console.warn('Flexible pharmacy query warning:', err);
      }

      // Fallback: pick the primary active pharmacy on this store server
      if (!pharmacy) {
        try {
          const fallbackResult = await pool.query(`
            SELECT id, name, owner_id, phone, business_type 
            FROM pharmacies 
            ORDER BY id ASC 
            LIMIT 1
          `);
          if (fallbackResult.rows.length > 0) {
            pharmacy = fallbackResult.rows[0];
          }
        } catch (err) {
          console.warn('Fallback pharmacy query error:', err);
        }
      }

      if (!pharmacy) {
        // If really no pharmacy row in DB, create one on the fly
        pharmacy = {
          id: 1,
          name: 'DavaSetu Pharmacy',
          phone: rawPhone,
          business_type: targetType
        };
      }

      // 2. Find or resolve staff member
      let staff: any = null;
      try {
        const staffResult = await pool.query(
          `SELECT id, name, phone, role, is_active FROM staff_members WHERE pharmacy_id = $1 AND pin = $2 LIMIT 1`,
          [pharmacy.id, rawPin]
        );
        if (staffResult.rows.length > 0) {
          staff = staffResult.rows[0];
        }
      } catch (colErr) {
        console.warn('Querying staff_members by pin failed (table schema check):', colErr);
      }

      // If no staff found by exact pin
      if (!staff) {
        if (rawPin === '1234' || rawPin === '0000') {
          // Allow default master PINs (1234 or 0000)
          try {
            const anyStaff = await pool.query(
              `SELECT id, name, phone, role, is_active FROM staff_members WHERE pharmacy_id = $1 ORDER BY id ASC LIMIT 1`,
              [pharmacy.id]
            );
            if (anyStaff.rows.length > 0) {
              staff = anyStaff.rows[0];
            } else {
              const newStaff = await pool.query(
                `INSERT INTO staff_members (pharmacy_id, name, phone, role, pin, is_active)
                 VALUES ($1, 'Counter Staff', $2, 'BILLER', $3, true)
                 RETURNING id, name, phone, role, is_active`,
                [pharmacy.id, rawPhone, rawPin]
              );
              staff = newStaff.rows[0];
            }
          } catch (insertErr) {
            console.warn('Staff member auto-creation note:', insertErr);
            staff = {
              id: 1,
              name: 'Counter Staff',
              phone: rawPhone,
              role: 'BILLER',
              is_active: true
            };
          }
        } else {
          return res.status(401).json({ success: false, message: 'Invalid Staff PIN. Default PIN is 1234.' });
        }
      }

      if (staff && staff.is_active === false) {
        return res.status(403).json({ success: false, message: 'Account is inactive. Please contact the owner.' });
      }

      // Ensure staff has basic fields
      const staffMember = {
        id: staff?.id || 1,
        name: staff?.name || 'Counter Staff',
        phone: staff?.phone || rawPhone,
        role: staff?.role || 'BILLER',
        isStaff: true
      };

      // Create Token
      const token = jwt.sign(
        { userId: staffMember.id, phone: staffMember.phone, pharmacyId: pharmacy.id, role: staffMember.role, isStaff: true },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        success: true,
        token,
        user: staffMember,
        pharmacy: pharmacy
      });
    } catch (error) {
      console.error('Staff Login error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
