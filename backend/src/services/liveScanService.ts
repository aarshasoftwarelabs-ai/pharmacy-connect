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
  scannedBy?: string;
  timestamp: number;
}

class LiveScanManager {
  private scansByPharmacy: Map<number, LiveScanItem[]> = new Map();

  addScan(item: Omit<LiveScanItem, 'id' | 'timestamp'>): LiveScanItem {
    const pharmacyId = Number(item.pharmacyId);
    const newItem: LiveScanItem = {
      ...item,
      pharmacyId,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now()
    };

    const existing = this.scansByPharmacy.get(pharmacyId) || [];
    // Keep only scans from the last 15 minutes and max 100 items
    const now = Date.now();
    const filtered = existing.filter(s => now - s.timestamp < 15 * 60 * 1000);
    filtered.push(newItem);
    this.scansByPharmacy.set(pharmacyId, filtered);

    return newItem;
  }

  getPendingScans(pharmacyId: number, sinceTimestamp?: number): LiveScanItem[] {
    const existing = this.scansByPharmacy.get(Number(pharmacyId)) || [];
    const now = Date.now();
    const valid = existing.filter(s => now - s.timestamp < 15 * 60 * 1000);
    if (sinceTimestamp) {
      return valid.filter(s => s.timestamp > sinceTimestamp);
    }
    return valid;
  }

  acknowledgeScan(pharmacyId: number, scanId: string): void {
    const existing = this.scansByPharmacy.get(Number(pharmacyId)) || [];
    this.scansByPharmacy.set(
      Number(pharmacyId),
      existing.filter(s => s.id !== scanId)
    );
  }

  clearPharmacyCart(pharmacyId: number): void {
    this.scansByPharmacy.delete(Number(pharmacyId));
  }
}

export const liveScanService = new LiveScanManager();
