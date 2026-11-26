import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { env } from '../config/env';

const JWT_SECRET = env.JWT_SECRET as string;
const BREVO_API_KEY = env.BREVO_API_KEY || '';
const MAX_OTP_ATTEMPTS = 5;

interface UserOtpEntry {
  otp: string;
  targetEmail: string;
  phone?: string;
  attempts: number;
  expiresAt: number;
}

// In-memory store for OTPs (identifier -> metadata)
const userOtpStore: Record<string, UserOtpEntry> = {};

export class UserAuthController {
  
  // 1. Send OTP (For both Signup and Login)
  static async sendOtp(req: Request, res: Response) {
    try {
      const rawEmail = req.body?.email;
      const rawPhone = req.body?.phone;
      const email = typeof rawEmail === 'string' && rawEmail.trim() ? rawEmail.trim().toLowerCase() : '';
      const phone = typeof rawPhone === 'string' && rawPhone.trim() ? rawPhone.trim() : '';
      
      if (!email && !phone) {
        return res.status(400).json({ success: false, message: 'Please provide Email or Phone number' });
      }

      let targetEmail = email;

      if (phone) {
        const userResult = await pool.query(`SELECT email FROM users WHERE phone = $1 LIMIT 1`, [phone]);
        if (userResult.rows.length > 0) {
          const registeredEmail = typeof userResult.rows[0].email === 'string'
            ? userResult.rows[0].email.trim().toLowerCase()
            : '';
          if (email && registeredEmail && registeredEmail !== email) {
            return res.status(400).json({
              success: false,
              message: 'Entered email does not match registered account email.'
            });
          }
          if (!targetEmail) {
            targetEmail = registeredEmail;
          }
        } else if (!email) {
          return res.status(404).json({ success: false, message: 'User not found. Please create an account.' });
        }
        if (!targetEmail) {
          return res.status(400).json({ success: false, message: 'No email associated with this phone number.' });
        }
      } else if (email) {
        const userResult = await pool.query(`SELECT id FROM users WHERE LOWER(TRIM(email)) = $1 LIMIT 1`, [email]);
        if (userResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'User not found. Please create an account.' });
        }
      }

      const identifier = phone || email;
      const generatedOtp = String(crypto.randomInt(100000, 1000000));
      
      userOtpStore[identifier] = {
        otp: generatedOtp,
        targetEmail,
        phone: phone || undefined,
        attempts: 0,
        expiresAt: Date.now() + 5 * 60000,
      };

      // Auto-expire OTP after 5 minutes
      setTimeout(() => {
        if (userOtpStore[identifier]?.otp === generatedOtp) {
          delete userOtpStore[identifier];
        }
      }, 5 * 60000);

      // Send via Brevo API using native https to avoid fetch version issues
      if (!BREVO_API_KEY) {
        console.log(`\n========================================`);
        console.log(`[DEV MODE] OTP for ${identifier} is: ${generatedOtp}`);
        console.log(`========================================\n`);
        return res.json({ success: true, message: 'OTP logged to terminal (Development Mode)!' });
      }

