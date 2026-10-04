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
}
