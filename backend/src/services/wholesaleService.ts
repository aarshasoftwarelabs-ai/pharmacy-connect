import pool from '../config/database';

export interface B2BClient {
  id: number;
  pharmacyId: number;
  businessName: string;
  ownerName?: string;
  phone: string;
  address?: string;
  gstin?: string;
  dlNumber?: string;
  creditLimit: number;
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
}

export class WholesaleService {
  // Create a new B2B Client
  static async addClient(clientData: Partial<B2BClient>): Promise<B2BClient | null> {
    const query = `
      INSERT INTO b2b_clients (pharmacy_id, business_name, owner_name, phone, address, gstin, dl_number, credit_limit)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, pharmacy_id AS "pharmacyId", business_name AS "businessName", owner_name AS "ownerName", 
                phone, address, gstin, dl_number AS "dlNumber", credit_limit AS "creditLimit", 
                current_balance AS "currentBalance", created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const values = [
      clientData.pharmacyId, clientData.businessName, clientData.ownerName, clientData.phone,
      clientData.address, clientData.gstin, clientData.dlNumber, clientData.creditLimit || 0
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  // Get all B2B Clients for a pharmacy
  static async getClientsByPharmacy(pharmacyId: number): Promise<B2BClient[]> {
    const query = `
      SELECT id, pharmacy_id AS "pharmacyId", business_name AS "businessName", owner_name AS "ownerName", 
             phone, address, gstin, dl_number AS "dlNumber", credit_limit AS "creditLimit", 
             current_balance AS "currentBalance", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM b2b_clients
      WHERE pharmacy_id = $1
      ORDER BY business_name ASC
    `;
    const result = await pool.query(query, [pharmacyId]);
    return result.rows;
  }

  // Get Ledgers for a client
  static async getClientLedger(clientId: number) {
    const query = `
      SELECT id, b2b_client_id AS "b2bClientId", transaction_type AS "transactionType", amount,
             reference_id AS "referenceId", description, transaction_date AS "transactionDate"
      FROM b2b_ledgers
      WHERE b2b_client_id = $1
      ORDER BY transaction_date DESC
    `;
    const result = await pool.query(query, [clientId]);
    return result.rows;
  }

  // Add Ledger Entry
  static async addLedgerEntry(clientId: number, type: 'DR' | 'CR', amount: number, referenceId?: number, description?: string) {
    const clientQuery = await pool.query('SELECT current_balance FROM b2b_clients WHERE id = $1', [clientId]);
    if (clientQuery.rows.length === 0) throw new Error('Client not found');

    const entryQuery = `
      INSERT INTO b2b_ledgers (b2b_client_id, transaction_type, amount, reference_id, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(entryQuery, [clientId, type, amount, referenceId, description]);

    // Update Client Balance
    const balanceQuery = `
      UPDATE b2b_clients
      SET current_balance = current_balance ${type === 'DR' ? '+' : '-'} $2
      WHERE id = $1
    `;
    await pool.query(balanceQuery, [clientId, amount]);

    return result.rows[0];
  }

  // Get Trade Schemes for a pharmacy
  static async getSchemesByPharmacy(pharmacyId: number) {
    const query = `
      SELECT s.id, s.pharmacy_id AS "pharmacyId", s.scheme_name AS "schemeName",
             s.medicine_id AS "medicineId", m.name AS "medicineName",
             s.min_quantity AS "minQuantity", s.free_quantity AS "freeQuantity",
             s.discount_percent AS "discountPercent", s.is_active AS "isActive",
             s.valid_until AS "validUntil", s.created_at AS "createdAt"
      FROM b2b_schemes s
      LEFT JOIN medicines m ON s.medicine_id = m.id
      WHERE s.pharmacy_id = $1
      ORDER BY s.created_at DESC
    `;
    const result = await pool.query(query, [pharmacyId]);
    return result.rows;
  }

  // Add Trade Scheme
  static async addScheme(schemeData: any) {
    const query = `
      INSERT INTO b2b_schemes (pharmacy_id, scheme_name, medicine_id, min_quantity, free_quantity, discount_percent, valid_until)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, pharmacy_id AS "pharmacyId", scheme_name AS "schemeName",
                medicine_id AS "medicineId", min_quantity AS "minQuantity",
                free_quantity AS "freeQuantity", discount_percent AS "discountPercent",
                is_active AS "isActive", valid_until AS "validUntil"
    `;
    const values = [
      schemeData.pharmacyId,
      schemeData.schemeName,
      schemeData.medicineId || null,
      schemeData.minQuantity || 1,
      schemeData.freeQuantity || 0,
      schemeData.discountPercent || 0,
      schemeData.validUntil || null
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get AI Smart Recommendations (Most frequently bought items by the client)
  static async getAiRecommendations(clientId: number) {
    const query = `
      SELECT bi.medicine_name AS "medicineName", COUNT(*) as freq, 
             MAX(bi.unit_price) AS "lastPrice", MAX(b.created_at) AS "lastBought"
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE b.b2b_client_id = $1
      GROUP BY bi.medicine_name
      ORDER BY freq DESC, "lastBought" DESC
      LIMIT 5
    `;
    const result = await pool.query(query, [clientId]);
    
    // If client is new and has no history, provide generic fast-moving wholesale items
    if (result.rows.length === 0) {
      return [
        { medicineName: 'Dolo 650 Tablet', freq: 0, lastPrice: 25.50 },
        { medicineName: 'Azithral 500 Tablet', freq: 0, lastPrice: 110.00 },
        { medicineName: 'Pan 40 Tablet', freq: 0, lastPrice: 130.00 },
        { medicineName: 'Calpol 500 Tablet', freq: 0, lastPrice: 15.00 },
        { medicineName: 'Augmentin 625 Duo Tablet', freq: 0, lastPrice: 180.00 }
      ];
    }
    
    return result.rows;
  }
}