      try {
        const https = require('https');
        const senderEmail = process.env.SENDER_EMAIL || 'davasetu.otp@gmail.com'; 
        const data = JSON.stringify({
          sender: { name: 'PharmacyConnect App', email: senderEmail },
          to: [{ email: targetEmail }],
          subject: 'Your PharmacyConnect App Login Code',
          htmlContent: `<div style="font-family: sans-serif; text-align: center; padding: 20px;">
            <h1 style="color: #059669;">PharmacyConnect</h1>
            <h2>Your Verification Code</h2>
            <p>Please use the following 6-digit code to access your account.</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; margin: 20px 0;">${generatedOtp}</div>
            <p>This code will expire in 5 minutes.</p>
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
            'Content-Length': Buffer.byteLength(data)
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
      } catch (emailError: any) {
        console.error('Error calling Brevo API:', emailError.message || emailError);
        return res.status(503).json({ 
          success: false, 
          message: 'Unable to deliver verification email right now. Please try again shortly.' 
        });
      }

      return res.json({ success: true, message: 'OTP sent successfully to your email!' });

    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // 2. Verify OTP & Login/Signup
  static async verifyOtp(req: Request, res: Response) {
    try {
      const rawEmail = req.body?.email;
      const rawPhone = req.body?.phone;
      const rawOtp = req.body?.otp;
      const rawName = req.body?.name;

      const email = typeof rawEmail === 'string' && rawEmail.trim() ? rawEmail.trim().toLowerCase() : '';
      const phone = typeof rawPhone === 'string' && rawPhone.trim() ? rawPhone.trim() : '';
      const otp = typeof rawOtp === 'string' ? rawOtp.trim() : String(rawOtp || '').trim();
      const name = typeof rawName === 'string' ? rawName.trim() : '';
      
      if ((!email && !phone) || !otp) {
        return res.status(400).json({ success: false, message: 'Identifier (Email/Phone) and OTP are required' });
      }

      const identifier = (phone && userOtpStore[phone]) ? phone : email;
      const record = userOtpStore[identifier];

      if (!record || Date.now() > record.expiresAt) {
        delete userOtpStore[identifier];
        return res.status(400).json({ success: false, message: 'OTP Expired. Please resend.' });
      }

      if (record.attempts >= MAX_OTP_ATTEMPTS) {
        delete userOtpStore[identifier];
        return res.status(429).json({ success: false, message: 'Too many invalid attempts. Please request a new OTP.' });
      }

      if (record.otp !== otp) {
        record.attempts += 1;
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }

      // OTP is valid! Use the verified identity stored when the OTP was issued
      delete userOtpStore[identifier];
      const verifiedPhone = record.phone || phone;
      const verifiedEmail = record.targetEmail || email;

      let userQuery = `SELECT id, name, phone, email FROM users WHERE phone = $1`;
      let userParams = [verifiedPhone];
      
      if (!verifiedPhone && verifiedEmail) {
         userQuery = `SELECT id, name, phone, email FROM users WHERE LOWER(TRIM(email)) = $1`;
         userParams = [verifiedEmail];
      }

      const userResult = await pool.query(userQuery, userParams);
      let user;

      if (userResult.rows.length > 0) {
        user = userResult.rows[0];

        // If user already has a different email, reject mismatched email updates
        if (user.email && verifiedEmail && user.email.trim().toLowerCase() !== verifiedEmail) {
          return res.status(403).json({ success: false, message: 'Verified email does not match registered account.' });
        }
        
        let shouldUpdate = false;
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramIndex = 1;

        if (name && user.name !== name) {
           updateFields.push(`name = $${paramIndex}`);
           updateValues.push(name);
           paramIndex++;
           shouldUpdate = true;
        }

        if (!user.email && verifiedEmail) {
           updateFields.push(`email = $${paramIndex}`);
           updateValues.push(verifiedEmail);
           paramIndex++;
           shouldUpdate = true;
        }

        if (shouldUpdate) {
           updateValues.push(user.id);
           const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, phone, email`;
           const updateResult = await pool.query(updateQuery, updateValues);
           user = updateResult.rows[0];
        }
      } else {
        // User does not exist -> Signup
        if (!name || !verifiedPhone || !verifiedEmail) {
            return res.status(400).json({ success: false, message: 'Full Name, Phone and Email are required for registration.' });
        }
        
        // Insert new user
        const insertUserQuery = `
          INSERT INTO users (name, phone, email) 
          VALUES ($1, $2, $3) RETURNING id, name, phone, email
        `;
        const newUserResult = await pool.query(insertUserQuery, [name, verifiedPhone, verifiedEmail]);
        user = newUserResult.rows[0];
      }

      // Create Token for User App
      const token = jwt.sign(
        { userId: user.id, phone: user.phone, role: 'USER' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        success: true,
        message: 'Verified successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: 'USER'
        }
      });

    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
