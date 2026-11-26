import { API_BASE_URL, apiFetch } from '../config/api';
import { getPharmacyId } from '../config/development';
import { Bill } from '../types/billing';

export interface QueuedBill {
  localId: string;
  billData: any;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

type SyncListener = (queuedCount: number, isOnline: boolean) => void;

class OfflineSyncService {
  private static instance: OfflineSyncService;
  private readonly queueKeyPrefix = 'offline_bills_queue';
  private readonly catalogKeyPrefix = 'offline_medicines_catalog';
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;

  private constructor() {
    this.initListeners();
  }

  private getScopedKey(prefix: string): string | null {
    const pharmacyId = getPharmacyId();
    if (!pharmacyId || pharmacyId <= 0) return null;
    return `${prefix}_${pharmacyId}`;
  }

  public static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  private initListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.notifyListeners();
      this.syncQueue();
    });

    window.addEventListener('offline', () => {
      this.notifyListeners();
    });

    window.addEventListener('auth_updated', () => {
      this.notifyListeners();
    });

    // Background auto-sync worker every 25 seconds
    setInterval(() => {
      if (navigator.onLine && this.getQueue().length > 0) {
        this.syncQueue();
      }
    }, 25000);
  }

  public isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getPendingCount(), this.isOnline());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const count = this.getPendingCount();
    const online = this.isOnline();
    this.listeners.forEach(fn => fn(count, online));
  }

  // --- Catalog Cache (Strictly scoped per pharmacyId) ---
  public cacheCatalog(medicines: any[]) {
    try {
      const catalogKey = this.getScopedKey(this.catalogKeyPrefix);
      if (!catalogKey || !Array.isArray(medicines) || medicines.length === 0) return;
      localStorage.setItem(catalogKey, JSON.stringify(medicines));
    } catch (e) {
      console.warn('Failed to cache medicine catalog for offline use:', e);
    }
  }

  public getCachedCatalog(): any[] {
    try {
      const catalogKey = this.getScopedKey(this.catalogKeyPrefix);
      if (!catalogKey) return [];
      const data = localStorage.getItem(catalogKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // --- Queue Management (Strictly scoped per pharmacyId) ---
  public getQueue(): QueuedBill[] {
    try {
      const queueKey = this.getScopedKey(this.queueKeyPrefix);
      if (!queueKey) return [];
      const data = localStorage.getItem(queueKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getPendingCount(): number {
    return this.getQueue().length;
  }

  public queueBill(billData: any): Bill {
    const queueKey = this.getScopedKey(this.queueKeyPrefix);
    if (!queueKey) {
      throw new Error('Authenticated pharmacy session required to queue offline bill');
    }

    const localId = 'OFFLINE-' + Date.now().toString().slice(-6);
    const queuedItem: QueuedBill = {
      localId,
      billData,
      createdAt: new Date().toISOString(),
      retryCount: 0
    };

    const currentQueue = this.getQueue();
    currentQueue.push(queuedItem);
    try {
      localStorage.setItem(queueKey, JSON.stringify(currentQueue));
    } catch (e) {
      console.error('LocalStorage error while queuing offline bill:', e);
    }

    this.notifyListeners();

    // Construct local Bill representation for instant receipt printing
    const localBill: Bill = {
      id: localId,
      billNumber: localId,
      billType: billData.billType || 'RETAIL',
      customerName: billData.customerName || 'Walk-in Customer',
      customerPhone: billData.customerPhone || '',
      items: (billData.items || []).map((it: any) => ({
        medicineId: it.medicineId || it.id || 'offline-med',
        medicineName: it.medicineName || it.name || 'Medicine',
        quantity: Number(it.quantity || 1),
        unitPrice: Number(it.unitPrice || 0),
        mrp: Number(it.mrp || it.unitPrice || 0),
        lineTotal: Number(it.quantity || 1) * Number(it.unitPrice || 0),
        gstRate: Number(it.gstRate || 0),
        hsnCode: it.hsnCode || '300490',
        taxableAmount: Number(it.taxableAmount || 0),
        cgst: Number(it.cgst || 0),
        sgst: Number(it.sgst || 0)
      })),
      subtotal: Number(billData.subtotal || 0),
      discount: Number(billData.discount || 0),
      totalTaxableAmount: Number(billData.totalTaxableAmount || 0),
      totalCgst: Number(billData.totalCgst || 0),
      totalSgst: Number(billData.totalSgst || 0),
      totalGst: Number(billData.totalGst || 0),
      total: Number(billData.total || 0),
      paymentMode: billData.paymentMode || 'CASH',
      paymentStatus:
        billData.paymentStatus ||
        (billData.paymentMode === 'CREDIT' || billData.paymentMode === 'UDHAR' ? 'UNPAID' : 'PAID'),
      createdAt: queuedItem.createdAt,
      // Flag for UI identification
      isOfflineQueued: true
    };

    return localBill;
  }

  // --- Auto-Sync Engine ---
  public async syncQueue(): Promise<{ synced: number; remaining: number }> {
    const queueKey = this.getScopedKey(this.queueKeyPrefix);
    if (!queueKey || this.isSyncing) return { synced: 0, remaining: this.getPendingCount() };
    if (!navigator.onLine) return { synced: 0, remaining: this.getPendingCount() };

    const queue = this.getQueue();
    if (queue.length === 0) return { synced: 0, remaining: 0 };

    this.isSyncing = true;
    let syncedCount = 0;
    const remainingQueue: QueuedBill[] = [];

    for (const item of queue) {
      try {
        const response = await apiFetch(`${API_BASE_URL}/billing`, {
          method: 'POST',
          body: JSON.stringify(item.billData),
        });

        if (response.ok) {
          syncedCount++;
        } else {
          item.retryCount = (item.retryCount || 0) + 1;
          item.lastError = `Server returned status ${response.status}`;
          // Drop permanently rejected client errors (4xx except 429) after 5 retries to prevent infinite loops
          const isPermanentReject = response.status >= 400 && response.status < 500 && response.status !== 429;
          if (!isPermanentReject || item.retryCount < 5) {
            remainingQueue.push(item);
          }
        }
      } catch (err: any) {
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = err?.message || 'Network error';
        remainingQueue.push(item);
      }
    }

    try {
      localStorage.setItem(queueKey, JSON.stringify(remainingQueue));
    } catch {}

    this.isSyncing = false;
    this.notifyListeners();

    return { synced: syncedCount, remaining: remainingQueue.length };
  }
}

export const offlineSyncService = OfflineSyncService.getInstance();
