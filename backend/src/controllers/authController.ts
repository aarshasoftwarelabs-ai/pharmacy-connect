import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { env } from '../config/env';

const JWT_SECRET = env.JWT_SECRET as string;
const BREVO_API_KEY = env.BREVO_API_KEY || '';
const OTP_TTL_SECONDS = 300; // 5 minutes validity in PostgreSQL
const MAX_OTP_ATTEMPTS = 5;

const otpFallbackStore: Record<string, { otp: string; expiresAt: number; attempts: number }> = {};
const verifiedSignupStore: Record<string, number> = {};
let otpTableEnsured = false;

function normalizePhone10(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : String(raw || '').trim();
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

async function ensureOtpTable(): Promise<void> {
  if (otpTableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auth_otps (
        phone VARCHAR(20) PRIMARY KEY,
        email VARCHAR(255),
        otp_code VARCHAR(12) NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    otpTableEnsured = true;
  } catch (err) {
    console.warn('[Auth] auth_otps table ensure note:', err);
  }
}

async function saveOtpRecord(phone: string, email: string, otp: string): Promise<void> {
  const expiresAtMs = Date.now() + OTP_TTL_SECONDS * 1000;
  otpFallbackStore[phone] = { otp, expiresAt: expiresAtMs, attempts: 0 };
  try {
    await ensureOtpTable();
    await pool.query(
      `INSERT INTO auth_otps (phone, email, otp_code, attempts, expires_at, created_at)
       VALUES ($1, $2, $3, 0, NOW() + ($4 || ' seconds')::interval, CURRENT_TIMESTAMP)
       ON CONFLICT (phone) DO UPDATE
       SET email = EXCLUDED.email,
           otp_code = EXCLUDED.otp_code,
           attempts = 0,
           expires_at = EXCLUDED.expires_at,
           created_at = CURRENT_TIMESTAMP`,
      [phone, email, otp, String(OTP_TTL_SECONDS)]
    );
  } catch (err) {
    console.warn('[Auth] DB OTP persist note (using RAM fallback):', err);
  }
}

async function clearOtpRecord(phone: string): Promise<void> {
  delete otpFallbackStore[phone];
  delete verifiedSignupStore[phone];
  try {
    await ensureOtpTable();
    await pool.query('DELETE FROM auth_otps WHERE phone = $1', [phone]);
  } catch (_) {}
}

async function markSignupPhoneVerified(phone: string, email: string): Promise<void> {
  const ttlSeconds = 1800; // 30 minutes to complete registration form
  verifiedSignupStore[phone] = Date.now() + ttlSeconds * 1000;
  delete otpFallbackStore[phone];
  try {
    await ensureOtpTable();
    await pool.query(
      `INSERT INTO auth_otps (phone, email, otp_code, attempts, expires_at, created_at)
       VALUES ($1, $2, '__VERIFIED__', 0, NOW() + ($3 || ' seconds')::interval, CURRENT_TIMESTAMP)
       ON CONFLICT (phone) DO UPDATE
       SET email = COALESCE(NULLIF(EXCLUDED.email, ''), auth_otps.email),
           otp_code = '__VERIFIED__',
           attempts = 0,
           expires_at = EXCLUDED.expires_at,
           created_at = CURRENT_TIMESTAMP`,
      [phone, email || null, String(ttlSeconds)]
    );
  } catch (err) {
    console.warn('[Auth] DB verified signup mark note:', err);
  }
}

async function consumeVerifiedSignupPhone(phone: string): Promise<boolean> {
  if (verifiedSignupStore[phone] && verifiedSignupStore[phone] > Date.now()) {
    await clearOtpRecord(phone);
    return true;
  }
  try {
    await ensureOtpTable();
    const res = await pool.query(
      `SELECT phone FROM auth_otps
       WHERE phone = $1 AND otp_code = '__VERIFIED__' AND expires_at > NOW()
       LIMIT 1`,
      [phone]
    );
    if (res.rows.length > 0) {
      await clearOtpRecord(phone);
      return true;
    }
  } catch (err) {
    console.warn('[Auth] DB consume verified signup note:', err);
  }
  return false;
}

function isDemoBypassAllowed(phone10: string, otp: string): boolean {
  if (otp !== '123456') return false;
  const demoPhone = process.env.DEMO_REVIEW_PHONE ? normalizePhone10(process.env.DEMO_REVIEW_PHONE) : '';
  if (demoPhone && phone10 === demoPhone) return true;

  const hasDeliveryChannel = Boolean(
    BREVO_API_KEY ||
    env.FAST2SMS_API_KEY ||
    (env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN)
  );
  // In production with active OTP delivery, block master 123456 on real accounts
  if (env.NODE_ENV === 'production' && hasDeliveryChannel) {
    return false;
  }
  return true;
}

/**
 * Send OTP across available channels (Brevo Email + optional WhatsApp Cloud + optional Fast2SMS)
 * in the background with strict timeouts so login/signup responses stay instant.
 */
function dispatchOtpChannelsInBackground(phone10: string, email: string, generatedOtp: string): void {
  const https = require('https');

  // 1. Primary: Brevo Email OTP
  if (BREVO_API_KEY && email) {
    try {
      const senderEmail = process.env.SENDER_EMAIL || 'davasetu.otp@gmail.com';
      const data = JSON.stringify({
        sender: { name: 'DavaSetu Pharmacy', email: senderEmail },
        to: [{ email }],
        subject: 'Your DavaSetu Verification Code',
        htmlContent: `<div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h1 style="color: #059669;">DavaSetu Pharmacy</h1>
          <h2>Your Verification Code</h2>
          <p>Please use the following 6-digit code to verify your pharmacy account.</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; margin: 20px 0;">${generatedOtp}</div>
          <p>This code is valid for 5 minutes.</p>
          <p style="color: #64748b; font-size: 12px;">If you did not request this, please ignore this email.</p>
        </div>`
      });

      const req = https.request(
        {
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
        },
        (res: any) => {
          let resData = '';
          res.on('data', (chunk: any) => (resData += chunk));
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`[Brevo] OTP Email delivered to ${email}`);
            } else {
              console.error(`[Brevo API Error ${res.statusCode}]:`, resData);
            }
          });
        }
      );
      req.setTimeout(5000, () => req.destroy(new Error('Brevo OTP request timed out')));
      req.on('error', (e: any) => console.error('Error calling Brevo API:', e?.message || e));
      req.write(data);
      req.end();
    } catch (err: any) {
      console.error('Brevo dispatch note:', err?.message || err);
    }
  }

  // 2. Backup Channel: WhatsApp Cloud API (if configured in env)
  if (env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN && /^[6-9]\d{9}$/.test(phone10)) {
    try {
      const waPayload = JSON.stringify({
        messaging_product: 'whatsapp',
        to: `91${phone10}`,
        type: 'text',
        text: {
          preview_url: false,
          body: `Your DavaSetu verification code is *${generatedOtp}*. Valid for 5 minutes. Do not share this code with anyone.`
        }
      });

      const req = https.request(
        {
          hostname: 'graph.facebook.com',
          port: 443,
          path: `/v19.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(waPayload)
          }
        },
        (res: any) => {
          let resData = '';
          res.on('data', (chunk: any) => (resData += chunk));
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`[WhatsApp OTP] Delivered to +91${phone10}`);
            } else {
              console.warn(`[WhatsApp OTP ${res.statusCode}]:`, resData);
            }
          });
        }
      );
      req.setTimeout(5000, () => req.destroy(new Error('WhatsApp OTP request timed out')));
      req.on('error', (e: any) => console.warn('WhatsApp OTP error:', e?.message || e));
      req.write(waPayload);
      req.end();
    } catch (err: any) {
      console.warn('WhatsApp OTP dispatch note:', err?.message || err);
    }
  }

  // 3. Backup Channel: Fast2SMS OTP (if configured in env)
  if (env.FAST2SMS_API_KEY && /^[6-9]\d{9}$/.test(phone10)) {
    try {
      const smsPayload = JSON.stringify({
        route: 'otp',
        variables_values: generatedOtp,
        numbers: phone10
      });

      const req = https.request(
        {
          hostname: 'www.fast2sms.com',
          port: 443,
          path: '/dev/bulkV2',
          method: 'POST',
          headers: {
            'authorization': env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(smsPayload)
          }
        },
        (res: any) => {
          let resData = '';
          res.on('data', (chunk: any) => (resData += chunk));
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`[Fast2SMS OTP] Delivered to ${phone10}`);
            } else {
              console.warn(`[Fast2SMS OTP ${res.statusCode}]:`, resData);
            }
          });
        }
      );
      req.setTimeout(5000, () => req.destroy(new Error('Fast2SMS OTP request timed out')));
      req.on('error', (e: any) => console.warn('Fast2SMS OTP error:', e?.message || e));
      req.write(smsPayload);
      req.end();
    } catch (err: any) {
      console.warn('Fast2SMS OTP dispatch note:', err?.message || err);
    }
  }
}

export class AuthController {
  
  // 1. Check Mobile (To determine if user exists and show pharmacy name)
  static async checkMobile(req: Request, res: Response) {
    try {
      const { businessType } = req.body;
      const rawPhone = (req.body.phone || '').toString().trim();
      const phone = normalizePhone10(rawPhone);
      const email = (req.body.email || '').trim();

      if (!phone) {
        return res.status(400).json({ success: false, message: 'Please enter your mobile number' });
      }

      if (!email) {
        return res.status(400).json({ success: false, message: 'Please enter your email address' });
      }

      // Check user (exact match or last 10 digits)
      let userExists = false;
      let userData: any = null;

      const userQuery = `
        SELECT id, name, email FROM users
        WHERE phone = $1 OR (LENGTH($2) >= 10 AND phone LIKE '%' || $2)
        ORDER BY id ASC LIMIT 1
      `;
      const userResult = await pool.query(userQuery, [rawPhone, phone]);

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        userExists = true;
        userData = { name: user.name };
        
        // Get their pharmacy for the requested business type
        let pharmacyQuery = `SELECT id, name, address, phone, email, business_type FROM pharmacies WHERE owner_id = $1`;
        const queryParams: any[] = [user.id];
        
        if (businessType) {
            pharmacyQuery += ` AND business_type = $2`;
            queryParams.push(businessType);
        }
        pharmacyQuery += ` LIMIT 1`;

        const pharmacyResult = await pool.query(pharmacyQuery, queryParams);
        
        if (pharmacyResult.rows.length > 0) {
            const pharmRow = pharmacyResult.rows[0];
            const pharmacyName = pharmRow.name;
            const registeredEmail = String(user.email || pharmRow.email || '').trim();

            // Prevent OTP hijack: registered store owners must enter their registered email
            if (registeredEmail && registeredEmail.toLowerCase() !== email.toLowerCase()) {
              return res.status(400).json({
                success: false,
                message: `Entered email does not match registered store email (${maskEmail(registeredEmail)}).`
              });
            }

            const targetEmail = registeredEmail || email;
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            await saveOtpRecord(phone, targetEmail, generatedOtp);
            dispatchOtpChannelsInBackground(phone, targetEmail, generatedOtp);

            return res.json({
                success: true,
                exists: true,
                pharmacyName: pharmacyName,
                userName: user.name,
                message: 'OTP sent successfully'
            });
        }
        
        // If they exist but don't have a pharmacy of this type, verify email if already registered
        const userRegEmail = String(user.email || '').trim();
        if (userRegEmail && userRegEmail.toLowerCase() !== email.toLowerCase()) {
          return res.status(400).json({
            success: false,
            message: `Entered email does not match registered account email (${maskEmail(userRegEmail)}).`
          });
        }

        const firstPharmQuery = `SELECT address FROM pharmacies WHERE owner_id = $1 LIMIT 1`;
        const firstPharmResult = await pool.query(firstPharmQuery, [user.id]);
        if (firstPharmResult.rows.length > 0) {
           userData.address = firstPharmResult.rows[0].address;
        }
      }

      // User does not exist (new signup) -> persist OTP in PostgreSQL and dispatch in background
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await saveOtpRecord(phone, email, generatedOtp);
      dispatchOtpChannelsInBackground(phone, email, generatedOtp);

      return res.json({
        success: true,
        exists: false,
        userExists: userExists,
        userData: userData,
        message: 'OTP sent successfully'
      });
    } catch (error) {
      console.error('Check mobile error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // 1.5 Verify OTP
  static async verifyOtp(req: Request, res: Response) {
    try {
      const rawPhone = (req.body.phone || '').toString().trim();
      const phone = normalizePhone10(rawPhone);
      const otp = (req.body.otp || '').toString().trim();

      if (!phone || !otp) {
        return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
      }

      let isVerified = isDemoBypassAllowed(phone, otp);

      if (!isVerified) {
        let matchedRecord: { otp_code: string; attempts: number; expired: boolean } | null = null;
        let usedDb = false;

        try {
          await ensureOtpTable();
          const otpRes = await pool.query(
            `SELECT otp_code, attempts, (expires_at <= NOW()) AS expired
             FROM auth_otps
             WHERE phone = $1
             LIMIT 1`,
            [phone]
          );
          if (otpRes.rows.length > 0) {
            matchedRecord = otpRes.rows[0];
          }
          usedDb = true;
        } catch (dbErr) {
          console.warn('[Auth] DB OTP lookup note:', dbErr);
        }

        if (!matchedRecord && !usedDb && otpFallbackStore[phone]) {
          const ram = otpFallbackStore[phone];
          matchedRecord = {
            otp_code: ram.otp,
            attempts: ram.attempts,
            expired: Date.now() > ram.expiresAt
          };
        }

        if (!matchedRecord || matchedRecord.expired) {
          await clearOtpRecord(phone);
          return res.status(400).json({ success: false, message: 'OTP expired. Please click Resend OTP.' });
        }

        if (matchedRecord.attempts >= MAX_OTP_ATTEMPTS) {
          await clearOtpRecord(phone);
          return res.status(429).json({ success: false, message: 'Too many invalid attempts. Please request a new OTP.' });
        }

        if (matchedRecord.otp_code !== otp) {
          try {
            await pool.query('UPDATE auth_otps SET attempts = attempts + 1 WHERE phone = $1', [phone]);
          } catch (_) {}
          if (otpFallbackStore[phone]) {
            otpFallbackStore[phone].attempts += 1;
          }
          return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        isVerified = true;
      }

      if (isVerified) {
        await clearOtpRecord(phone);

        // Check if user already exists with an active pharmacy (exact or last-10 digits)
        const userQuery = `
          SELECT u.id, u.name, u.phone, u.email,
                 p.id as pharmacy_id, p.name as pharmacy_name, p.address as pharmacy_address,
                 p.phone as pharmacy_phone, p.email as pharmacy_email,
                 p.gstin as pharmacy_gstin, p.reg_no as pharmacy_reg_no,
                 p.gst_registered as pharmacy_gst_registered, p.state as pharmacy_state
          FROM users u
          LEFT JOIN pharmacies p ON p.owner_id = u.id
          WHERE u.phone = $1 OR (LENGTH($2) >= 10 AND u.phone LIKE '%' || $2)
          ORDER BY (p.id IS NOT NULL) DESC, p.id ASC
          LIMIT 1
        `;
        const userRes = await pool.query(userQuery, [rawPhone, phone]);

        if (userRes.rows.length > 0 && userRes.rows[0].pharmacy_id) {
          const u = userRes.rows[0];
          const token = jwt.sign(
            { userId: u.id, id: u.id, phone: u.phone, email: u.email, role: 'OWNER', pharmacyId: u.pharmacy_id },
            JWT_SECRET,
            { expiresIn: '30d' }
          );
          return res.json({
            success: true,
            exists: true,
            message: 'OTP verified successfully',
            token,
            user: {
              id: u.id,
              name: u.name,
              email: u.email,
              phone: u.phone,
              role: 'OWNER',
              pharmacyId: u.pharmacy_id,
              pharmacyName: u.pharmacy_name
            },
            pharmacy: {
              id: u.pharmacy_id,
              name: u.pharmacy_name,
              address: u.pharmacy_address,
              phone: u.pharmacy_phone,
              email: u.pharmacy_email,
              gstin: u.pharmacy_gstin,
              regNo: u.pharmacy_reg_no,
              reg_no: u.pharmacy_reg_no,
              gstRegistered: u.pharmacy_gst_registered,
              state: u.pharmacy_state,
            }
          });
        }

        await markSignupPhoneVerified(phone, String(req.body.email || '').trim());
        return res.json({ success: true, exists: false, message: 'OTP verified successfully' });
      }

      return res.status(400).json({ success: false, message: 'Invalid OTP' });
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

      // Check users (OWNER) by case-insensitive email, direct phone, or matching pharmacy records
      const userQuery = `
        SELECT u.id, u.name, u.phone, COALESCE(u.email, p.email) as email, u.password_hash,
               p.id as pharmacy_id, p.name as pharmacy_name
        FROM users u
        LEFT JOIN pharmacies p ON p.owner_id = u.id
        WHERE LOWER(TRIM(COALESCE(u.email, ''))) = LOWER($1) 
           OR LOWER(TRIM(COALESCE(p.email, ''))) = LOWER($1)
           OR u.phone = $1 
           OR p.phone = $1
           OR (LENGTH($2) >= 10 AND (u.phone LIKE '%' || $2 OR p.phone LIKE '%' || $2))
        ORDER BY p.id ASC NULLS LAST, u.id ASC
        LIMIT 1
      `;
      const userResult = await pool.query(userQuery, [cleanId, last10 || cleanId]);

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        let isMatch = false;

        if (user.password_hash) {
          // Strictly verify against stored bcrypt hash (no hardcoded backdoor passwords)
          try {
            isMatch = await bcrypt.compare(password, user.password_hash);
          } catch (e) {
            isMatch = false;
          }
        }

        if (!isMatch) {
          return res.status(401).json({ success: false, message: 'Invalid credentials or OTP login required' });
        }

        // Get their specific dedicated pharmacy (isolated per user)
        const pharmacyQuery = `
          SELECT * FROM pharmacies 
          WHERE owner_id = $1
          ORDER BY id ASC 
          LIMIT 1
        `;
        let pharmacyResult = await pool.query(pharmacyQuery, [user.id]);
        
        // If this user has no pharmacy yet, create a fresh isolated pharmacy for them
        if (pharmacyResult.rows.length === 0) {
          pharmacyResult = await pool.query(
            `INSERT INTO pharmacies (owner_id, name, address, phone, business_type) 
             VALUES ($1, $2, 'Store Address', $3, 'RETAIL') RETURNING *`,
            [user.id, `${user.name || 'My'}'s Pharmacy`, user.phone || '']
          );
        }
        
        const pharmacy = pharmacyResult.rows[0];
        const effectiveEmail = user.email || (cleanId.includes('@') ? cleanId : null);
        if (pharmacy) {
          pharmacy.ownerName = user.name || 'Pharmacy Owner';
          if (effectiveEmail) {
            pharmacy.ownerEmail = effectiveEmail;
          }
        }

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
            name: user.name || 'Pharmacy Owner',
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

  // 3. Register (with verified OTP - password optional for OTP-only flow)
  static async register(req: Request, res: Response) {
    try {
      const { phone, password, ownerName, pharmacyName, address, email } = req.body;

      if (!phone || !ownerName || !pharmacyName || !address) {
        return res.status(400).json({ success: false, message: 'Phone, owner name, pharmacy name, and address are required' });
      }

      const phone10 = normalizePhone10(String(phone));
      const otpVerified = await consumeVerifiedSignupPhone(phone10);
      if (!otpVerified) {
        return res.status(403).json({ success: false, message: 'Please verify your mobile number via OTP before registering your pharmacy.' });
      }

      const cleanEmail = email && String(email).trim().length > 0 ? String(email).trim() : null;

      // Check if user already exists (by phone or email)
      const checkUser = await pool.query(
        `SELECT id, name, phone, email FROM users WHERE phone = $1 OR (LENGTH($2) >= 10 AND phone LIKE '%' || $2) OR ($3::text IS NOT NULL AND LOWER(TRIM(email)) = LOWER($3))`,
        [phone, phone10, cleanEmail]
      );
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
          // Reject hijacking another existing account's email
          if (user.email && cleanEmail && user.email.trim().toLowerCase() !== cleanEmail.toLowerCase()) {
              await client.query('ROLLBACK');
              return res.status(400).json({ success: false, message: 'This mobile number is already registered with another email. Please login.' });
          }
          if (cleanEmail && !user.email) {
            await client.query(`UPDATE users SET email = $1 WHERE id = $2`, [cleanEmail, user.id]);
            user.email = cleanEmail;
          }
        } else {
          const cleanPassword = password && String(password).trim().length > 0 ? String(password).trim() : null;
          const hashedPassword = cleanPassword ? await bcrypt.hash(cleanPassword, 10) : null;
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
      const { phone, pin } = req.body;
      
      if (!phone || !pin) {
        return res.status(400).json({ success: false, message: 'Pharmacy phone and PIN are required' });
      }

      const rawPhone = String(phone).trim();
      const rawPin = String(pin).trim();
      const digitsOnly = rawPhone.replace(/\D/g, '');
      const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

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

      // 1b. If phone wasn't owner/store phone, check registered active staff phone
      if (!pharmacy) {
        try {
          const staffPharmResult = await pool.query(`
            SELECT p.id, p.name, p.owner_id, p.phone, p.business_type
            FROM staff_members sm
            JOIN pharmacies p ON sm.pharmacy_id = p.id
            WHERE sm.is_active = true
              AND (sm.phone = $1 OR (LENGTH($2) >= 10 AND sm.phone LIKE '%' || $2))
            ORDER BY sm.id ASC
            LIMIT 1
          `, [rawPhone, last10 || rawPhone]);

          if (staffPharmResult.rows.length > 0) {
            pharmacy = staffPharmResult.rows[0];
          }
        } catch (err) {
          console.warn('Staff phone pharmacy lookup warning:', err);
        }
      }

      if (!pharmacy) {
        return res.status(404).json({
          success: false,
          message: 'No registered pharmacy store found for this mobile number'
        });
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

      // Require exact PIN match in staff_members (no hardcoded 1234/0000 master bypass)
      if (!staff) {
        return res.status(401).json({
          success: false,
          message: 'Invalid Staff PIN. Please ask the pharmacy owner for your registered PIN.'
        });
      }

      if (staff && staff.is_active === false) {
        return res.status(403).json({ success: false, message: 'Account is inactive. Please contact the owner.' });
      }

      // Always issue a strictly scoped staff token for staff PIN login (never elevate to OWNER via phone match)
      const staffMember = {
        id: staff.id,
        name: staff.name || 'Counter Staff',
        phone: staff.phone || rawPhone,
        role: staff.role || 'BILLER',
        isStaff: true
      };

      // Create Token
      const token = jwt.sign(
        { userId: staffMember.id, phone: staffMember.phone, pharmacyId: pharmacy.id, role: staffMember.role, isStaff: staffMember.isStaff },
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

  // 5. Lookup Counter User (Check if mobile belongs to Staff, Manager, or Owner)
  static async lookupCounterUser(req: Request, res: Response) {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
      }

      const rawPhone = String(phone).trim();
      const digitsOnly = rawPhone.replace(/\D/g, '');
      const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

      // 1. Search in staff_members first (Active staff)
      try {
        const staffRes = await pool.query(`
          SELECT sm.id, sm.name, sm.role, sm.phone, sm.pharmacy_id, p.name as pharmacy_name
          FROM staff_members sm
          JOIN pharmacies p ON sm.pharmacy_id = p.id
          WHERE (sm.phone = $1 OR (LENGTH($2) >= 10 AND sm.phone LIKE '%' || $2))
            AND sm.is_active = true
          ORDER BY sm.id ASC
          LIMIT 1
        `, [rawPhone, last10 || rawPhone]);

        if (staffRes.rows.length > 0) {
          const s = staffRes.rows[0];
          return res.json({
            success: true,
            found: true,
            user: {
              id: s.id,
              name: s.name,
              role: s.role || 'STAFF',
              phone: s.phone,
              pharmacyId: s.pharmacy_id,
              pharmacyName: s.pharmacy_name,
              isStaff: true
            }
          });
        }
      } catch (err) {
        console.warn('Staff lookup query warning:', err);
      }

      // 2. Search in users + pharmacies (Store Owner)
      try {
        const ownerRes = await pool.query(`
          SELECT u.id, u.name, u.phone, p.id as pharmacy_id, p.name as pharmacy_name
          FROM users u
          JOIN pharmacies p ON p.owner_id = u.id
          WHERE (u.phone = $1 OR (LENGTH($2) >= 10 AND u.phone LIKE '%' || $2))
          ORDER BY p.id ASC
          LIMIT 1
        `, [rawPhone, last10 || rawPhone]);

        if (ownerRes.rows.length > 0) {
          const o = ownerRes.rows[0];
          return res.json({
            success: true,
            found: true,
            user: {
              id: o.id,
              name: o.name,
              role: 'OWNER',
              phone: o.phone,
              pharmacyId: o.pharmacy_id,
              pharmacyName: o.pharmacy_name,
              isStaff: false
            }
          });
        }
      } catch (err) {
        console.warn('Owner lookup query warning:', err);
      }

      // 3. Search in pharmacies directly (by store phone)
      try {
        const pharmRes = await pool.query(`
          SELECT p.id as pharmacy_id, p.name as pharmacy_name, p.phone, u.name as owner_name
          FROM pharmacies p
          LEFT JOIN users u ON p.owner_id = u.id
          WHERE (p.phone = $1 OR (LENGTH($2) >= 10 AND p.phone LIKE '%' || $2))
          ORDER BY p.id ASC
          LIMIT 1
        `, [rawPhone, last10 || rawPhone]);

        if (pharmRes.rows.length > 0) {
          const p = pharmRes.rows[0];
          return res.json({
            success: true,
            found: true,
            user: {
              id: 1,
              name: p.owner_name ? `${p.owner_name}'s Counter` : 'Store Counter',
              role: 'COUNTER_STAFF',
              phone: p.phone,
              pharmacyId: p.pharmacy_id,
              pharmacyName: p.pharmacy_name,
              isStaff: true
            }
          });
        }
      } catch (err) {
        console.warn('Pharmacy direct lookup query warning:', err);
      }

      return res.json({
        success: true,
        found: false,
        message: 'No registered staff or pharmacy owner found for this number.'
      });
    } catch (error) {
      console.error('lookupCounterUser error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // 6. Self-Service Account & Store Deletion (Google Play Store compliance)
  static async deleteAccount(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser || !authUser.userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      if (authUser.isStaff) {
        return res.status(403).json({ success: false, message: 'Only account owners can permanently delete an account.' });
      }

      const userId = Number(authUser.userId);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // Delete stores owned solely by this user (cascades dependent inventory/billing/staff data)
        await client.query('DELETE FROM pharmacies WHERE owner_id = $1', [userId]);
        await client.query('DELETE FROM users WHERE id = $1', [userId]);
        await client.query('COMMIT');
        return res.json({ success: true, message: 'Account and associated store data deleted permanently.' });
      } catch (err) {
        await client.query('ROLLBACK');
        // Fallback PII scrub if legacy foreign keys prevent hard deletion
        await pool.query(
          `UPDATE users SET name = 'Deleted User', phone = $2, email = NULL, password_hash = NULL WHERE id = $1`,
          [userId, `deleted_${userId}_${Date.now()}`]
        );
        return res.json({ success: true, message: 'Account deactivated and personal data removed.' });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Delete account error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete account' });
    }
  }
}
