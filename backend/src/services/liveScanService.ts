export interface LiveScanItem {
  id: string;
  pharmacyId: number;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  barcode?: string;
  hsnCode?: string;
  gstRate?: number;
  mrp?: number;
  batchNumber?: string;
  expiryDate?: string;
  mfgDate?: string;
  packSize?: string;
  mfgLicNo?: string;
  isOcrScan?: boolean;
  scannedBy?: string;
  timestamp: number;
}

class LiveScanManager {
  private scansByPharmacy: Map<number, LiveScanItem[]> = new Map();

  private assertValidPharmacyId(pharmacyId: number): number {
    const pId = Number(pharmacyId);
    if (!Number.isInteger(pId) || pId <= 0) {
      throw new Error('Valid authenticated pharmacyId is required for live scan');
    }
    return pId;
  }

  addScan(item: Omit<LiveScanItem, 'id' | 'timestamp'>): LiveScanItem {
    const pharmacyId = this.assertValidPharmacyId(item.pharmacyId);
    const now = Date.now();
    const newItem: LiveScanItem = {
      ...item,
      pharmacyId,
      id: `${now}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now
    };

    const existing = this.scansByPharmacy.get(pharmacyId) || [];
    const filtered = existing.filter(s => now - s.timestamp < 15 * 60 * 1000);
    filtered.push(newItem);
    this.scansByPharmacy.set(pharmacyId, filtered);

    return newItem;
  }

  getPendingScans(pharmacyId: number, sinceTimestamp?: number): LiveScanItem[] {
    const pId = this.assertValidPharmacyId(pharmacyId);
    const now = Date.now();
    const list = (this.scansByPharmacy.get(pId) || []).filter(
      s => now - s.timestamp < 15 * 60 * 1000
    );

    if (sinceTimestamp) {
      return list.filter(s => s.timestamp > sinceTimestamp);
    }
    return list;
  }

  acknowledgeScan(pharmacyId: number, scanId: string): void {
    const pId = this.assertValidPharmacyId(pharmacyId);
    const existing = this.scansByPharmacy.get(pId) || [];
    this.scansByPharmacy.set(
      pId,
      existing.filter(s => s.id !== scanId)
    );
  }

  clearPharmacyCart(pharmacyId: number): void {
    const pId = this.assertValidPharmacyId(pharmacyId);
    this.scansByPharmacy.delete(pId);
  }
}

export const liveScanService = new LiveScanManager();
