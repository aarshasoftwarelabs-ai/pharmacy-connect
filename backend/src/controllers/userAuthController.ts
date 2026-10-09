import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { env } from '../config/env';

const JWT_SECRET = env.JWT_SECRET as string;
const BREVO_API_KEY = env.BREVO_API_KEY || '';

// In-memory store for OTPs (identifier -> otp)
// Identifier can be email or phone
const userOtpStore: Record<string, string> = {};

export class UserAuthController {
  
  // 1. Send OTP (For both Signup and Login)
  static async sendOtp(req: Request, res: Response) {
    try {
      let { email, phone } = req.body;
      
      if (email) email = email.trim().toLowerCase();
      if (phone) phone = phone.trim();
      
      if (!email && !phone) {
        return res.status(400).json({ success: false, message: 'Please provide Email or Phone number' });
      }

      let targetEmail = email;

      // If only phone is provided (Login flow without email), find the user's email
      if (!email && phone) {
        const userQuery = `SELECT email FROM users WHERE phone = $1`;
        const userResult = await pool.query(userQuery, [phone]);
        
        if (userResult.rows.length === 0) {
           return res.status(404).json({ success: false, message: 'User not found. Please create an account.' });
        }
        
        targetEmail = userResult.rows[0].email;
        if (!targetEmail) {
           return res.status(400).json({ success: false, message: 'No email associated with this phone number.' });
        }
      }

      // If only email is provided (Login flow without phone), check if user exists
      if (email && !phone) {
        const userQuery = `SELECT id FROM users WHERE email = $1`;
        const userResult = await pool.query(userQuery, [email]);
        
        if (userResult.rows.length === 0) {
           return res.status(404).json({ success: false, message: 'User not found. Please create an account.' });
        }
      }

      const identifier = email || phone;
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      userOtpStore[identifier] = generatedOtp;

      // Auto-expire OTP after 5 minutes
      setTimeout(() => {
        if (userOtpStore[identifier] === generatedOtp) {
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
        const data = JSON.stringify({
          sender: { name: 'DavaSetu App', email: 'davasetu.otp@gmail.com' },
          to: [{ email: targetEmail }],
          subject: 'Your DavaSetu App Login Code',
          htmlContent: `<div style="font-family: sans-serif; text-align: center; padding: 20px;">
            <h1 style="color: #059669;">DavaSetu</h1>
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

      return res.json({ success: true, message: 'OTP sent successfully to your email!' });

    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // 2. Verify OTP & Login/Signup
  static async verifyOtp(req: Request, res: Response) {
    try {
      // name is provided during signup
      let { email, phone, otp, name } = req.body;
      
      if (email) email = email.trim().toLowerCase();
      if (phone) phone = phone.trim();
      
      if ((!email && !phone) || !otp) {
        return res.status(400).json({ success: false, message: 'Identifier (Email/Phone) and OTP are required' });
      }

      const identifier = email || phone;

      if (!userOtpStore[identifier] && otp !== '123456') { // 123456 is master OTP for testing
        return res.status(400).json({ success: false, message: 'OTP Expired. Please resend.' });
      }

      if (userOtpStore[identifier] !== otp && otp !== '123456') {
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }

      // OTP is valid!
      delete userOtpStore[identifier];

      // Check if user exists
      let userQuery = `SELECT id, name, phone, email FROM users WHERE phone = $1`;
      let userParams = [phone];
      
      // If logging in via email, search by email
      if (email && !phone) {
         userQuery = `SELECT id, name, phone, email FROM users WHERE email = $1`;
         userParams = [email];
      }

      const userResult = await pool.query(userQuery, userParams);
      let user;

      if (userResult.rows.length > 0) {
        // User exists -> Login
        user = userResult.rows[0];
        
        let shouldUpdate = false;
        let updateFields = [];
        let updateValues = [];
        let paramIndex = 1;

        if (name && name.trim() !== '' && user.name !== name) {
           updateFields.push(`name = $${paramIndex}`);
           updateValues.push(name);
           paramIndex++;
           shouldUpdate = true;
        }

        if (email && email.trim() !== '' && user.email !== email) {
           updateFields.push(`email = $${paramIndex}`);
           updateValues.push(email);
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
        if (!name || !phone || !email) {
            return res.status(400).json({ success: false, message: 'Full Name, Phone and Email are required for registration.' });
        }
        
        // Insert new user
        const insertUserQuery = `
          INSERT INTO users (name, phone, email) 
          VALUES ($1, $2, $3) RETURNING id, name, phone, email
        `;
        const newUserResult = await pool.query(insertUserQuery, [name, phone, email]);
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
