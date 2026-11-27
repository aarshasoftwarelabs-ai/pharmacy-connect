import pool from '../config/database';
import { lookupMasterMedicineByBarcode, lookupMasterMedicineByName } from '../data/masterMedicines';
import { liveScanService } from './liveScanService';
import { getIo } from '../socket';

const ALLOWED_CATEGORIES = ['Tablets', 'Capsules', 'Syrups', 'Injections', 'Ointments', 'Drops', 'Inhalers', 'Others'] as const;
const ALLOWED_GST_RATES = [0, 5, 12, 18] as const;
const GEMINI_FLASH_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-flash-lite-latest',
  'gemini-flash-latest'
];
const SCHEDULE_H1_SALT_REGEX = /\b(alprazolam|balofloxacin|bedaquiline|buprenorphine|capreomycin|cefdinir|cefditoren|cefepime|cefixime|cefotaxime|cefpodoxime|ceftazidime|ceftriaxone|chlordiazepoxide|clofazimine|clobazam|clonazepam|clorazepate|cycloserine|delamanid|diazepam|diphenoxylate|doripenem|ertapenem|ethambutol|ethionamide|faropenem|flurazepam|gemifloxacin|imipenem|isoniazid|ketamine|levofloxacin|linezolid|lorazepam|meropenem|midazolam|moxifloxacin|nitrazepam|oxazepam|pentazocine|pyrazinamide|rifabutin|rifampicin|rifapentine|sparfloxacin|streptomycin|tigecycline|tramadol|zolpidem)\b/i;

const autofillCache = new Map<string, { data: any; expiresAt: number }>();

function normalizeCategory(raw: any): string {
  const clean = String(raw || '').trim().toLowerCase();
  const matched = ALLOWED_CATEGORIES.find(c => c.toLowerCase() === clean);
  if (matched) return matched;
  if (clean.includes('cap')) return 'Capsules';
  if (clean.includes('syr') || clean.includes('susp') || clean.includes('liq') || clean.includes('sol')) return 'Syrups';
  if (clean.includes('inj') || clean.includes('vial') || clean.includes('amp')) return 'Injections';
  if (clean.includes('oint') || clean.includes('cream') || clean.includes('gel')) return 'Ointments';
  if (clean.includes('drop')) return 'Drops';
  if (clean.includes('inhal') || clean.includes('rotacap') || clean.includes('resp')) return 'Inhalers';
  if (clean.includes('tab')) return 'Tablets';
  return 'Others';
}

function normalizeGstRate(raw: any): number {
  const num = Number(raw);
  if ((ALLOWED_GST_RATES as readonly number[]).includes(num)) return num;
  if (num === 28) return 18;
  return 12;
}

async function generateWithGeminiFlash(
  contentParts: any[],
  options: { timeoutMs?: number; jsonMode?: boolean } = {}
): Promise<{ text: string; modelUsed: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured on server.');
  }

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const timeoutMs = options.timeoutMs ?? 8000;

  for (const modelName of GEMINI_FLASH_MODELS) {
    try {
      const modelConfig: any = { model: modelName };
      if (options.jsonMode) {
        modelConfig.generationConfig = { responseMimeType: 'application/json', temperature: 0.1 };
      }
      const aiModel = genAI.getGenerativeModel(modelConfig);
      const generatePromise = aiModel.generateContent(contentParts);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout on model ${modelName}`)), timeoutMs)
      );
      const result: any = await Promise.race([generatePromise, timeoutPromise]);
      const text = result?.response?.text?.();
      if (text && String(text).trim().length > 0) {
        return { text: String(text).replace(/```json/gi, '').replace(/```/gi, '').trim(), modelUsed: modelName };
      }
    } catch (err: any) {
      console.warn(`[Gemini Flash] Model ${modelName} failed:`, err?.message || err);
    }
  }
  return null;
}

export function parseExpiryDate(dateStr: any): string {
  if (!dateStr || String(dateStr).trim() === '') {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 3);
    return `${future.getFullYear()}-12-31`;
  }
  const clean = String(dateStr).trim();
  const mmYyyy = clean.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYyyy) {
    const month = mmYyyy[1].padStart(2, '0');
    const year = mmYyyy[2];
    return `${year}-${month}-01`;
  }
  const mmYy = clean.match(/^(\d{1,2})\/(\d{2})$/);
  if (mmYy) {
    const month = mmYy[1].padStart(2, '0');
    const year = `20${mmYy[2]}`;
    return `${year}-${month}-01`;
  }
  const ddMmYyyy = clean.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (ddMmYyyy) {
    const day = ddMmYyyy[1].padStart(2, '0');
    const month = ddMmYyyy[2].padStart(2, '0');
    const year = ddMmYyyy[3];
    return `${year}-${month}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    return clean.split('T')[0];
  }
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  const future = new Date();
  future.setFullYear(future.getFullYear() + 3);
  return `${future.getFullYear()}-12-31`;
}

function isPrivateOrDisallowedHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  if (!host) return true;
  if (host === 'localhost' || host === '::1' || host.endsWith('.local') || host.endsWith('.internal')) {
    return true;
  }
  const parts = host.split('.').map(Number);
  if (parts.length === 4 && parts.every(n => Number.isInteger(n) && n >= 0 && n <= 255)) {
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

async function resolveUrlMedicineName(urlStr: string): Promise<string | null> {
  try {
    const parsed = new URL(urlStr);
    if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || isPrivateOrDisallowedHost(parsed.hostname)) {
      return null;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const text = await res.text();

    const isRealTitle = (t: string) => {
      const lower = t.toLowerCase().trim();
      return !lower.includes('giant qr') &&
             !lower.includes('me-qr') &&
             !lower.includes('qr code generator') &&
             !lower.includes('view qr') &&
             !lower.includes('free qr') &&
             !lower.includes('dynamic qr') &&
             !lower.includes('url / link') &&
             !lower.includes('qr scanner') &&
             lower.length > 0;
    };

    // 1. Check ALL twitter:title tags (ME-QR stores page default at top, and user custom title lower down)
    const twMatches = [
      ...Array.from(text.matchAll(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/gi)),
      ...Array.from(text.matchAll(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:title["']/gi))
    ];
    for (const match of twMatches) {
      if (match && match[1] && isRealTitle(match[1])) {
        return match[1].trim();
      }
    }

    // 2. Check ALL og:title tags
    const ogMatches = [
      ...Array.from(text.matchAll(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/gi)),
      ...Array.from(text.matchAll(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/gi))
    ];
    for (const match of ogMatches) {
      if (match && match[1] && isRealTitle(match[1])) {
        return match[1].trim();
      }
    }

    // 3. Check <title>
    const tm = text.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (tm && isRealTitle(tm[1])) return tm[1].trim();
  } catch (_) {}
  return null;
}

export class MedicineService {
  static async getMedicines(pharmacyId: number) {
    const query = `
      SELECT m.id, m.pharmacy_id as "pharmacyId", m.name, m.generic_name as "genericName", 
             m.category, m.strength, m.sku, m.barcode, m.current_stock as "currentStock", 
             m.minimum_stock as "minimumStock", m.selling_price as "sellingPrice",
             COALESCE(m.mrp, m.selling_price) as "mrp",
             m.image_url as "imageUrl", m.hsn_code as "hsnCode", m.gst_rate as "gstRate",
             m.pack_size as "packSize", m.mfg_date as "mfgDate",
             m.manufacturer, m.expiry_date as "expiryDate", m.created_at as "createdAt", m.updated_at as "updatedAt",
             (
               SELECT COALESCE(json_agg(
                 json_build_object(
                   'id', mb.id,
                   'batchNumber', mb.batch_number,
                   'expiryDate', mb.expiry_date,
                   'quantity', mb.quantity,
                   'availableQuantity', mb.available_quantity,
                   'purchasePrice', mb.purchase_price,
                   'mrp', mb.mrp,
                   'sellingPrice', mb.selling_price,
                   'barcode', mb.barcode
                 ) ORDER BY mb.expiry_date ASC
               ), '[]'::json)
               FROM medicine_batches mb
               WHERE mb.medicine_id = m.id
             ) as batches
      FROM medicines m
      WHERE m.pharmacy_id = $1
      ORDER BY m.name ASC;
    `;
    const result = await pool.query(query, [pharmacyId]);
    return result.rows;
  }

  /**
   * Find in-stock substitute medicines with the same generic salt / composition
   */
  static async getSubstitutes(pharmacyId: number, genericName: string, excludeId?: number | string, strength?: string) {
    const cleanGeneric = (genericName || '').trim();
    if (!cleanGeneric || cleanGeneric.toLowerCase() === 'general formulation') {
      return [];
    }

    const query = `
      SELECT m.id, m.pharmacy_id as "pharmacyId", m.name, m.generic_name as "genericName", 
             m.category, m.strength, m.sku, m.barcode, m.current_stock as "currentStock", 
             m.minimum_stock as "minimumStock", m.selling_price as "sellingPrice",
             COALESCE(m.mrp, m.selling_price) as "mrp",
             m.manufacturer, m.expiry_date as "expiryDate"
      FROM medicines m
      WHERE m.pharmacy_id = $1 
        AND m.current_stock > 0
        AND ($2::text IS NULL OR $2::text = '' OR m.id::text <> $2::text)
        AND (
          LOWER(TRIM(m.generic_name)) = LOWER(TRIM($3))
          OR LOWER(m.generic_name) ILIKE '%' || LOWER(TRIM($3)) || '%'
          OR LOWER(TRIM($3)) ILIKE '%' || LOWER(m.generic_name) || '%'
        )
      ORDER BY 
        CASE WHEN $4::text IS NOT NULL AND LOWER(TRIM(COALESCE(m.strength, ''))) = LOWER(TRIM($4)) THEN 0 ELSE 1 END,
        m.current_stock DESC,
        m.selling_price ASC
      LIMIT 10;
    `;

    const result = await pool.query(query, [
      pharmacyId, 
      excludeId ? String(excludeId) : null, 
      cleanGeneric,
      strength ? String(strength).trim() : null
    ]);
    return result.rows;
  }

  /**
   * Get medicines below minimum stock limit (Auto Shortage / Kammi-Book)
   */
  static async getShortageMedicines(pharmacyId: number) {
    const query = `
      SELECT m.id, m.pharmacy_id as "pharmacyId", m.name, m.generic_name as "genericName", 
             m.category, m.strength, m.sku, m.barcode, m.current_stock as "currentStock", 
             m.minimum_stock as "minimumStock", m.selling_price as "sellingPrice",
             m.purchase_price as "purchasePrice",
             COALESCE(m.mrp, m.selling_price) as "mrp",
             m.manufacturer, m.expiry_date as "expiryDate",
             GREATEST(10, (m.minimum_stock * 2) - m.current_stock) as "suggestedReorderQty"
      FROM medicines m
      WHERE m.pharmacy_id = $1 
        AND m.current_stock <= m.minimum_stock
      ORDER BY m.current_stock ASC, m.name ASC;
    `;
    const result = await pool.query(query, [pharmacyId]);
    return result.rows;
  }

  static async lookupBarcode(pharmacyId: number, barcode: string) {
    const clean = (barcode || '').trim();
    if (!clean) return { found: false, message: 'Barcode is empty' };

    // 1. Check in pharmacy's own medicines
    const ownRes = await pool.query(
      `SELECT m.*, COALESCE(m.mrp, m.selling_price) as mrp
       FROM medicines m 
       WHERE m.pharmacy_id = $1 AND (m.barcode = $2 OR m.sku = $2)
       LIMIT 1`,
      [pharmacyId, clean]
    );
    if (ownRes.rows.length > 0) {
      const row = ownRes.rows[0];
      return {
        found: true,
        isExistingInPharmacy: true,
        medicine: {
          id: row.id,
          name: row.name,
          genericName: row.generic_name,
          category: row.category,
          strength: row.strength,
          mrp: Number(row.mrp) || Number(row.selling_price),
          sellingPrice: Number(row.selling_price),
          currentStock: row.current_stock,
          barcode: row.barcode,
          manufacturer: row.manufacturer,
          hsnCode: row.hsn_code,
          gstRate: row.gst_rate,
          expiryDate: row.expiry_date ? String(row.expiry_date).split('T')[0] : '2028-12-31'
        }
      };
    }

    // 2. Check in MASTER_MEDICINES (shared public reference catalog; do NOT leak other pharmacies' DB records)
    const master = lookupMasterMedicineByBarcode(clean);
    if (master) {
      return {
        found: true,
        isExistingInPharmacy: false,
        medicine: {
          name: master.name,
          genericName: master.genericName,
          category: master.category,
          strength: master.strength,
          dosageForm: master.dosageForm,
          packSize: master.packSize,
          manufacturer: master.manufacturer,
          mrp: master.mrp,
          sellingPrice: master.sellingPrice,
          purchasePrice: Math.round(master.sellingPrice * 0.75 * 100) / 100,
          currentStock: 20,
          barcode: clean,
          hsnCode: master.hsnCode,
          gstRate: master.gstRate,
          expiryDate: '2028-12-31'
        }
      };
    }

    // 4. If barcode is an HTTP/HTTPS URL, resolve real title dynamically (e.g. ME-QR medicine box QR codes)
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      const resolvedName = await resolveUrlMedicineName(clean);
      if (resolvedName) {
        return {
          found: true,
          isExistingInPharmacy: false,
          medicine: {
            name: resolvedName,
            genericName: '',
            category: 'Tablets',
            strength: '',
            dosageForm: 'Tablet',
            packSize: '10 tablets',
            manufacturer: '',
            mrp: 0.0,
            sellingPrice: 0.0,
            purchasePrice: 0.0,
            currentStock: 10,
            barcode: clean,
            hsnCode: '30049099',
            gstRate: 12,
            expiryDate: ''
          }
        };
      }
    }

    // 5. Unknown barcode: do NOT return fake dummy values
    return {
      found: false,
      isExistingInPharmacy: false,
      barcode: clean,
      message: 'Barcode not found in database or master catalog'
    };
  }

  static async createMedicine(pharmacyId: number, data: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Resolve valid pharmacyId: strictly require an existing authenticated store ID
      const targetPharmacyId = Number(pharmacyId);
      if (!Number.isInteger(targetPharmacyId) || targetPharmacyId <= 0) {
        throw new Error('Authenticated pharmacy store context is required');
      }
      const pharmCheck = await client.query(`SELECT id FROM pharmacies WHERE id = $1`, [targetPharmacyId]);
      if (pharmCheck.rows.length === 0) {
        throw new Error('Registered pharmacy store not found');
      }

      const cleanBarcode = data.barcode && String(data.barcode).trim() !== '' 
        ? String(data.barcode).trim() 
        : `890${String(targetPharmacyId).padStart(3, '0').slice(-3)}${String(Math.floor(Math.random() * 900000) + 100000)}`;

      const sellingPrice = Number(data.sellingPrice) || 0;
      const mrp = Number(data.mrp) || (sellingPrice > 0 ? Math.round(sellingPrice * 1.15) : 0);
      const currentStock = Math.max(0, Number(data.currentStock) || 0);
      const minimumStock = data.minimumStock !== undefined && data.minimumStock !== null ? Number(data.minimumStock) : 10;
      const gstRate = data.gstRate !== undefined && data.gstRate !== null && !isNaN(Number(data.gstRate))
        ? Number(data.gstRate)
        : 12;
      const parsedExpiry = parseExpiryDate(data.expiryDate);

      // Safe unique SKU so constraint never fails
      const cleanSku = data.sku && String(data.sku).trim() !== '' 
        ? String(data.sku).trim() 
        : `SKU-${targetPharmacyId}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

      // 2. Check if a medicine with this barcode already exists in this pharmacy
      const existingMed = await client.query(
        `SELECT id, current_stock, selling_price, mrp FROM medicines WHERE pharmacy_id = $1 AND barcode = $2 LIMIT 1`,
        [targetPharmacyId, cleanBarcode]
      );
      if (existingMed.rows.length > 0) {
        const exMed = existingMed.rows[0];
        const newStock = exMed.current_stock + currentStock;
        const updateRes = await client.query(
          `UPDATE medicines 
           SET current_stock = $1, 
               selling_price = COALESCE(NULLIF($2, 0), selling_price), 
               mrp = COALESCE(NULLIF($3, 0), mrp), 
               expiry_date = COALESCE($5, expiry_date),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4
           RETURNING id, pharmacy_id as "pharmacyId", name, generic_name as "genericName", 
                     category, strength, sku, barcode, current_stock as "currentStock", 
                     minimum_stock as "minimumStock", COALESCE(mrp, selling_price) as "mrp", selling_price as "sellingPrice",
                     image_url as "imageUrl", hsn_code as "hsnCode", gst_rate as "gstRate",
                     manufacturer, expiry_date as "expiryDate", created_at as "createdAt", updated_at as "updatedAt"`,
          [newStock, sellingPrice, mrp, exMed.id, parsedExpiry]
        );

        if (currentStock > 0) {
          const batchNum = data.batchNumber ? String(data.batchNumber).trim() : null;
          try {
            if (batchNum) {
              const purchasePrice = Number(data.purchasePrice) || Math.round(mrp * 0.75 * 100) / 100;
              await client.query(
                `INSERT INTO medicine_batches (
                  pharmacy_id, medicine_id, batch_number, expiry_date,
                  quantity, available_quantity, stock, purchase_price, mrp, selling_price, barcode
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (medicine_id, pharmacy_id, batch_number) DO UPDATE
                SET quantity = medicine_batches.quantity + EXCLUDED.quantity,
                    available_quantity = medicine_batches.available_quantity + EXCLUDED.available_quantity,
                    stock = medicine_batches.stock + EXCLUDED.stock,
                    expiry_date = COALESCE(EXCLUDED.expiry_date, medicine_batches.expiry_date),
                    updated_at = CURRENT_TIMESTAMP`,
                [
                  targetPharmacyId, exMed.id, batchNum, parsedExpiry,
                  currentStock, currentStock, currentStock, purchasePrice, mrp, sellingPrice, cleanBarcode
                ]
              );
            } else {
              await client.query(
                `UPDATE medicine_batches 
                 SET stock = stock + $1, available_quantity = available_quantity + $1, quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = (
                   SELECT id FROM medicine_batches
                   WHERE medicine_id = $2 AND pharmacy_id = $3
                   ORDER BY expiry_date ASC, id ASC LIMIT 1
                 )`,
                [currentStock, exMed.id, targetPharmacyId]
              );
            }
          } catch (bErr) {
            console.warn('Batch stock update note:', bErr);
          }
        }

        await client.query('COMMIT');
        return updateRes.rows[0];
      }

      const query = `
        INSERT INTO medicines (
          pharmacy_id, name, generic_name, category, strength, sku, barcode, 
          current_stock, minimum_stock, mrp, selling_price, image_url, hsn_code, gst_rate, manufacturer, expiry_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id, pharmacy_id as "pharmacyId", name, generic_name as "genericName", 
                  category, strength, sku, barcode, current_stock as "currentStock", 
                  minimum_stock as "minimumStock", COALESCE(mrp, selling_price) as "mrp", selling_price as "sellingPrice",
                  image_url as "imageUrl", hsn_code as "hsnCode", gst_rate as "gstRate",
                  manufacturer, expiry_date as "expiryDate", created_at as "createdAt", updated_at as "updatedAt"
      `;

      const values = [
        targetPharmacyId, 
        data.name ? String(data.name).trim() : 'Unnamed Medicine', 
        data.genericName ? String(data.genericName).trim() : null, 
        data.category || 'General', 
        data.strength || null, 
        cleanSku, 
        cleanBarcode,
        currentStock, 
        minimumStock, 
        mrp,
        sellingPrice,
        data.imageUrl || null, 
        data.hsnCode || '30049099', 
        gstRate,
        data.manufacturer || null, 
        parsedExpiry
      ];

      const result = await client.query(query, values);
      const createdMed = result.rows[0];

      // If opening stock exists, automatically create an initial batch in medicine_batches
      if (currentStock > 0) {
        const batchNumber = data.batchNumber || cleanSku || `B-${Date.now().toString().slice(-6)}`;
        const purchasePrice = Number(data.purchasePrice) || Math.round(mrp * 0.75 * 100) / 100;

        try {
          await client.query(
            `INSERT INTO medicine_batches (
              pharmacy_id, medicine_id, batch_number, expiry_date,
              quantity, available_quantity, stock, purchase_price, mrp, selling_price, barcode
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (medicine_id, pharmacy_id, batch_number) DO UPDATE
            SET quantity = EXCLUDED.quantity, available_quantity = EXCLUDED.available_quantity, stock = EXCLUDED.stock`,
            [
              targetPharmacyId, createdMed.id, batchNumber, parsedExpiry,
              currentStock, currentStock, currentStock, purchasePrice, mrp, sellingPrice, cleanBarcode
            ]
          );
        } catch (batchErr) {
          console.warn('Initial batch creation notice:', batchErr);
        }
      }

      await client.query('COMMIT');
      return createdMed;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async updateMedicine(id: number, pharmacyId: number, data: any) {
    const fields: string[] = [];
    const values: any[] = [];
    let queryIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${queryIndex++}`);
      values.push(data.name);
    }
    if (data.genericName !== undefined) {
      fields.push(`generic_name = $${queryIndex++}`);
      values.push(data.genericName);
    }
    if (data.category !== undefined) {
      fields.push(`category = $${queryIndex++}`);
      values.push(data.category);
    }
    if (data.strength !== undefined) {
      fields.push(`strength = $${queryIndex++}`);
      values.push(data.strength === '' ? null : data.strength);
    }
    if (data.sku !== undefined) {
      fields.push(`sku = $${queryIndex++}`);
      values.push(data.sku === '' ? null : data.sku);
    }
    if (data.barcode !== undefined) {
      fields.push(`barcode = $${queryIndex++}`);
      values.push(data.barcode === '' ? null : data.barcode);
    }
    if (data.currentStock !== undefined) {
      fields.push(`current_stock = $${queryIndex++}`);
      values.push(data.currentStock);
    }
    if (data.minimumStock !== undefined) {
      fields.push(`minimum_stock = $${queryIndex++}`);
      values.push(data.minimumStock);
    }
    if (data.mrp !== undefined) {
      fields.push(`mrp = $${queryIndex++}`);
      values.push(Number(data.mrp) || 0);
    }
    if (data.sellingPrice !== undefined) {
      fields.push(`selling_price = $${queryIndex++}`);
      values.push(data.sellingPrice);
    }
    if (data.imageUrl !== undefined) {
      fields.push(`image_url = $${queryIndex++}`);
      values.push(data.imageUrl === '' ? null : data.imageUrl);
    }
    if (data.hsnCode !== undefined) {
      fields.push(`hsn_code = $${queryIndex++}`);
      values.push(data.hsnCode === '' ? null : data.hsnCode);
    }
    if (data.gstRate !== undefined) {
      fields.push(`gst_rate = $${queryIndex++}`);
      values.push(data.gstRate);
    }
    if (data.manufacturer !== undefined) {
      fields.push(`manufacturer = $${queryIndex++}`);
      values.push(data.manufacturer === '' ? null : data.manufacturer);
    }
    if (data.expiryDate !== undefined) {
      fields.push(`expiry_date = $${queryIndex++}`);
      values.push(data.expiryDate === '' ? null : parseExpiryDate(data.expiryDate));
    }

    if (fields.length === 0) {
      // Nothing to update
      const res = await pool.query(`SELECT *, COALESCE(mrp, selling_price) as mrp FROM medicines WHERE id = $1 AND pharmacy_id = $2`, [id, pharmacyId]);
      return res.rows[0];
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, pharmacyId);

    const query = `
      UPDATE medicines
      SET ${fields.join(', ')}
      WHERE id = $${queryIndex++} AND pharmacy_id = $${queryIndex++}
      RETURNING id, pharmacy_id as "pharmacyId", name, generic_name as "genericName", 
                category, strength, sku, barcode, current_stock as "currentStock", 
                minimum_stock as "minimumStock", COALESCE(mrp, selling_price) as "mrp", selling_price as "sellingPrice",
                image_url as "imageUrl", hsn_code as "hsnCode", gst_rate as "gstRate",
                manufacturer, expiry_date as "expiryDate", created_at as "createdAt", updated_at as "updatedAt"
    `;
    const result = await pool.query(query, values);
    const updated = result.rows[0];

    // Sync batches if batchNumber or currentStock was updated
    if (updated && (data.batchNumber !== undefined || data.currentStock !== undefined)) {
      try {
        const batchNum = data.batchNumber ? String(data.batchNumber).trim() : null;
        if (batchNum) {
          const parsedExp = parseExpiryDate(data.expiryDate ?? updated.expiryDate);
          const mrp = Number(updated.mrp) || 0;
          const sp = Number(updated.sellingPrice) || 0;
          const purchasePrice = Number(data.purchasePrice) || Math.round(mrp * 0.75 * 100) / 100;
          const stockVal = data.currentStock !== undefined ? Number(data.currentStock) : (Number(updated.currentStock) || 0);

          await pool.query(
            `INSERT INTO medicine_batches (
              pharmacy_id, medicine_id, batch_number, expiry_date,
              quantity, available_quantity, stock, purchase_price, mrp, selling_price, barcode
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (medicine_id, pharmacy_id, batch_number) DO UPDATE
            SET stock = EXCLUDED.stock,
                quantity = EXCLUDED.quantity,
                available_quantity = EXCLUDED.available_quantity,
                expiry_date = COALESCE(EXCLUDED.expiry_date, medicine_batches.expiry_date),
                updated_at = CURRENT_TIMESTAMP`,
            [
              pharmacyId, id, batchNum, parsedExp,
              stockVal, stockVal, stockVal, purchasePrice, mrp, sp, updated.barcode
            ]
          );
        } else if (data.currentStock !== undefined) {
          await pool.query(
            `UPDATE medicine_batches 
             SET stock = $1, available_quantity = $1, quantity = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = (
               SELECT id FROM medicine_batches
               WHERE medicine_id = $2 AND pharmacy_id = $3
               ORDER BY expiry_date ASC, id ASC LIMIT 1
             )`,
            [data.currentStock, id, pharmacyId]
          );
        }
      } catch (bErr) {
        console.warn('Batch stock sync note:', bErr);
      }
    }

    return updated;
  }

  static async deleteMedicine(id: number, pharmacyId: number) {
    const query = `DELETE FROM medicines WHERE id = $1 AND pharmacy_id = $2 RETURNING id`;
    const result = await pool.query(query, [id, pharmacyId]);
    return result.rows.length > 0;
  }

  // Bulk Import medicines and batches from Distributor CSV / Excel
  static async bulkImportMedicines(pharmacyId: number, items: Array<{
    name: string;
    genericName?: string;
    category?: string;
    strength?: string;
    batchNumber?: string;
    expiryDate?: string;
    quantity: number;
    purchasePrice?: number;
    mrp?: number;
    sellingPrice?: number;
    gstRate?: number;
    hsnCode?: string;
    barcode?: string;
    sku?: string;
    manufacturer?: string;
  }>) {
    const client = await pool.connect();
    let importedCount = 0;
    let totalStockAdded = 0;

    try {
      await client.query('BEGIN');

      for (const item of items) {
        if (!item.name || !item.name.trim()) continue;

        const medName = item.name.trim();
        const qty = Math.max(0, Number(item.quantity) || 0);
        const purchasePrice = Math.max(0, Number(item.purchasePrice) || 0);
        const mrp = Number(item.mrp) || Number(item.sellingPrice) || purchasePrice * 1.25;
        const sellingPrice = Number(item.sellingPrice) || mrp;
        const gstRate = item.gstRate !== undefined && item.gstRate !== null && !isNaN(Number(item.gstRate))
          ? Number(item.gstRate)
          : 12;
        const parsedExpDate = item.expiryDate ? parseExpiryDate(item.expiryDate) : parseExpiryDate(null);
        const barcode = item.barcode ? item.barcode.trim() : null;
        const sku = item.sku ? item.sku.trim() : `SKU-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;

        // Check if medicine already exists by name
        const checkRes = await client.query(
          `SELECT id, current_stock, selling_price, barcode FROM medicines WHERE pharmacy_id = $1 AND LOWER(name) = LOWER($2)`,
          [pharmacyId, medName]
        );

        let medicineId: number;

        if (checkRes.rows.length > 0) {
          // Update existing medicine stock
          medicineId = checkRes.rows[0].id;
          await client.query(
            `UPDATE medicines 
             SET current_stock = current_stock + $1,
                 selling_price = COALESCE(NULLIF($2, 0), selling_price),
                 mrp = COALESCE(NULLIF($3, 0), mrp),
                 barcode = COALESCE(barcode, $4),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5 AND pharmacy_id = $6`,
            [qty, sellingPrice, mrp, barcode, medicineId, pharmacyId]
          );
        } else {
          // Insert new medicine
          const insertMedRes = await client.query(
            `INSERT INTO medicines (
              pharmacy_id, name, generic_name, category, strength, sku, barcode,
              current_stock, minimum_stock, mrp, selling_price, hsn_code, gst_rate, manufacturer, expiry_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 10, $9, $10, $11, $12, $13, $14)
            RETURNING id`,
            [
              pharmacyId,
              medName,
              item.genericName || null,
              item.category || 'Pharmaceutical',
              item.strength || null,
              sku,
              barcode,
              qty,
              mrp,
              sellingPrice,
              item.hsnCode || '3004',
              gstRate,
              item.manufacturer || null,
              parsedExpDate
            ]
          );
          medicineId = insertMedRes.rows[0].id;
        }

        // Insert or merge Batch if batchNumber provided
        if (item.batchNumber && item.batchNumber.trim() && qty > 0) {
          const batchNo = item.batchNumber.trim();

          await client.query(
            `INSERT INTO medicine_batches (
              pharmacy_id, medicine_id, batch_number, expiry_date,
              quantity, available_quantity, stock, purchase_price, mrp, selling_price, barcode
            ) VALUES ($1, $2, $3, $4, $5, $5, $5, $6, $7, $8, $9)
            ON CONFLICT (medicine_id, pharmacy_id, batch_number) DO UPDATE
            SET quantity = medicine_batches.quantity + EXCLUDED.quantity,
                available_quantity = medicine_batches.available_quantity + EXCLUDED.available_quantity,
                stock = COALESCE(medicine_batches.stock, 0) + EXCLUDED.stock,
                expiry_date = COALESCE(EXCLUDED.expiry_date, medicine_batches.expiry_date),
                updated_at = CURRENT_TIMESTAMP`,
            [
              pharmacyId,
              medicineId,
              batchNo,
              parsedExpDate,
              qty,
              purchasePrice,
              mrp,
              sellingPrice,
              barcode
            ]
          );
        }

        importedCount++;
        totalStockAdded += qty;
      }

      await client.query('COMMIT');
      return {
        success: true,
        importedCount,
        totalStockAdded,
        message: `Successfully imported ${importedCount} medicines (${totalStockAdded} total stock units)`
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async generateMissingBarcodes(pharmacyId: number) {
    const medicinesRes = await pool.query(
      `SELECT id, name FROM medicines WHERE pharmacy_id = $1 AND (barcode IS NULL OR TRIM(barcode) = '')`,
      [pharmacyId]
    );

    let updatedCount = 0;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const med of medicinesRes.rows) {
        const barcode = `890${String(pharmacyId).padStart(3, '0').slice(-3)}${String(med.id).padStart(5, '0').slice(-5)}${Math.floor(Math.random() * 10)}`;
        await client.query(
          `UPDATE medicines SET barcode = $1 WHERE id = $2`,
          [barcode, med.id]
        );
        // Also update batches if batch barcode is missing
        await client.query(
          `UPDATE medicine_batches SET barcode = $1 WHERE medicine_id = $2 AND (barcode IS NULL OR TRIM(barcode) = '')`,
          [barcode, med.id]
        );
        updatedCount++;
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return {
      success: true,
      updatedCount,
      message: `Generated barcodes for ${updatedCount} medicines.`
    };
  }

  static async scanMedicineBox(
    buffer: Buffer,
    mimeType: string,
    pharmacyId: number,
    syncToPc: boolean = false
  ) {
    const imageParts = [
      {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: mimeType || 'image/jpeg'
        }
      }
    ];

    const prompt = `Analyze this medicine packaging / medicine box flap image.
Extract the following exact fields accurately, reading dot-matrix inkjet or printed text:
{
  "medicine_name": "string (brand name of medicine, e.g. Panresh-DSR, Rabresh-DSR, Arvind, etc.)",
  "generic_name": "string or null (active chemical salt/composition if mentioned)",
  "batch_number": "string (Batch No. / Batch क्रमांक, e.g. T260241, CO92604, etc.)",
  "mfg_date": "string (Manufacturing date as MM/YYYY or YYYY-MM)",
  "expiry_date": "string (Expiry date as MM/YYYY or YYYY-MM, Exp Date / समाप्ती की तिथि)",
  "mrp": number (MRP in INR as float e.g. 74.99 or 120.00),
  "pack_size": "string (e.g. 10 Tablets or 10 Capsules or 100ml)",
  "mfg_lic_no": "string (e.g. G/25/1820 or G/25/2342)",
  "manufacturer": "string (Company / Manufacturer name)",
  "confidence": number (between 0.0 and 1.0)
}
Return ONLY valid JSON without markdown wrapping.`;

    let extracted: any;
    const aiResponse = await generateWithGeminiFlash([prompt, ...imageParts], { timeoutMs: 9000 });

    if (!aiResponse) {
      console.warn('[OCR Box Scan] Vision model did not return a response.');
      extracted = {
        medicine_name: null,
        generic_name: null,
        batch_number: null,
        expiry_date: null,
        mrp: 0,
        pack_size: null,
        manufacturer: null,
        confidence: 0.0
      };
    } else {
      try {
        extracted = JSON.parse(aiResponse.text);
      } catch (e) {
        console.warn('[OCR Box Scan] Failed to parse OCR response as JSON:', aiResponse.text);
        extracted = {
          medicine_name: null,
          generic_name: null,
          batch_number: null,
          expiry_date: null,
          mrp: 0,
          pack_size: null,
          manufacturer: null,
          confidence: 0.0
        };
      }
    }

    // Clean and normalize fields
    const batchNumber = extracted.batch_number ? String(extracted.batch_number).trim().toUpperCase() : null;
    const rawExpDate = extracted.expiry_date ? String(extracted.expiry_date).trim() : null;
    const normalizedExpiry = rawExpDate ? parseExpiryDate(rawExpDate) : null;
    const mrp = Number(extracted.mrp) > 0 ? Number(extracted.mrp) : 0;
    const medicineName = extracted.medicine_name ? String(extracted.medicine_name).trim() : null;
    const genericName = extracted.generic_name ? String(extracted.generic_name).trim() : null;
    const packSize = extracted.pack_size ? String(extracted.pack_size).trim() : null;
    const mfgDate = extracted.mfg_date ? String(extracted.mfg_date).trim() : null;
    const mfgLicNo = extracted.mfg_lic_no ? String(extracted.mfg_lic_no).trim() : null;
    const manufacturer = extracted.manufacturer ? String(extracted.manufacturer).trim() : null;

    // Check expiry health
    let expiryStatus: 'HEALTHY' | 'NEAR_EXPIRY' | 'EXPIRED' = 'HEALTHY';
    let daysUntilExpiry = 999;
    if (normalizedExpiry) {
      const expD = new Date(normalizedExpiry);
      const now = new Date();
      daysUntilExpiry = Math.ceil((expD.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 0) {
        expiryStatus = 'EXPIRED';
      } else if (daysUntilExpiry <= 90) {
        expiryStatus = 'NEAR_EXPIRY';
      }
    }

    // Database lookup for matched medicine in pharmacy inventory
    let matchedMedicine: any = null;
    try {
      if (batchNumber) {
        const batchRes = await pool.query(
          `SELECT m.id, m.name, m.generic_name as "genericName", m.category, m.selling_price as "sellingPrice",
                  m.mrp, m.current_stock as "currentStock", m.barcode, mb.batch_number as "batchNumber", mb.expiry_date as "expiryDate"
           FROM medicines m
           JOIN medicine_batches mb ON mb.medicine_id = m.id
           WHERE m.pharmacy_id = $1 AND LOWER(mb.batch_number) = LOWER($2)
           LIMIT 1`,
          [pharmacyId, batchNumber]
        );
        if (batchRes.rows.length > 0) {
          matchedMedicine = batchRes.rows[0];
        }
      }

      if (!matchedMedicine && medicineName && medicineName.length >= 3) {
        const cleanName = medicineName.replace(/[^a-zA-Z0-9]/g, '%');
        const medRes = await pool.query(
          `SELECT id, name, generic_name as "genericName", category, selling_price as "sellingPrice",
                  mrp, current_stock as "currentStock", barcode
           FROM medicines
           WHERE pharmacy_id = $1 AND name ILIKE $2
           LIMIT 1`,
          [pharmacyId, `%${cleanName}%`]
        );
        if (medRes.rows.length > 0) {
          matchedMedicine = medRes.rows[0];
        }
      }
    } catch (dbErr) {
      console.warn('Medicine lookup error:', dbErr);
    }

    // Live sync to PC if requested
    let syncedItem: any = null;
    if (syncToPc) {
      try {
        const itemToPush = {
          pharmacyId,
          medicineName: matchedMedicine ? matchedMedicine.name : (medicineName || (batchNumber ? `Batch ${batchNumber}` : 'Scanned Medicine')),
          quantity: 1,
          unitPrice: mrp > 0 ? mrp : (matchedMedicine?.sellingPrice || 0),
          mrp: mrp > 0 ? mrp : (matchedMedicine?.mrp || 0),
          batchNumber: batchNumber || undefined,
          expiryDate: normalizedExpiry || undefined,
          mfgDate: mfgDate || undefined,
          packSize: packSize || undefined,
          mfgLicNo: mfgLicNo || undefined,
          isOcrScan: true,
          scannedBy: 'AI Box OCR Scanner'
        };

        syncedItem = liveScanService.addScan(itemToPush);

        const io = getIo();
        if (io) {
          io.to(`pharmacy_${pharmacyId}`).emit('mobile_item_scanned', syncedItem);
          io.to(`pharmacy_${pharmacyId}`).emit('mobile_box_ocr_scanned', syncedItem);
        }
      } catch (syncErr) {
        console.warn('Live sync error:', syncErr);
      }
    }

    return {
      medicine_name: medicineName,
      generic_name: genericName,
      batch_number: batchNumber,
      mfg_date: mfgDate,
      expiry_date: normalizedExpiry,
      raw_expiry: rawExpDate,
      days_until_expiry: daysUntilExpiry,
      expiry_status: expiryStatus,
      mrp: mrp,
      pack_size: packSize,
      mfg_lic_no: mfgLicNo,
      manufacturer: manufacturer,
      confidence: extracted.confidence !== undefined && extracted.confidence !== null ? Number(extracted.confidence) : 0,
      matched_medicine: matchedMedicine,
      synced_item: syncedItem
    };
  }

  /**
   * 3-Step Hybrid Smart Auto-fill:
   * 1) Pharmacy's own verified DB catalog
   * 2) Built-in verified MASTER_MEDICINES catalog
   * 3) Google Gemini Flash AI (real Indian pharma metadata; never fabricates MRP/stock)
   */
  static async smartAutofillMedicine(pharmacyId: number, rawName: string) {
    const cleanName = String(rawName || '').trim();
    if (cleanName.length < 2) {
      return { found: false, message: 'Please enter at least 2 characters of medicine name.' };
    }

    // 1. Store's own DB match
    try {
      const dbRes = await pool.query(
        `SELECT name, generic_name as "genericName", category, strength, dosage_form as "dosageForm",
                pack_size as "packSize", manufacturer, hsn_code as "hsnCode", gst_rate as "gstRate",
                is_prescription_required as "prescriptionRequired", is_schedule_h1 as "isScheduleH1"
         FROM medicines
         WHERE pharmacy_id = $1 AND (LOWER(name) = LOWER($2) OR LOWER(name) ILIKE $3)
         ORDER BY CASE WHEN LOWER(name) = LOWER($2) THEN 0 ELSE 1 END, id DESC
         LIMIT 1`,
        [pharmacyId, cleanName, `%${cleanName}%`]
      );
      if (dbRes.rows.length > 0) {
        const row = dbRes.rows[0];
        return {
          found: true,
          source: 'STORE_DB',
          aiGenerated: false,
          medicine: {
            genericName: row.genericName || '',
            category: normalizeCategory(row.category),
            strength: row.strength || '',
            dosageForm: row.dosageForm || 'Tablet',
            packSize: row.packSize || '',
            manufacturer: row.manufacturer || '',
            hsnCode: row.hsnCode || '30049099',
            gstRate: normalizeGstRate(row.gstRate ?? 12),
            prescriptionRequired: Boolean(row.prescriptionRequired),
            isScheduleH1: Boolean(row.isScheduleH1),
          }
        };
      }
    } catch (dbErr) {
      console.warn('[SmartAutofill] Store DB lookup note:', dbErr);
    }

    // 2. Verified Master Catalog match
    const master = lookupMasterMedicineByName(cleanName);
    if (master) {
      const h1 = SCHEDULE_H1_SALT_REGEX.test(master.genericName) || SCHEDULE_H1_SALT_REGEX.test(master.name);
      return {
        found: true,
        source: 'MASTER_CATALOG',
        aiGenerated: false,
        medicine: {
          genericName: master.genericName,
          category: normalizeCategory(master.category),
          strength: master.strength,
          dosageForm: master.dosageForm,
          packSize: master.packSize,
          manufacturer: master.manufacturer,
          hsnCode: master.hsnCode || '30049099',
          gstRate: normalizeGstRate(master.gstRate),
          prescriptionRequired: Boolean(master.prescriptionRequired) || h1,
          isScheduleH1: h1,
        }
      };
    }

    // 3. Cache check before calling Gemini AI
    const cacheKey = cleanName.toLowerCase();
    const cached = autofillCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    if (!process.env.GEMINI_API_KEY) {
      return {
        found: false,
        source: 'UNAVAILABLE',
        message: 'Gemini API key is not configured on server. Please enter details manually.'
      };
    }

    const prompt = `You are an Indian retail pharmacy reference assistant. Given an Indian medicine brand or generic name: "${cleanName}"
Return ONLY a valid JSON object (no markdown) with accurate pharmacological metadata used in Indian medical stores:
{
  "recognized": boolean (true ONLY if "${cleanName}" is a real medicine, supplement, syrup, ointment, inhaler, drops, injection, or medical product; false if random gibberish/non-medicine),
  "genericName": "string (exact active chemical salt composition, e.g. 'Telmisartan (40mg) + Amlodipine (5mg)')",
  "manufacturer": "string (official Indian or global manufacturer company name, e.g. 'Glenmark Pharmaceuticals Ltd', or '')",
  "category": "Tablets" | "Capsules" | "Syrups" | "Injections" | "Ointments" | "Drops" | "Inhalers" | "Others",
  "strength": "string (e.g. '650 mg', '40mg + 5mg', '100 ml', or '')",
  "dosageForm": "string (e.g. 'Tablet', 'Capsule', 'Syrup', 'Cream', 'Injection')",
  "packSize": "string (standard retail strip/pack size in India, e.g. '10 tablets', '15 tablets', '1 bottle', or '')",
  "hsnCode": "string (Indian GST HSN code, usually '30049099', '30041010', '30042099', or '21069099' for nutraceuticals)",
  "gstRate": 0 | 5 | 12 | 18 (standard Indian GST slab for this product, typically 12 for most medicines, 5 for life-saving/insulin, 18 for nutraceuticals/cosmeceuticals),
  "prescriptionRequired": boolean (true for Schedule H/H1/antibiotics/cardiac/chronic Rx drugs, false for OTC),
  "isScheduleH1": boolean (true ONLY for Indian CDSCO Schedule H1 antibiotics/anti-TB/habit-forming drugs like Azithromycin, Cefixime, Levofloxacin, Alprazolam, Tramadol, Zolpidem, etc.)
}`;

    const aiResponse = await generateWithGeminiFlash([prompt], { jsonMode: true, timeoutMs: 8500 });
    if (!aiResponse) {
      return {
        found: false,
        source: 'GEMINI_AI',
        message: 'AI lookup temporarily busy. Please fill medicine details manually or retry.'
      };
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(aiResponse.text);
    } catch {
      const jsonMatch = aiResponse.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          parsed = null;
        }
      }
    }

    if (!parsed || parsed.recognized === false || !parsed.genericName) {
      return {
        found: false,
        source: 'GEMINI_AI',
        aiGenerated: true,
        message: `"${cleanName}" was not recognized as a known medicine. Please enter details manually.`
      };
    }

    const genericName = String(parsed.genericName || '').trim();
    const isH1 = Boolean(parsed.isScheduleH1) || SCHEDULE_H1_SALT_REGEX.test(genericName) || SCHEDULE_H1_SALT_REGEX.test(cleanName);
    const resultPayload = {
      found: true,
      source: 'GEMINI_AI',
      aiGenerated: true,
      model: aiResponse.modelUsed,
      disclaimer: 'AI suggested metadata — please verify Salt, GST & Strip MRP before saving.',
      medicine: {
        genericName,
        manufacturer: String(parsed.manufacturer || '').trim(),
        category: normalizeCategory(parsed.category),
        strength: String(parsed.strength || '').trim(),
        dosageForm: String(parsed.dosageForm || 'Tablet').trim(),
        packSize: String(parsed.packSize || '').trim(),
        hsnCode: String(parsed.hsnCode || '30049099').trim(),
        gstRate: normalizeGstRate(parsed.gstRate),
        prescriptionRequired: Boolean(parsed.prescriptionRequired) || isH1,
        isScheduleH1: isH1,
      }
    };

    if (autofillCache.size >= 500) {
      const firstKey = autofillCache.keys().next().value;
      if (firstKey) autofillCache.delete(firstKey);
    }
    autofillCache.set(cacheKey, { data: resultPayload, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
    return resultPayload;
  }
}
