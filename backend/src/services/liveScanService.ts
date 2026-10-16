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
    const rawId = Number(item.pharmacyId);
    const pharmacyId = (!rawId || isNaN(rawId)) ? 8 : rawId;
    const newItem: LiveScanItem = {
      ...item,
      pharmacyId,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now()
    };

    // Store in the requested pharmacy ID, plus mirror to 8 and 1
    const targetIds = new Set<number>([pharmacyId, 8, 1]);
    const now = Date.now();

    for (const pId of targetIds) {
      const existing = this.scansByPharmacy.get(pId) || [];
      const filtered = existing.filter(s => now - s.timestamp < 15 * 60 * 1000);
      filtered.push({ ...newItem, pharmacyId: pId });
      this.scansByPharmacy.set(pId, filtered);
    }

    return newItem;
  }

  getPendingScans(pharmacyId: number, sinceTimestamp?: number): LiveScanItem[] {
    const pId = Number(pharmacyId) || 8;
    let list = this.scansByPharmacy.get(pId) || [];
    const now = Date.now();
    list = list.filter(s => now - s.timestamp < 15 * 60 * 1000);

    // If empty, check fallback 8 or 1
    if (list.length === 0 && pId !== 8) {
      const f8 = (this.scansByPharmacy.get(8) || []).filter(s => now - s.timestamp < 15 * 60 * 1000);
      if (f8.length > 0) list = f8;
    }
    if (list.length === 0 && pId !== 1) {
      const f1 = (this.scansByPharmacy.get(1) || []).filter(s => now - s.timestamp < 15 * 60 * 1000);
      if (f1.length > 0) list = f1;
    }

    if (sinceTimestamp) {
      return list.filter(s => s.timestamp > sinceTimestamp);
    }
    return list;
  }

  acknowledgeScan(pharmacyId: number, scanId: string): void {
    const targetIds = new Set<number>([Number(pharmacyId) || 8, 8, 1]);
    for (const pId of targetIds) {
      const existing = this.scansByPharmacy.get(pId) || [];
      this.scansByPharmacy.set(
        pId,
        existing.filter(s => s.id !== scanId)
      );
    }
  }

  clearPharmacyCart(pharmacyId: number): void {
    const targetIds = new Set<number>([Number(pharmacyId) || 8, 8, 1]);
    for (const pId of targetIds) {
      this.scansByPharmacy.delete(pId);
    }
  }
}

export const liveScanService = new LiveScanManager();
