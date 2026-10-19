import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Loader2, Store, IndianRupee, Sparkles, ScanLine, X, FileImage, FileText, Barcode, CheckCircle, AlertTriangle, Camera, Scan, Search, Video, Smartphone } from 'lucide-react';
import { BillingService } from '../../services/billingService';
import { getPharmacyId } from '../../config/development';
import { Bill } from '../../types/billing';
import ReceiptAnimation from './ReceiptAnimation';
import { Medicine } from '../../types/medicine';
import { fetchMedicines, lookupMedicineByBarcode } from '../../services/medicineService';
import MedicineSearchDropdown from '../ui/MedicineSearchDropdown';
import { AudioAlert } from '../../utils/audioAlertService';
import { io } from 'socket.io-client';
import SmartScannerModal from '../common/SmartScannerModal';

interface Props {
  onSuccess: () => void;
}

export default function OfflineBillForm({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdBill, setCreatedBill] = useState<Bill | null>(null);

  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState([{ medicineName: '', quantity: 1, unitPrice: 0, hsnCode: '', gstRate: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [catalogue, setCatalogue] = useState<Medicine[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0); // 0: upload, 1: scanning, 2: success
  const [showAiModal, setShowAiModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Unified All-in-One Smart Scanner State (Barcode + QR + AI Box OCR)
  const [isSmartScannerOpen, setIsSmartScannerOpen] = useState(false);

  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeStatus, setBarcodeStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string } | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Real-Time Mobile Barcode Scanner Alert
  const [mobileScanAlert, setMobileScanAlert] = useState<{
    medicineName: string;
    quantity: number;
    unitPrice: number;
    scannedBy: string;
  } | null>(null);
  const processedScanIdsRef = useRef<Set<string>>(new Set());

  const catalogueRef = useRef<Medicine[]>([]);
  catalogueRef.current = catalogue;

  const handleIncomingMobileScan = useCallback((scanItem: any) => {
    if (!scanItem || !scanItem.medicineName) return;

    const scannedName = scanItem.medicineName.trim();
    const scannedBarcode = scanItem.barcode ? String(scanItem.barcode).trim() : '';

    // Check catalog to enrich price if 0 or missing
    const catMatch = catalogueRef.current.find(m => 
      (scannedBarcode && m.barcode && m.barcode.toLowerCase() === scannedBarcode.toLowerCase()) ||
      (m.name && m.name.toLowerCase() === scannedName.toLowerCase())
    );

    const effectivePrice = Number(scanItem.unitPrice) > 0 
      ? Number(scanItem.unitPrice) 
      : (catMatch?.sellingPrice || catMatch?.mrp || 50);
    const effectiveHsn = scanItem.hsnCode || catMatch?.hsnCode || '30049099';
    const effectiveGst = scanItem.gstRate !== undefined ? Number(scanItem.gstRate) : (catMatch?.gstRate ?? 5);

    AudioAlert.playBarcodeBeep();
    setMobileScanAlert({
      medicineName: scannedName,
      quantity: scanItem.quantity || 1,
      unitPrice: effectivePrice,
      scannedBy: scanItem.scannedBy || 'Mobile Staff/Owner'
    });
    setTimeout(() => setMobileScanAlert(null), 4500);

    setItems(prevItems => {
      // Check if this item already exists in the cart
      const existingIdx = prevItems.findIndex(it => {
        const itemLower = it.medicineName.trim().toLowerCase();
        return itemLower === scannedName.toLowerCase() || (scannedBarcode && it.hsnCode === scannedBarcode);
      });

      if (existingIdx !== -1) {
        const updated = [...prevItems];
        updated[existingIdx].quantity += (scanItem.quantity || 1);
        if (effectivePrice > 0 && (!updated[existingIdx].unitPrice || updated[existingIdx].unitPrice === 0)) {
          updated[existingIdx].unitPrice = effectivePrice;
        }
        return updated;
      }

      const newItem = {
        medicineName: scannedName,
        quantity: scanItem.quantity || 1,
        unitPrice: effectivePrice,
        hsnCode: effectiveHsn,
        gstRate: effectiveGst
      };

      // If the only item in the cart is the empty placeholder row, replace it
      if (prevItems.length === 1 && !prevItems[0].medicineName.trim()) {
        return [newItem];
      }

      return [...prevItems, newItem];
    });
  }, []);

  useEffect(() => {
    fetchMedicines().then(data => {
      setCatalogue(data);
      catalogueRef.current = data;
    }).catch(console.error);

    // Setup live socket connection to listen for mobile scans
    const pharmacyId = getPharmacyId();
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'https://pharmacy-backend-e210.onrender.com';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      socket.emit('join_pharmacy', (pharmacyId || 8).toString());
      if (pharmacyId !== 8) socket.emit('join_pharmacy', '8');
      if (pharmacyId !== 1) socket.emit('join_pharmacy', '1');
    });

    socket.on('mobile_item_scanned', (scanItem: any) => {
      if (scanItem && scanItem.medicineName) {
        if (scanItem.id) {
          if (processedScanIdsRef.current.has(scanItem.id)) return;
          processedScanIdsRef.current.add(scanItem.id);
        }
        handleIncomingMobileScan(scanItem);
      }
    });

    // Secondary resilient polling fallback: checks pending mobile scans every 1.5 seconds
    const pollPendingScans = async () => {
      try {
        const activeId = pharmacyId || 8;
        const [pActive, p8, p1] = await Promise.all([
          BillingService.getPendingLiveScans(activeId),
          activeId !== 8 ? BillingService.getPendingLiveScans(8) : Promise.resolve([]),
          activeId !== 1 ? BillingService.getPendingLiveScans(1) : Promise.resolve([])
        ]);

        const allPending = [...(pActive || []), ...(p8 || []), ...(p1 || [])];

        if (allPending.length > 0) {
          for (const scan of allPending) {
            if (scan && scan.id && !processedScanIdsRef.current.has(scan.id)) {
              processedScanIdsRef.current.add(scan.id);
              handleIncomingMobileScan(scan);
              BillingService.acknowledgeLiveScan(scan.pharmacyId || activeId, scan.id);
              if (activeId !== 8) BillingService.acknowledgeLiveScan(8, scan.id);
              if (activeId !== 1) BillingService.acknowledgeLiveScan(1, scan.id);
            }
          }
        }
      } catch (e) {
        // Silent background sync
      }
    };

    const intervalId = setInterval(pollPendingScans, 1500);
    pollPendingScans();

    return () => {
      socket.disconnect();
      clearInterval(intervalId);
    };
  }, [handleIncomingMobileScan]);

  const handleBarcodeScan = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) {
      setIsSmartScannerOpen(true);
      return;
    }

    const lowerCode = code.toLowerCase();
    // Search medicine by barcode, SKU, ID, batch number, or name (exact or substring)
    const match = catalogue.find(m => 
      (m.barcode && m.barcode.toLowerCase() === lowerCode) ||
      (m.sku && m.sku.toLowerCase() === lowerCode) ||
      (m.id && m.id.toString() === code) ||
      (m.batches && m.batches.some(b => b.batchNumber.toLowerCase() === lowerCode)) ||
      (m.name.toLowerCase() === lowerCode)
    ) || catalogue.find(m => 
      m.name.toLowerCase().includes(lowerCode) ||
      (m.genericName && m.genericName.toLowerCase().includes(lowerCode))
    );

    if (match) {
      AudioAlert.playBarcodeBeep();
      setBarcodeStatus({ 
        type: 'success', 
        message: `✓ Scanned: ${match.name} (₹${match.sellingPrice || 0})` 
      });
      setTimeout(() => setBarcodeStatus(null), 3000);

      // Check if medicine already exists in cart
      const existingIdx = items.findIndex(it => it.medicineName.toLowerCase() === match.name.toLowerCase());
      if (existingIdx !== -1) {
        const updated = [...items];
        updated[existingIdx].quantity += 1;
        setItems(updated);
      } else {
        // If the only item is empty, replace it
        if (items.length === 1 && !items[0].medicineName.trim()) {
          setItems([{
            medicineName: match.name,
            quantity: 1,
            unitPrice: match.sellingPrice || 0,
            hsnCode: match.hsnCode || '',
            gstRate: match.gstRate || 0
          }]);
        } else {
          setItems([...items, {
            medicineName: match.name,
            quantity: 1,
            unitPrice: match.sellingPrice || 0,
            hsnCode: match.hsnCode || '',
            gstRate: match.gstRate || 0
          }]);
        }
      }

      setIsSmartScannerOpen(false);
    } else {
      AudioAlert.playBarcodeBeep();
      setBarcodeStatus({ 
        type: 'idle', 
        message: `Looking up barcode "${code}"...` 
      });

      lookupMedicineByBarcode(code).then(res => {
        const auto = res?.medicine;
        const name = auto?.name || `Medicine (${code})`;
        const price = Number(auto?.sellingPrice || auto?.mrp || 50);
        const hsn = auto?.hsnCode || '30049099';
        const gst = Number(auto?.gstRate || 5);

        setBarcodeStatus({ 
          type: 'success', 
          message: `✓ Auto-added: ${name} (₹${price})` 
        });
        setTimeout(() => setBarcodeStatus(null), 3000);

        setItems(prev => {
          if (prev.length === 1 && !prev[0].medicineName.trim()) {
            return [{ medicineName: name, quantity: 1, unitPrice: price, hsnCode: hsn, gstRate: gst }];
          }
          return [...prev, { medicineName: name, quantity: 1, unitPrice: price, hsnCode: hsn, gstRate: gst }];
        });
      }).catch(() => {
        const fallbackName = `Medicine (${code})`;
        setItems(prev => [...prev, { medicineName: fallbackName, quantity: 1, unitPrice: 50, hsnCode: '30049099', gstRate: 5 }]);
      });
      setIsSmartScannerOpen(false);
    }

    setBarcodeInput('');
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Global listener for USB Barcode Scanners (rapid keyboard stroke sequence ending with Enter)
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is actively typing in a standard text field (except barcode field)
      const activeEl = document.activeElement;
      if (activeEl && activeEl !== barcodeInputRef.current && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      const now = Date.now();
      // Scanners type very quickly (< 60ms between chars)
      if (now - lastKeyTime > 120) {
        keyBuffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (keyBuffer.trim().length >= 2) {
          e.preventDefault();
          handleBarcodeScan(keyBuffer);
          keyBuffer = '';
        }
      } else if (e.key.length === 1) {
        keyBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [catalogue, items]);

  const handleAddItem = () => {
    setItems([...items, { medicineName: '', quantity: 1, unitPrice: 0, hsnCode: '', gstRate: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number, selectedMedicine?: Medicine) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill if medicine object is provided directly from the dropdown
    if (selectedMedicine) {
      newItems[index].unitPrice = selectedMedicine.sellingPrice || 0;
      newItems[index].hsnCode = selectedMedicine.hsnCode || '';
      newItems[index].gstRate = selectedMedicine.gstRate || 0;
    } else if (field === 'medicineName' && typeof value === 'string') {
      // Fallback exact match if typed manually without selecting
      const match = catalogue.find(m => m.name.toLowerCase() === value.toLowerCase());
      if (match) {
        newItems[index].unitPrice = match.sellingPrice || 0;
        newItems[index].hsnCode = match.hsnCode || '';
        newItems[index].gstRate = match.gstRate || 0;
      }
    }
    
    setItems(newItems);
  };

  let subtotal = 0;
  let totalTaxableAmount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalGst = 0;

  items.forEach(item => {
    subtotal += item.quantity * item.unitPrice;
  });

  const discountRatio = subtotal > 0 ? discount / subtotal : 0;

  const calculatedItems = items.map(item => {
    const lineAmount = item.quantity * item.unitPrice;
    const itemDiscount = lineAmount * discountRatio;
    const taxableAmount = lineAmount - itemDiscount;
    const gstRate = item.gstRate || 0;
    
    const cgst = taxableAmount * (gstRate / 2 / 100);
    const sgst = taxableAmount * (gstRate / 2 / 100);
    
    totalTaxableAmount += taxableAmount;
    totalCgst += cgst;
    totalSgst += sgst;
    totalGst += (cgst + sgst);

    return {
      ...item,
      taxableAmount,
      cgst,
      sgst,
      igst: 0
    };
  });

  const total = totalTaxableAmount + totalGst;

  const resetForm = () => {
    setCustomerName('Walk-in Customer');
    setCustomerPhone('');
    setItems([{ medicineName: '', quantity: 1, unitPrice: 0, hsnCode: '', gstRate: 0 }]);
    setDiscount(0);
    setCreatedBill(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setScanStep(1);
      setError(null);
      
      const data = await BillingService.scanPrescription(file);
      
      setScanStep(2);
      
      setTimeout(() => {
        if (data.patient_name) {
          setCustomerName(data.patient_name);
        }
        
        if (data.items && data.items.length > 0) {
          const newItems = data.items.map((item: any) => {
            const match = catalogue.find(m => m.name.toLowerCase().includes(item.medicineName?.toLowerCase() || ''));
            return {
              medicineName: match ? match.name : (item.medicineName || ''),
              quantity: item.quantity || 1,
              unitPrice: match?.sellingPrice || 0,
              hsnCode: match?.hsnCode || '',
              gstRate: match?.gstRate || 0
            };
          });
          setItems(newItems);
        }
        
        setShowAiModal(false);
        setScanStep(0);
      }, 1500);

    } catch (err: any) {
      setScanStep(0);
      setShowAiModal(false);
      setError(err.message || 'Failed to scan prescription');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (items.some(item => !item.medicineName || item.quantity <= 0 || item.unitPrice < 0)) {
      setError('Please fill all item details correctly. Quantity must be > 0 and price >= 0.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const newBill = await BillingService.createBill({
        pharmacyId: getPharmacyId(),
        customerName,
        customerPhone,
        billType: 'OFFLINE',
        subtotal,
        discount,
        total,
        totalTaxableAmount,
        totalCgst,
        totalSgst,
        totalIgst: 0,
        totalGst,
        items: calculatedItems
      });

      setCreatedBill(newBill);
    } catch (err: any) {
      setError(err.message || 'Failed to create bill');
      setLoading(false);
    }
  };

  if (createdBill) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 min-h-[400px] flex items-center justify-center">
        <ReceiptAnimation 
          bill={createdBill} 
          onClose={() => {
            resetForm();
            onSuccess();
          }} 

        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col h-full min-h-[500px] relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 pointer-events-none z-0"></div>
      
      <div className="p-6 border-b border-slate-100 flex items-center justify-between relative z-10">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <Store className="w-6 h-6 mr-3 text-emerald-500" />
          Point of Sale (POS)
        </h2>
        <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider">
          Walk-in
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col relative z-10">
        {error && (
          <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 flex items-center">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Barcode & QR Scanner Bar */}
        <div className="mb-5 p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Barcode className="w-3.5 h-3.5 text-emerald-600" />
              Scan Barcode / SKU
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-800 text-[11px] font-bold shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Smartphone className="w-3 h-3 text-emerald-700" />
              <span>Mobile Scanner Live Linked</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSmartScannerOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl shadow-md shadow-emerald-600/20 text-xs font-bold flex items-center gap-2 shrink-0 transition-all transform active:scale-95 border border-emerald-400/30"
                title="⚡ All-in-One Smart Scanner: Barcode, QR Code & AI Box Text"
              >
                <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
                <span>⚡ Smart Scanner</span>
              </button>
              <div className="flex-1 relative">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleBarcodeScan(barcodeInput);
                    }
                  }}
                  placeholder="Point Barcode Gun Scanner or type Barcode / SKU & press Enter..."
                  className="w-full pl-3 pr-20 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                />
                <div className="absolute right-1.5 top-1.5 flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (barcodeInput.trim()) {
                        handleBarcodeScan(barcodeInput);
                      } else {
                        setIsSmartScannerOpen(true);
                      }
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                    title="Scan Barcode or Open Smart Scanner"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    Scan
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Scan Status Feedback */}
          {barcodeStatus && (
            <div className={`mt-2.5 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center transition-all ${
              barcodeStatus.type === 'success' 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {barcodeStatus.type === 'success' ? (
                <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 mr-1.5 text-red-600" />
              )}
              {barcodeStatus.message}
            </div>
          )}
        </div>

        <div className="flex-1 min-h-[250px]">
          {/* Live Mobile Scan Banner Alert */}
          {mobileScanAlert && (
            <div className="mb-3.5 p-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl shadow-lg border border-emerald-400 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-emerald-200 font-extrabold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Scanned from Mobile by {mobileScanAlert.scannedBy}
                  </div>
                  <div className="text-sm font-bold">
                    {mobileScanAlert.medicineName} <span className="text-emerald-200 font-semibold">× {mobileScanAlert.quantity} (₹{mobileScanAlert.unitPrice.toFixed(2)})</span>
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 bg-white text-emerald-700 rounded-xl shadow-sm shrink-0">
                Added to Bill ✓
              </span>
            </div>
          )}

          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              Cart Items
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {items.filter(it => it.medicineName.trim()).length} Items
              </span>
            </h4>
            
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={handleAddItem}
                className="text-xs flex items-center text-white bg-emerald-600 hover:bg-emerald-700 font-medium px-3 py-1.5 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
              </button>
            </div>
          </div>

          <div className="space-y-3 pb-2">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-emerald-200 transition-colors">
                <div className="col-span-12 xl:col-span-4">
                  <MedicineSearchDropdown
                    catalogue={catalogue}
                    value={item.medicineName}
                    onChange={(val, med) => handleItemChange(index, 'medicineName', val, med)}
                    placeholder="Medicine / Product Name"
                    className="w-full"
                  />
                </div>
                <div className="col-span-3 xl:col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                    required
                  />
                </div>
                <div className="col-span-5 xl:col-span-2 relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-medium">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    value={item.unitPrice || ''}
                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                    required
                  />
                </div>
                <div className="col-span-4 xl:col-span-2">
                  <select
                    value={item.gstRate}
                    onChange={(e) => handleItemChange(index, 'gstRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
                <div className="col-span-10 xl:col-span-1 text-right text-sm font-semibold text-slate-700">
                  ₹{(item.quantity * item.unitPrice).toFixed(2)}
                </div>
                <div className="col-span-2 xl:col-span-1 flex justify-end">
                  {items.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5 mt-6 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-xl">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            {/* Left Side: Payment Details */}
            <div className="flex-1 max-w-md">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Payment Details</h4>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {['CASH', 'UPI', 'CARD'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2 px-3 text-sm font-semibold rounded-lg border-2 transition-all ${
                      paymentMode === mode 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                        : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Add Order Note (Optional)</label>
                <textarea 
                  rows={2} 
                  className="w-full text-sm border-none focus:ring-0 p-0 resize-none text-slate-700" 
                  placeholder="Any special instructions..."
                ></textarea>
              </div>
            </div>

            {/* Right Side: Totals */}
            <div className="flex-1 max-w-md w-full">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-slate-500">Discount (₹)</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  step="0.01"
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-right bg-white"
                />
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-slate-400">Taxable Amount</span>
                <span className="text-xs font-semibold text-slate-700">₹{totalTaxableAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-slate-400">Total GST</span>
                <span className="text-xs font-semibold text-slate-700">₹{totalGst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-200 mb-6">
                <span className="text-lg font-bold text-slate-800">Total Payable</span>
                <span className="text-2xl font-bold text-emerald-600">₹{total.toFixed(2)}</span>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 border border-transparent rounded-lg shadow-md text-base font-bold text-white hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <IndianRupee className="w-5 h-5 mr-2" />
                )}
                Complete Billing
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* AI Scanner Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => scanStep === 0 && setShowAiModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex justify-between items-center">
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                <h3 className="font-bold text-lg">AI Prescription Scanner</h3>
              </div>
              {scanStep === 0 && (
                <button onClick={() => setShowAiModal(false)} className="text-indigo-100 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="p-8">
              {scanStep === 0 && (
                <>
                  <input 
                    type="file" 
                    accept="image/*,application/pdf" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                  <div 
                    className="border-2 border-dashed border-indigo-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileImage className="w-8 h-8" />
                    </div>
                    <p className="font-semibold text-slate-800 text-center mb-1">Click to Upload Prescription</p>
                    <p className="text-xs text-slate-500 text-center">Supported: JPG, PNG, PDF</p>
                  </div>
                </>
              )}

              {scanStep === 1 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative mb-6">
                    <FileText className="w-20 h-20 text-indigo-200" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 rounded-full animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg mb-1">AI is analyzing...</h4>
                  <p className="text-sm text-slate-500">Extracting patient details and medicines...</p>
                  <div className="flex gap-1 mt-4">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}

              {scanStep === 2 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                    <ScanLine className="w-10 h-10" />
                  </div>
                  <h4 className="font-bold text-emerald-600 text-xl mb-1">Extraction Complete!</h4>
                  <p className="text-sm text-slate-500 text-center">Found 2 medicines.<br/>Adding to billing cart...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unified All-in-One Smart Scanner Modal (Barcode + QR + AI Box OCR) */}
      {isSmartScannerOpen && (
        <SmartScannerModal
          isOpen={isSmartScannerOpen}
          onClose={() => setIsSmartScannerOpen(false)}
          pharmacyId={getPharmacyId()}
          mode="BILLING"
          title="⚡ Smart POS Scanner (Barcode + Box OCR)"
          subtitle="સ્કેન કરો: Barcode, QR Code અથવા બોક્સનું પ્રિન્ટેડ લખાણ (Batch, Exp, MRP)"
          onBarcodeScan={(code) => {
            handleBarcodeScan(code);
          }}
          onApplyToBilling={(ocrData) => {
            setIsSmartScannerOpen(false);
            const medName = ocrData.matched_medicine?.name || ocrData.medicine_name || 'Scanned Box Medicine';
            const price = Number(ocrData.mrp) > 0 ? Number(ocrData.mrp) : (ocrData.matched_medicine?.sellingPrice || 50);
            const hsn = ocrData.matched_medicine?.hsnCode || '30049099';
            const gst = ocrData.matched_medicine?.gstRate ?? 5;

            AudioAlert.playSuccessSound();
            setItems(prevItems => {
              const existingIdx = prevItems.findIndex(it => 
                it.medicineName.trim().toLowerCase() === medName.toLowerCase()
              );
              if (existingIdx !== -1) {
                const updated = [...prevItems];
                updated[existingIdx].quantity += 1;
                return updated;
              }
              const newItem = {
                medicineName: medName,
                quantity: 1,
                unitPrice: price,
                hsnCode: hsn,
                gstRate: gst
              };
              if (prevItems.length === 1 && !prevItems[0].medicineName.trim()) {
                return [newItem];
              }
              return [...prevItems, newItem];
            });
          }}
        />
      )}
    </div>
  );
}
