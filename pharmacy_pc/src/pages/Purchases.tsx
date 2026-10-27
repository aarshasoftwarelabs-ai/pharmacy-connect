import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PurchaseService } from '../services/purchaseService';
import { SupplierService } from '../services/supplierService';
import {
  Plus, Eye, Wand2, Calendar, FileText, Package, Layers, Hash, X,
  Search, ShieldCheck, DollarSign, Clock, Building2, CheckCircle2,
  AlertCircle, RefreshCw, Sparkles, Printer, Copy, Check, ArrowUpRight
} from 'lucide-react';
import { fetchMedicines } from '../services/medicineService';
import MedicineSearchDropdown from '../components/ui/MedicineSearchDropdown';
import CustomDatePicker from '../components/ui/CustomDatePicker';

interface PurchaseItem {
  id?: number;
  medicine_id?: string | number;
  medicine_name: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  free_quantity: number;
  purchase_price: number;
  mrp: number;
  selling_price: number;
  discount: number;
  gst_rate: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  hsn_code?: string;
}

export default function Purchases() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'PENDING'>('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // View Invoice Modal
  const [viewInvoice, setViewInvoice] = useState<any | null>(null);
  const [viewItems, setViewItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Invoice Form State
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);

  // Item Input Form State
  const [selMed, setSelMed] = useState('');
  const [medName, setMedName] = useState('');
  const [batch, setBatch] = useState('');
  const [expiry, setExpiry] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [freeQty, setFreeQty] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [mrp, setMrp] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(12);
  const [itemDiscount, setItemDiscount] = useState<number>(0);

  // AI Scanning state
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchInitial = async () => {
    try {
      setLoading(true);
      setError('');
      const [pData, sData, mData] = await Promise.all([
        PurchaseService.getPurchases(),
        SupplierService.getSuppliers(),
        fetchMedicines()
      ]);
      setPurchases(pData || []);
      setSuppliers((sData || []).filter((s: any) => s.status === 'ACTIVE'));
      setMedicines(mData || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load purchase records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitial();
  }, []);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Selected supplier details
  const selectedSupplierObj = useMemo(() => {
    return suppliers.find(s => s.id?.toString() === supplierId);
  }, [suppliers, supplierId]);

  // Auto-calculate Due Date when Supplier or Invoice Date changes
  useEffect(() => {
    if (selectedSupplierObj && invoiceDate) {
      const creditDays = selectedSupplierObj.credit_period_days || 21;
      const invD = new Date(invoiceDate);
      invD.setDate(invD.getDate() + creditDays);
      setDueDate(invD.toISOString().split('T')[0]);
    }
  }, [selectedSupplierObj, invoiceDate]);

  // Invoice Financial Totals (Real-time)
  const invoiceFinancials = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let taxableAmount = 0;
    let totalTax = 0;
    let totalQtyCount = 0;

    items.forEach(it => {
      const gross = it.purchase_price * it.quantity;
      const disc = (gross * it.discount) / 100;
      const taxable = gross - disc;
      const tax = (taxable * it.gst_rate) / 100;

      subtotal += gross;
      totalDiscount += disc;
      taxableAmount += taxable;
      totalTax += tax;
      totalQtyCount += (it.quantity + it.free_quantity);
    });

    const rawGrandTotal = taxableAmount + totalTax;
    const roundedGrandTotal = Math.round(rawGrandTotal);
    const roundOff = +(roundedGrandTotal - rawGrandTotal).toFixed(2);
    const cgstAmount = +(totalTax / 2).toFixed(2);
    const sgstAmount = +(totalTax / 2).toFixed(2);
    const balance = Math.max(0, +(roundedGrandTotal - (paidAmount || 0)).toFixed(2));
    const status = balance <= 0 ? 'PAID' : ((paidAmount || 0) > 0 ? 'PARTIAL' : 'PENDING');

    return {
      subtotal: +subtotal.toFixed(2),
      totalDiscount: +totalDiscount.toFixed(2),
      taxableAmount: +taxableAmount.toFixed(2),
      cgstAmount,
      sgstAmount,
      totalTax: +totalTax.toFixed(2),
      roundOff,
      grandTotal: roundedGrandTotal,
      balance,
      status,
      totalQtyCount
    };
  }, [items, paidAmount]);

  // Summary Metrics for top cards
  const stats = useMemo(() => {
    const totalPurchasesAmount = purchases.reduce((sum, p) => sum + (parseFloat(p.grand_total) || 0), 0);
    const totalPayable = purchases.reduce((sum, p) => sum + (parseFloat(p.balance_amount) || 0), 0);
    const paidCount = purchases.filter(p => p.payment_status === 'PAID').length;
    const paidPercentage = purchases.length > 0 ? Math.round((paidCount / purchases.length) * 100) : 100;

    return {
      totalPurchasesAmount,
      totalPayable,
      invoiceCount: purchases.length,
      paidPercentage
    };
  }, [purchases]);

  // Filtered Purchases list
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        p.invoice_number?.toLowerCase().includes(q) ||
        p.supplier_name?.toLowerCase().includes(q) ||
        p.supplier_city?.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || p.payment_status === statusFilter;
      const matchSupplier = supplierFilter === 'ALL' || p.supplier_id?.toString() === supplierFilter;

      return matchQuery && matchStatus && matchSupplier;
    });
  }, [purchases, searchQuery, statusFilter, supplierFilter]);

  const resetForm = () => {
    setSupplierId('');
    setInvoiceNumber('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setPaidAmount(0);
    setNotes('');
    setItems([]);
    setSelMed('');
    setMedName('');
    setBatch('');
    setExpiry('');
    setQty(0);
    setFreeQty(0);
    setPrice(0);
    setMrp(0);
    setGstRate(12);
    setItemDiscount(0);
  };

  const handleOpenAdd = () => {
    resetForm();
    if (suppliers.length > 0) {
      setSupplierId(suppliers[0].id.toString());
      const creditDays = suppliers[0].credit_period_days || 21;
      const invD = new Date();
      invD.setDate(invD.getDate() + creditDays);
      setDueDate(invD.toISOString().split('T')[0]);
    }
    setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
    setShowModal(true);
  };

  const addItem = () => {
    const finalMedName = medName.trim() || (selMed ? medicines.find(m => m.id.toString() === selMed)?.name : '');
    
    if (!finalMedName) {
      alert("Please select or type a medicine product name");
      return;
    }
    if (!batch.trim()) {
      alert("Please enter Batch Number");
      return;
    }
    if (!expiry) {
      alert("Please select Expiry Date");
      return;
    }
    if (qty <= 0 && freeQty <= 0) {
      alert("Quantity or Free Quantity must be greater than 0");
      return;
    }
    if (price <= 0) {
      alert("Please enter Purchase Rate (₹)");
      return;
    }

    const gross = price * qty;
    const discAmount = (gross * itemDiscount) / 100;
    const taxable = gross - discAmount;
    const taxAmount = (taxable * gstRate) / 100;
    const lineTotal = +(taxable + taxAmount).toFixed(2);

    const newItem: PurchaseItem = {
      medicine_id: selMed || '',
      medicine_name: finalMedName,
      batch_number: batch.toUpperCase().trim(),
      expiry_date: expiry,
      quantity: Number(qty),
      free_quantity: Number(freeQty) || 0,
      purchase_price: Number(price),
      mrp: Number(mrp) || Number(price),
      selling_price: Number(mrp) || Number(price),
      discount: Number(itemDiscount) || 0,
      gst_rate: Number(gstRate),
      taxable_amount: +taxable.toFixed(2),
      cgst_amount: +(taxAmount / 2).toFixed(2),
      sgst_amount: +(taxAmount / 2).toFixed(2),
      igst_amount: 0,
      total_amount: lineTotal
    };

    setItems([...items, newItem]);

    // Reset item inputs
    setSelMed('');
    setMedName('');
    setBatch('');
    setExpiry('');
    setQty(0);
    setFreeQty(0);
    setPrice(0);
    setMrp(0);
    setItemDiscount(0);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setError('Please select a Supplier');
      return;
    }
    if (!invoiceNumber.trim()) {
      setError('Please enter Invoice Number');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one medicine item to the invoice');
      return;
    }

    try {
      setError('');
      await PurchaseService.createPurchase({
        supplier_id: parseInt(supplierId),
        invoice_number: invoiceNumber.trim(),
        invoice_date: invoiceDate,
        due_date: dueDate || null,
        subtotal: invoiceFinancials.subtotal,
        discount: invoiceFinancials.totalDiscount,
        taxable_amount: invoiceFinancials.taxableAmount,
        cgst_amount: invoiceFinancials.cgstAmount,
        sgst_amount: invoiceFinancials.sgstAmount,
        igst_amount: 0,
        total_tax: invoiceFinancials.totalTax,
        round_off: invoiceFinancials.roundOff,
        grand_total: invoiceFinancials.grandTotal,
        paid_amount: paidAmount,
        balance_amount: invoiceFinancials.balance,
        payment_status: invoiceFinancials.status,
        notes: notes || null,
        items
      });

      setShowModal(false);
      resetForm();
      setSuccessMsg('✅ Purchase invoice created successfully! Stock and supplier ledger updated.');
      setTimeout(() => setSuccessMsg(''), 4000);
      await fetchInitial();
    } catch (err: any) {
      setError(err.message || 'Failed to save purchase invoice');
    }
  };

  // AI OCR Bill Scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setScanning(true);
      setError('');
      const data = await PurchaseService.scanBill(file);

      if (data.supplier_name) {
        const found = suppliers.find(s => s.supplier_name.toLowerCase().includes(data.supplier_name.toLowerCase()));
        if (found) setSupplierId(found.id.toString());
      }

      if (data.invoice_number) setInvoiceNumber(data.invoice_number);
      if (data.invoice_date) setInvoiceDate(data.invoice_date);

      if (data.items && data.items.length > 0) {
        const newItems: PurchaseItem[] = data.items.map((item: any) => {
          const matchedMed = medicines.find(m => m.name.toLowerCase().includes(item.medicine_name?.toLowerCase()));
          const p = Number(item.purchase_price) || 0;
          const q = Number(item.quantity) || 1;
          const f = Number(item.free_quantity) || 0;
          const m = Number(item.mrp) || p;
          const gst = Number(item.gst_rate) || 12;
          const disc = Number(item.discount) || 0;
          const gross = p * q;
          const discVal = (gross * disc) / 100;
          const taxable = gross - discVal;
          const taxVal = (taxable * gst) / 100;

          return {
            medicine_id: matchedMed ? matchedMed.id : '',
            medicine_name: matchedMed ? matchedMed.name : (item.medicine_name || 'Medicine Item'),
            batch_number: (item.batch_number || 'DEFAULT').toUpperCase(),
            expiry_date: item.expiry_date || new Date(Date.now() + 365*24*3600*1000).toISOString().split('T')[0],
            quantity: q,
            free_quantity: f,
            purchase_price: p,
            mrp: m,
            selling_price: m,
            discount: disc,
            gst_rate: gst,
            taxable_amount: +taxable.toFixed(2),
            cgst_amount: +(taxVal / 2).toFixed(2),
            sgst_amount: +(taxVal / 2).toFixed(2),
            igst_amount: 0,
            total_amount: +(taxable + taxVal).toFixed(2)
          };
        });
        setItems(newItems);
      }

      setShowModal(true);
      setSuccessMsg('✅ AI scan completed! Verify details and click Save Invoice.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to scan invoice image with AI');
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // View Invoice Dossier
  const handleOpenView = async (purchase: any) => {
    setViewInvoice(purchase);
    setViewItems([]);
    setLoadingItems(true);
    try {
      const itemsData = await PurchaseService.getPurchaseItems(purchase.id);
      setViewItems(itemsData || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  };

  // 1-Click Load Sample Purchase Invoices
  const handleSeedSamplePurchases = async () => {
    try {
      setIsSeeding(true);
      setError('');

      if (suppliers.length === 0) {
        setError('Please load suppliers first in the Suppliers menu');
        setIsSeeding(false);
        return;
      }

      const sg = suppliers.find(s => s.supplier_name.toLowerCase().includes('shree ganesh')) || suppliers[0];
      const ah = suppliers.find(s => s.supplier_name.toLowerCase().includes('aarav')) || suppliers[1] || suppliers[0];

      // Sample Invoice 1 from Shree Ganesh
      await PurchaseService.createPurchase({
        supplier_id: sg.id,
        invoice_number: `SG-${Math.floor(1000 + Math.random() * 9000)}`,
        invoice_date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
        due_date: new Date(Date.now() + 17 * 24 * 3600 * 1000).toISOString().split('T')[0],
        subtotal: 5850.00,
        discount: 117.00,
        taxable_amount: 5733.00,
        cgst_amount: 343.98,
        sgst_amount: 343.98,
        igst_amount: 0,
        total_tax: 687.96,
        round_off: 0.04,
        grand_total: 6421.00,
        paid_amount: 2000.00,
        balance_amount: 4421.00,
        payment_status: 'PARTIAL',
        notes: 'Cardiac & antibiotic regular stockist delivery. Delivery verified.',
        items: [
          {
            medicine_name: 'Dolo 650mg Tablets',
            batch_number: `DL${Math.floor(100 + Math.random() * 900)}`,
            expiry_date: '2027-08-31',
            quantity: 50,
            free_quantity: 5,
            purchase_price: 24.50,
            mrp: 34.00,
            selling_price: 34.00,
            discount: 2,
            gst_rate: 12,
            taxable_amount: 1200.50,
            cgst_amount: 72.03,
            sgst_amount: 72.03,
            igst_amount: 0,
            total_amount: 1344.56
          },
          {
            medicine_name: 'Augmentin 625 Duo Tablet',
            batch_number: `AUG${Math.floor(100 + Math.random() * 900)}`,
            expiry_date: '2026-12-31',
            quantity: 20,
            free_quantity: 2,
            purchase_price: 142.00,
            mrp: 205.00,
            selling_price: 205.00,
            discount: 2,
            gst_rate: 12,
            taxable_amount: 2783.20,
            cgst_amount: 166.99,
            sgst_amount: 166.99,
            igst_amount: 0,
            total_amount: 3117.18
          },
          {
            medicine_name: 'Pan 40 Gastro-Resistant Tablet',
            batch_number: `PAN${Math.floor(100 + Math.random() * 900)}`,
            expiry_date: '2027-04-30',
            quantity: 25,
            free_quantity: 2,
            purchase_price: 72.50,
            mrp: 155.00,
            selling_price: 155.00,
            discount: 2,
            gst_rate: 12,
            taxable_amount: 1749.30,
            cgst_amount: 104.96,
            sgst_amount: 104.96,
            igst_amount: 0,
            total_amount: 1959.22
          }
        ]
      });

      // Sample Invoice 2 from Aarav Healthcare
      await PurchaseService.createPurchase({
        supplier_id: ah.id,
        invoice_number: `AH-${Math.floor(1000 + Math.random() * 9000)}`,
        invoice_date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
        due_date: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString().split('T')[0],
        subtotal: 7800.00,
        discount: 156.00,
        taxable_amount: 7644.00,
        cgst_amount: 458.64,
        sgst_amount: 458.64,
        igst_amount: 0,
        total_tax: 917.28,
        round_off: -0.28,
        grand_total: 8561.00,
        paid_amount: 8561.00,
        balance_amount: 0.00,
        payment_status: 'PAID',
        notes: 'Paid via ICICI Net Banking on receipt.',
        items: [
          {
            medicine_name: 'Azithral 500mg Tablet',
            batch_number: `AZ${Math.floor(100 + Math.random() * 900)}`,
            expiry_date: '2027-06-30',
            quantity: 30,
            free_quantity: 3,
            purchase_price: 85.00,
            mrp: 132.00,
            selling_price: 132.00,
            discount: 2,
            gst_rate: 12,
            taxable_amount: 2499.00,
            cgst_amount: 149.94,
            sgst_amount: 149.94,
            igst_amount: 0,
            total_amount: 2798.88
          },
          {
            medicine_name: 'Telma 40mg Tablet',
            batch_number: `TEL${Math.floor(100 + Math.random() * 900)}`,
            expiry_date: '2027-10-31',
            quantity: 35,
            free_quantity: 3,
            purchase_price: 150.00,
            mrp: 245.00,
            selling_price: 245.00,
            discount: 2,
            gst_rate: 12,
            taxable_amount: 5145.00,
            cgst_amount: 308.70,
            sgst_amount: 308.70,
            igst_amount: 0,
            total_amount: 5762.40
          }
        ]
      });

      await fetchInitial();
      setSuccessMsg('✅ Real Gujarat pharma purchase bills created and stock synced!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to load sample invoices');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 w-full max-w-7xl mx-auto px-2 sm:px-4">
      {/* 1. Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-72 h-72 bg-pharmacy-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            DavaSetu Inward Engine • Purchase Tax Invoices
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Purchases & Stock Inward
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl font-light">
            Record medicine purchase bills from stockists with automatic batch tracking, GST tax credits, and supplier ledger reconciliation.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />

          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={scanning}
            className="flex items-center px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold backdrop-blur-md border border-white/10 transition-all hover:scale-[1.02] disabled:opacity-60"
            title="Scan physical invoice using OCR"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin text-amber-300" />
                Scanning Bill...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2 text-amber-300" />
                AI Scan Invoice
              </>
            )}
          </button>

          <button
            onClick={handleSeedSamplePurchases}
            disabled={isSeeding}
            title="Load live sample purchase invoices"
            className="flex items-center px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold backdrop-blur-md border border-white/10 transition-all hover:scale-[1.02] disabled:opacity-60"
          >
            {isSeeding ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin text-amber-300" />
                Loading Bills...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2 text-amber-300" />
                Load Sample Bills
              </>
            )}
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center px-5 py-2.5 bg-gradient-to-r from-pharmacy-500 to-emerald-500 hover:from-pharmacy-600 hover:to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Purchase
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-xs font-bold text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Error Notification Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={fetchInitial} className="text-xs font-bold text-red-600 underline">Retry</button>
        </div>
      )}

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Purchases</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              ₹{stats.totalPurchasesAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Unpaid Payables</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              ₹{stats.totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Invoices</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              {stats.invoiceCount} <span className="text-xs font-semibold text-emerald-600">Bills</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Settlement Rate</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              {stats.paidPercentage}% <span className="text-xs font-semibold text-slate-400">Paid In Full</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Invoice number, Supplier name, City..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Supplier filter */}
          <select
            value={supplierFilter}
            onChange={e => setSupplierFilter(e.target.value)}
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pharmacy-500 cursor-pointer"
          >
            <option value="ALL">All Stockists</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id.toString()}>{s.supplier_name}</option>
            ))}
          </select>

          {/* Payment status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pharmacy-500 cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="PAID">Paid Only</option>
            <option value="PARTIAL">Partial Only</option>
            <option value="PENDING">Pending Only</option>
          </select>

          <button
            onClick={fetchInitial}
            title="Refresh"
            className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Purchases Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-pharmacy-500" />
            <p className="text-sm font-medium">Fetching Purchase Invoices...</p>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-700">No purchase invoices found</p>
              <p className="text-sm text-slate-500 mt-1">Add a new invoice or click below to load real Gujarat stockist invoices.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleSeedSamplePurchases}
                disabled={isSeeding}
                className="inline-flex items-center px-5 py-2.5 bg-pharmacy-600 hover:bg-pharmacy-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-pharmacy-600/20 hover:scale-[1.02] disabled:opacity-60"
              >
                {isSeeding ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Loading Invoices...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Load Sample Purchase Bills
                  </>
                )}
              </button>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center px-5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create Manually
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Due</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice No.</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Stockist Supplier</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Taxable & Tax</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Grand Total</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPurchases.map(p => {
                  const grandTotalNum = parseFloat(p.grand_total) || 0;
                  const balanceNum = parseFloat(p.balance_amount) || 0;
                  const isPaid = p.payment_status === 'PAID';
                  const isPartial = p.payment_status === 'PARTIAL';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Date & Due */}
                      <td className="px-6 py-4 text-xs">
                        <div className="font-semibold text-slate-800">
                          {new Date(p.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        {p.due_date && (
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Due: {new Date(p.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                          </div>
                        )}
                      </td>

                      {/* Invoice No */}
                      <td className="px-6 py-4 text-xs">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                          <span>{p.invoice_number}</span>
                          <button
                            onClick={() => handleCopy(p.invoice_number, `inv_${p.id}`)}
                            title="Copy Invoice Number"
                            className="text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            {copiedKey === `inv_${p.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{p.supplier_name}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            {p.supplier_city && (
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                                {p.supplier_city}
                              </span>
                            )}
                            {p.supplier_gstin && (
                              <span className="font-mono text-[11px] text-slate-400">
                                GST: {p.supplier_gstin}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Taxable & Tax */}
                      <td className="px-6 py-4 text-xs">
                        <div className="text-slate-700 font-medium">
                          Taxable: ₹{parseFloat(p.taxable_amount || p.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          GST: ₹{parseFloat(p.total_tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </td>

                      {/* Grand Total & Balance */}
                      <td className="px-6 py-4 text-xs">
                        <div className="font-black text-slate-900 text-sm">
                          ₹{grandTotalNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        {balanceNum > 0 ? (
                          <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
                            Bal: ₹{balanceNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        ) : (
                          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                            Cleared
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : isPartial
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : 'bg-red-50 text-red-700 border border-red-200/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : isPartial ? 'bg-amber-500' : 'bg-red-500'}`} />
                          {p.payment_status || 'PENDING'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenView(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-pharmacy-50 text-slate-600 hover:text-pharmacy-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
                          title="View Tax Invoice Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Bill
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Create Purchase Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center z-50 p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pharmacy-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Create Purchase Invoice (Stock Inward)</h2>
                  <p className="text-xs text-slate-300">Automatic batch registration & supplier ledger updating</p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Section 1: Supplier & Invoice Metadata */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Supplier selector */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Distributor / Stockist <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold bg-white focus:ring-2 focus:ring-pharmacy-500 outline-none cursor-pointer"
                      value={supplierId}
                      onChange={e => setSupplierId(e.target.value)}
                    >
                      <option value="">Select Stockist Supplier...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.supplier_name} {s.city ? `(${s.city})` : ''}
                        </option>
                      ))}
                    </select>

                    {selectedSupplierObj && (
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-500">
                        {selectedSupplierObj.gstin && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-mono font-bold">
                            GST: {selectedSupplierObj.gstin}
                          </span>
                        )}
                        {selectedSupplierObj.drug_license_number && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold">
                            DL 20B/21B Verified
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-bold">
                          {selectedSupplierObj.credit_period_days || 21} Days Credit
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Invoice Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Invoice Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SG-2026-8812"
                      className="w-full uppercase font-mono border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold bg-white focus:ring-2 focus:ring-pharmacy-500 outline-none"
                      value={invoiceNumber}
                      onChange={e => setInvoiceNumber(e.target.value.toUpperCase())}
                    />
                  </div>

                  {/* Invoice Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Date</label>
                    <CustomDatePicker
                      value={invoiceDate}
                      onChange={setInvoiceDate}
                      placeholder="Select date"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Add Medicine Item Box */}
              <div className="bg-gradient-to-br from-pharmacy-50/40 via-slate-50 to-white p-5 rounded-2xl border border-pharmacy-200/60 shadow-sm relative space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-pharmacy-600" />
                    Add Medicine Item & Batch
                  </h3>
                  <span className="text-[11px] text-slate-400">Batches will be automatically linked to Inventory</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
                  {/* Medicine Selector / Input */}
                  <div className="sm:col-span-2 md:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Medicine Name</label>
                    <MedicineSearchDropdown
                      catalogue={medicines}
                      value={medName || (selMed ? medicines.find(m => m.id.toString() === selMed)?.name || '' : '')}
                      onChange={(val, med) => {
                        if (med) {
                          setSelMed(med.id.toString());
                          setMedName(med.name);
                        } else {
                          setSelMed('');
                          setMedName(val);
                        }
                      }}
                      placeholder="Search or type medicine name..."
                      className="w-full"
                    />
                  </div>

                  {/* Batch Number */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Batch No.</label>
                    <input
                      type="text"
                      placeholder="e.g. DL650B24"
                      className="w-full uppercase font-mono border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-pharmacy-500 outline-none"
                      value={batch}
                      onChange={e => setBatch(e.target.value.toUpperCase())}
                    />
                  </div>

                  {/* Expiry Date */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
                    <CustomDatePicker
                      value={expiry}
                      onChange={setExpiry}
                      placeholder="dd-mm-yyyy"
                      className="w-full"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Qty</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-xl px-2.5 py-2 text-sm bg-white focus:ring-2 focus:ring-pharmacy-500 outline-none"
                      value={qty || ''}
                      onChange={e => setQty(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                  </div>

                  {/* Free Scheme */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Free</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-xl px-2.5 py-2 text-sm bg-white focus:ring-2 focus:ring-pharmacy-500 outline-none"
                      value={freeQty || ''}
                      onChange={e => setFreeQty(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                  </div>

                  {/* Purchase Price */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Rate (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      className="w-full border border-slate-300 rounded-xl px-2.5 py-2 text-sm bg-white focus:ring-2 focus:ring-pharmacy-500 outline-none"
                      value={price || ''}
                      onChange={e => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>

                  {/* MRP */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">MRP (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      className="w-full border border-slate-300 rounded-xl px-2.5 py-2 text-sm bg-white focus:ring-2 focus:ring-pharmacy-500 outline-none"
                      value={mrp || ''}
                      onChange={e => setMrp(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-600">GST %:</span>
                      <select
                        value={gstRate}
                        onChange={e => setGstRate(parseInt(e.target.value))}
                        className="border border-slate-300 rounded-lg px-2 py-1 bg-white font-semibold outline-none cursor-pointer"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12% (Standard Pharma)</option>
                        <option value={18}>18%</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-600">Disc %:</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0"
                        value={itemDiscount || ''}
                        onChange={e => setItemDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-16 border border-slate-300 rounded-lg px-2 py-1 bg-white outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addItem}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Item
                  </button>
                </div>
              </div>

              {/* Section 3: Added Items Table */}
              {items.length > 0 ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase">Medicine Name</th>
                        <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase">Batch</th>
                        <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase">Expiry</th>
                        <th className="text-right px-4 py-3 font-bold text-slate-600 uppercase">Qty + Free</th>
                        <th className="text-right px-4 py-3 font-bold text-slate-600 uppercase">Rate (₹)</th>
                        <th className="text-right px-4 py-3 font-bold text-slate-600 uppercase">GST %</th>
                        <th className="text-right px-4 py-3 font-bold text-slate-600 uppercase">Total (₹)</th>
                        <th className="text-center px-4 py-3 font-bold text-slate-600 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">{it.medicine_name}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-700">{it.batch_number}</td>
                          <td className="px-4 py-3 text-slate-600">{it.expiry_date}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-slate-800">{it.quantity}</span>
                            {it.free_quantity > 0 && <span className="text-emerald-600 font-bold ml-1">+{it.free_quantity}F</span>}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">₹{it.purchase_price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{it.gst_rate}%</td>
                          <td className="px-4 py-3 text-right font-black text-slate-900">₹{it.total_amount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded-lg"
                              title="Remove item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-dashed border-slate-300 rounded-2xl p-8 text-center text-slate-400 space-y-2">
                  <Package className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">No medicines added to this invoice yet</p>
                  <p className="text-[11px]">Use the form above to add items or click AI Scan</p>
                </div>
              )}

              {/* Section 4: Settlement & Financials Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Amount Paid (₹) [Partial or Full]
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-pharmacy-500 outline-none"
                      value={paidAmount || ''}
                      onChange={e => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Terms</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Received via BlueDart courier, checked against PO."
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-pharmacy-500 outline-none resize-none"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Subtotal:</span>
                    <span className="font-semibold">₹{invoiceFinancials.subtotal.toFixed(2)}</span>
                  </div>
                  {invoiceFinancials.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Total Scheme Discount:</span>
                      <span className="font-semibold">-₹{invoiceFinancials.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Value:</span>
                    <span className="font-semibold">₹{invoiceFinancials.taxableAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (CGST + SGST):</span>
                    <span className="font-semibold">₹{invoiceFinancials.totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Round Off:</span>
                    <span>₹{invoiceFinancials.roundOff.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-800">Grand Total:</span>
                    <span className="font-black text-lg text-slate-900">₹{invoiceFinancials.grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                    <span className="font-semibold text-amber-700">Balance Due:</span>
                    <span className="font-bold text-amber-700">₹{invoiceFinancials.balance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>COMPLIANCE & DRUG LICENSES</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-gradient-to-r from-pharmacy-600 to-emerald-600 hover:from-pharmacy-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                >
                  Save & Update Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. View Purchase Tax Invoice Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center z-50 p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md text-emerald-400 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                      Purchase Tax Invoice
                    </span>
                    <span className="text-xs text-slate-400">Bill #{viewInvoice.id}</span>
                  </div>
                  <h2 className="text-xl font-bold">{viewInvoice.invoice_number}</h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Print Invoice"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewInvoice(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Invoice Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
              {/* Top Seller & Buyer Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Stockist Supplier Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-slate-400 uppercase tracking-wider font-bold block text-[10px]">
                    SUPPLIER / DISTRIBUTOR
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{viewInvoice.supplier_name}</p>
                  {viewInvoice.supplier_address && <p className="text-slate-600">{viewInvoice.supplier_address}</p>}
                  <p className="text-slate-600">
                    {viewInvoice.supplier_city ? `${viewInvoice.supplier_city}, ` : ''}Gujarat
                  </p>
                  {viewInvoice.supplier_gstin && (
                    <p className="font-mono text-slate-700">
                      <strong>GSTIN:</strong> {viewInvoice.supplier_gstin}
                    </p>
                  )}
                  {viewInvoice.supplier_dl && (
                    <p className="text-slate-700">
                      <strong>D.L. 20B/21B:</strong> {viewInvoice.supplier_dl}
                    </p>
                  )}
                </div>

                {/* Invoice Meta Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-slate-400 uppercase tracking-wider font-bold block text-[10px]">
                    INVOICE PARTICULARS
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice Number:</span>
                    <span className="font-mono font-bold text-slate-900">{viewInvoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice Date:</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(viewInvoice.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {viewInvoice.due_date && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Due Date:</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(viewInvoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Payment Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      viewInvoice.payment_status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : viewInvoice.payment_status === 'PARTIAL'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {viewInvoice.payment_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Medicine Items & Batches</h4>
                {loadingItems ? (
                  <div className="py-12 text-center text-slate-400">Loading invoice line items...</div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-4 py-3 font-bold text-slate-600">Medicine Product</th>
                          <th className="text-left px-4 py-3 font-bold text-slate-600">Batch No.</th>
                          <th className="text-left px-4 py-3 font-bold text-slate-600">Expiry</th>
                          <th className="text-right px-4 py-3 font-bold text-slate-600">Qty + Free</th>
                          <th className="text-right px-4 py-3 font-bold text-slate-600">Rate (₹)</th>
                          <th className="text-right px-4 py-3 font-bold text-slate-600">GST %</th>
                          <th className="text-right px-4 py-3 font-bold text-slate-600">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewItems.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="px-4 py-3 font-semibold text-slate-900">{it.medicine_name}</td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-700">{it.batch_number}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {new Date(it.expiry_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-bold text-slate-800">{it.quantity}</span>
                              {it.free_quantity > 0 && <span className="text-emerald-600 font-bold ml-1">+{it.free_quantity}F</span>}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">₹{parseFloat(it.purchase_price).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{it.gst_rate || 12}%</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">₹{parseFloat(it.total_amount).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Financial Settlement Breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 text-slate-600">
                  {viewInvoice.notes && (
                    <p><strong>Notes:</strong> {viewInvoice.notes}</p>
                  )}
                  {viewInvoice.supplier_bank && (
                    <p><strong>Bank Settlement:</strong> {viewInvoice.supplier_bank} (A/C: {viewInvoice.supplier_account})</p>
                  )}
                </div>

                <div className="space-y-1.5 text-right">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Taxable Amount:</span>
                    <span className="font-semibold text-slate-800">
                      ₹{parseFloat(viewInvoice.taxable_amount || viewInvoice.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total GST:</span>
                    <span className="font-semibold text-slate-800">
                      ₹{parseFloat(viewInvoice.total_tax || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-900">Grand Total:</span>
                    <span className="font-black text-slate-900">
                      ₹{parseFloat(viewInvoice.grand_total).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-amber-700 font-bold pt-1">
                    <span>Outstanding Due:</span>
                    <span>₹{parseFloat(viewInvoice.balance_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setViewInvoice(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
              >
                Close Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
