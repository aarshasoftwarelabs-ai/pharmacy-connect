import { Request, Response } from 'express';
import { WholesaleService } from '../services/wholesaleService';

export class WholesaleController {
  static async addClient(req: Request, res: Response) {
    try {
      const { pharmacyId, businessName, ownerName, phone, address, gstin, dlNumber, creditLimit } = req.body;
      
      if (!pharmacyId || !businessName || !phone) {
        return res.status(400).json({ error: 'PharmacyId, Business Name and Phone are required' });
      }

      const newClient = await WholesaleService.addClient({
        pharmacyId, businessName, ownerName, phone, address, gstin, dlNumber, creditLimit
      });

      res.status(201).json({ success: true, data: newClient });
    } catch (error: any) {
      console.error('Error adding wholesale client:', error);
      res.status(500).json({ error: 'Failed to add B2B client' });
    }
  }

  static async getClients(req: Request, res: Response) {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId, 10);
      if (isNaN(pharmacyId)) {
        return res.status(400).json({ error: 'Invalid pharmacy ID' });
      }

      const clients = await WholesaleService.getClientsByPharmacy(pharmacyId);
      res.status(200).json({ success: true, data: clients });
    } catch (error: any) {
      console.error('Error fetching wholesale clients:', error);
      res.status(500).json({ error: 'Failed to fetch clients' });
    }
  }

  static async getLedger(req: Request, res: Response) {
    try {
      const clientId = parseInt(req.params.clientId, 10);
      if (isNaN(clientId)) {
        return res.status(400).json({ error: 'Invalid client ID' });
      }

      const ledger = await WholesaleService.getClientLedger(clientId);
      res.status(200).json({ success: true, data: ledger });
    } catch (error: any) {
      console.error('Error fetching client ledger:', error);
      res.status(500).json({ error: 'Failed to fetch ledger' });
    }
  }

  static async addLedgerEntry(req: Request, res: Response) {
    try {
      const clientId = parseInt(req.params.clientId, 10);
      const { type, amount, referenceId, description } = req.body;
      
      if (isNaN(clientId) || !type || amount === undefined) {
        return res.status(400).json({ error: 'Invalid request data' });
      }

      const entry = await WholesaleService.addLedgerEntry(clientId, type, amount, referenceId, description);
      res.status(201).json({ success: true, data: entry });
    } catch (error: any) {
      console.error('Error adding ledger entry:', error);
      res.status(500).json({ error: 'Failed to add ledger entry' });
    }
  }

  static async getSchemes(req: Request, res: Response) {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId, 10);
      if (isNaN(pharmacyId)) {
        return res.status(400).json({ error: 'Invalid pharmacy ID' });
      }

      const schemes = await WholesaleService.getSchemesByPharmacy(pharmacyId);
      res.status(200).json({ success: true, data: schemes });
    } catch (error: any) {
      console.error('Error fetching wholesale schemes:', error);
      res.status(500).json({ error: 'Failed to fetch schemes' });
    }
  }

  static async addScheme(req: Request, res: Response) {
    try {
      const { pharmacyId, schemeName, medicineId, minQuantity, freeQuantity, discountPercent, validUntil } = req.body;
      
      if (!pharmacyId || !schemeName) {
        return res.status(400).json({ error: 'PharmacyId and Scheme Name are required' });
      }

      const newScheme = await WholesaleService.addScheme({
        pharmacyId, schemeName, medicineId, minQuantity, freeQuantity, discountPercent, validUntil
      });

      res.status(201).json({ success: true, data: newScheme });
    } catch (error: any) {
      console.error('Error adding wholesale scheme:', error);
      res.status(500).json({ error: 'Failed to add B2B scheme' });
    }
  }
}
