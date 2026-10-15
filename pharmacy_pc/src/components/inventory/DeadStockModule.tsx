import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Flame, 
  Search, 
  Printer, 
  Share2, 
  RotateCcw, 
  CheckCircle, 
  Loader2, 
  TrendingDown, 
  IndianRupee, 
  Calendar, 
  Package, 
  ArrowRight, 
  ShieldAlert, 
  Tag, 
  Copy, 
  Check, 
  X,
  MessageCircle,
  Sparkles,
  Ban
} from 'lucide-react';
import { fetchDeadStock, DeadStockItem, DeadStockResponse } from '../../services/medicineService';
import { PharmacyProfile } from '../../services/pharmacyService';

interface DeadStockModuleProps {
  pharmacy?: PharmacyProfile | null;
  onOpenReturnModule?: () => void;
}

export default function DeadStockModule({ pharmacy, onOpenReturnModule }: DeadStockModuleProps) {
  const [data, setData] = useState<DeadStockResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filterMode, setFilterMode] = useState<'ALL' | 'CRITICAL_90' | 'WARNING_60' | 'NEAR_EXPIRY'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // WhatsApp Clearance Modal State
  const [clearanceMed, setClearanceMed] = useState<DeadStockItem | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [copiedText, setCopiedText] = useState(false);

  // Frozen Reorder State (Local Set of frozen IDs)
  const [frozenIds, setFrozenIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('frozen_reorder_medicine_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const loadDeadStockData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchDeadStock(30); // 30+ days inactivity
      setData(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load dead stock report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeadStockData();
  }, []);

  const toggleFreezeReorder = (id: number) => {
    setFrozenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('frozen_reorder_medicine_ids', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Filter items
  const filteredItems = (data?.items || []).filter(item => {
    // Mode filter
    if (filterMode === 'CRITICAL_90' && item.daysInactive < 90) return false;
    if (filterMode === 'WARNING_60' && (item.daysInactive < 60 || item.daysInactive >= 90)) return false;
    if (filterMode === 'NEAR_EXPIRY' && !item.isNearExpiry && !item.isExpired) return false;

    // Search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      const matchName = item.name.toLowerCase().includes(query);
      const matchGeneric = item.genericName?.toLowerCase().includes(query);
      const matchCategory = item.category?.toLowerCase().includes(query);
      const matchBarcode = item.barcode?.toLowerCase().includes(query);
      if (!matchName && !matchGeneric && !matchCategory && !matchBarcode) return false;
    }

    // Category filter
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;

    return true;
  });

  const categories = Array.from(new Set((data?.items || []).map(it => it.category).filter(Boolean)));

  const handlePrintSheet = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print dead stock report.');
      return;
    }

    const storeName = pharmacy?.name || 'K.Y Pharmacy';
    const storeAddress = pharmacy?.address || '';
    const nowStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const totalBlocked = filteredItems.reduce((sum, it) => sum + it.blockedCapital, 0);

    const rowsHtml = filteredItems.map((item, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">
          <strong>${item.name}</strong> ${item.strength || ''}<br/>
          <small style="color: #666;">${item.category} • Barcode: ${item.barcode || 'N/A'}</small>
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.currentStock} Units</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
          ${item.neverSold ? 'Never Sold' : `${item.daysInactive} days`}
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
          ${item.nearestExpiry ? new Date(item.nearestExpiry).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) : 'N/A'}
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${item.purchasePrice.toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #b91c1c;">
          ₹${item.blockedCapital.toFixed(2)}
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${item.sellingPrice.toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Dead Stock & Slow Moving Inventory Sheet - ${storeName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; }
            h1 { font-size: 20px; margin-bottom: 4px; color: #0f172a; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            .summary-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; text-align: left; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${storeName}</h1>
              <p style="margin: 0; font-size: 12px; color: #64748b;">${storeAddress}</p>
              <h2 style="font-size: 16px; margin: 8px 0 0 0; color: #dc2626;">Dead Stock & Non-Moving Inventory Audit Sheet</h2>
            </div>
            <div style="text-align: right; font-size: 12px; color: #64748b;">
              <p style="margin: 0;">Date: <strong>${nowStr}</strong></p>
              <p style="margin: 4px 0 0 0;">Items Count: <strong>${filteredItems.length}</strong></p>
            </div>
          </div>

          <div class="summary-box">
            <div><strong>Total Non-Moving Items:</strong> ${filteredItems.length} Products</div>
            <div><strong>Total Blocked Capital:</strong> <span style="color: #b91c1c; font-weight: bold; font-size: 16px;">₹${totalBlocked.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 40px;">#</th>
                <th>Medicine Name & Details</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: center;">Inactivity</th>
                <th style="text-align: center;">Expiry</th>
                <th style="text-align: right;">Cost (₹)</th>
                <th style="text-align: right;">Blocked Amt (₹)</th>
                <th style="text-align: right;">MRP (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b;">
            <div>Prepared By: Store Pharmacist</div>
            <div>Distributor Representative Signature: _______________________</div>
          </div>

          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const generateWhatsAppClearanceMessage = (med: DeadStockItem, discount: number) => {
    const discountedPrice = Math.round(med.sellingPrice * (1 - discount / 100));
    const storeName = pharmacy?.name || 'K.Y Pharmacy';
    const storePhone = pharmacy?.phone ? `Call/WhatsApp: ${pharmacy.phone}` : '';

    return `🔥 *SPECIAL CLEARANCE OFFER* from *${storeName}*! 🔥\n\n` +
      `We have a limited-time stock clearance discount on:\n` +
      `💊 *${med.name} ${med.strength || ''}*\n` +
      `🏷️ Regular MRP: ~₹${med.sellingPrice}~\n` +
      `✨ *Special Price: ₹${discountedPrice} (${discount}% OFF!)*\n` +
      `📦 Only ${med.currentStock} units available on first-come basis.\n\n` +
      `Reply *YES* to reserve your pack or visit our pharmacy today!\n${storePhone}`;
  };

  const handleOpenWhatsAppClearance = (med: DeadStockItem) => {
    const msg = generateWhatsAppClearanceMessage(med, discountPercent);
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCopyClearanceMsg = (med: DeadStockItem) => {
    const msg = generateWhatsAppClearanceMessage(med, discountPercent);
    navigator.clipboard.writeText(msg);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Dead Items */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Non-Moving Items</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {data?.summary.totalDeadItems || 0}
            </h3>
            <p className="text-xs text-amber-600 font-semibold mt-0.5">
              {data?.summary.criticalItemsCount || 0} critical (90+ days)
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Blocked Capital */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50/50 rounded-2xl p-5 border border-red-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Blocked Capital</p>
            <h3 className="text-2xl font-black text-red-600 mt-1">
              ₹{(data?.summary.totalBlockedCapital || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-xs text-red-600 font-semibold mt-0.5">
              Trapped in unsold stock
            </p>
          </div>
          <div className="p-3 bg-red-600 text-white rounded-2xl shadow-sm shadow-red-500/30">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Near Expiry Risk */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Near-Expiry Risk</p>
            <h3 className="text-2xl font-black text-purple-900 mt-1">
              ₹{(data?.summary.nearExpiryBlockedCapital || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-xs text-purple-600 font-semibold mt-0.5">
              {data?.summary.nearExpiryItemsCount || 0} items &lt; 6 months
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Potential Recovery Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Potential Clearance</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              ₹{(data?.summary.totalRetailValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">
              If sold via clearance offer
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              Dead Stock & Slow Moving Inventory
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identify non-moving medicines, liberate locked cash, and take smart clearance actions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrintSheet}
              disabled={filteredItems.length === 0}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              title="Print Dead Stock Sheet for Distributor meetings"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Export / Print Sheet
            </button>

            {onOpenReturnModule && (
              <button
                onClick={onOpenReturnModule}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Open Return Challans
              </button>
            )}

            <button
              onClick={loadDeadStockData}
              disabled={loading}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '↻ Refresh'}
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Inactivity Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterMode === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Inactive (30+ Days)
            </button>
            <button
              onClick={() => setFilterMode('CRITICAL_90')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                filterMode === 'CRITICAL_90'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
            >
              <Flame className="w-3 h-3" />
              🚨 Critical Dead (90+ Days)
            </button>
            <button
              onClick={() => setFilterMode('WARNING_60')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                filterMode === 'WARNING_60'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              ⚠️ Slow-Moving (60-90 Days)
            </button>
            <button
              onClick={() => setFilterMode('NEAR_EXPIRY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                filterMode === 'NEAR_EXPIRY'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              ⏳ Near Expiry Risk
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search dead stock..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-3" />
            <p className="text-sm font-medium">Scanning inventory for non-moving items...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="font-bold">{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Awesome! No Dead Stock Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Your inventory turnover is healthy. No items matching the current inactivity filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Medicine Name</th>
                  <th className="px-5 py-3.5 text-center">Inactivity</th>
                  <th className="px-5 py-3.5 text-center">Stock</th>
                  <th className="px-5 py-3.5 text-right">Blocked Capital</th>
                  <th className="px-5 py-3.5 text-right">Selling Value</th>
                  <th className="px-5 py-3.5 text-center">Expiry Status</th>
                  <th className="px-5 py-3.5 text-center">Smart Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => {
                  const isFrozen = frozenIds.has(item.id);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Details */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2.5">
                          <span className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                            item.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                          }`}>
                            <Package className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                              {item.strength && (
                                <span className="text-xs text-slate-500 font-medium">{item.strength}</span>
                              )}
                              {isFrozen && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                  <Ban className="w-2.5 h-2.5 text-red-500" />
                                  Reorder Frozen
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                                {item.category}
                              </span>
                              {item.barcode && (
                                <span className="font-mono text-slate-400">🏷️ {item.barcode}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Inactivity Badge */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          item.neverSold
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : item.daysInactive >= 90
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {item.neverSold ? 'Never Sold' : `${item.daysInactive}d Idle`}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {item.lastSoldAt ? `Sold ${new Date(item.lastSoldAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}` : 'Inward only'}
                        </p>
                      </td>

                      {/* Current Stock */}
                      <td className="px-5 py-4 text-center">
                        <span className="font-bold text-slate-800 text-sm">{item.currentStock}</span>
                        <span className="text-slate-400 text-[11px] block">Units</span>
                      </td>

                      {/* Blocked Capital */}
                      <td className="px-5 py-4 text-right">
                        <span className="font-mono font-black text-red-600 text-sm">
                          ₹{item.blockedCapital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-slate-400 text-[10px] block font-mono">
                          @ ₹{item.purchasePrice.toFixed(2)} cost
                        </span>
                      </td>

                      {/* Selling Value */}
                      <td className="px-5 py-4 text-right">
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          ₹{item.retailValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-slate-400 text-[10px] block font-mono">
                          MRP: ₹{item.mrp.toFixed(2)}
                        </span>
                      </td>

                      {/* Expiry Status */}
                      <td className="px-5 py-4 text-center">
                        {item.nearestExpiry ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.isExpired
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : item.isNearExpiry
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            {new Date(item.nearestExpiry).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                            {item.isNearExpiry && ` (${item.daysToExpiry}d)`}
                          </span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>

                      {/* Smart Actions */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* WhatsApp Clearance Promo */}
                          <button
                            type="button"
                            onClick={() => setClearanceMed(item)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                            title="Launch WhatsApp Clearance Broadcast"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            Offer
                          </button>

                          {/* Freeze / Unfreeze Reorder */}
                          <button
                            type="button"
                            onClick={() => toggleFreezeReorder(item.id)}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                              isFrozen
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : 'bg-slate-50 text-slate-400 hover:text-slate-700 border-slate-200'
                            }`}
                            title={isFrozen ? 'Unfreeze re-order' : 'Freeze re-order (prevents buying more)'}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WhatsApp Clearance Modal */}
      {clearanceMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm transition-all" onClick={() => setClearanceMed(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
                  <MessageCircle className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    WhatsApp Clearance Broadcast
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Convert non-moving stock into immediate cash!
                  </p>
                </div>
              </div>
              <button onClick={() => setClearanceMed(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Medicine details */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{clearanceMed.name} {clearanceMed.strength}</h4>
                  <p className="text-xs text-slate-500">Current Stock: <strong>{clearanceMed.currentStock} Units</strong></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 line-through">MRP: ₹{clearanceMed.sellingPrice}</p>
                  <p className="text-base font-extrabold text-emerald-600">
                    ₹{Math.round(clearanceMed.sellingPrice * (1 - discountPercent / 100))}
                  </p>
                </div>
              </div>

              {/* Discount Percentage Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Select Clearance Discount</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 25].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPercent(pct)}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                        discountPercent === pct
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pct}% OFF
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Broadcast Message Preview</label>
                <div className="p-3.5 bg-slate-900 text-emerald-300 font-mono text-xs rounded-2xl whitespace-pre-line leading-relaxed border border-slate-800 shadow-inner">
                  {generateWhatsAppClearanceMessage(clearanceMed, discountPercent)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopyClearanceMsg(clearanceMed)}
                  className="flex-1 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copiedText ? 'Copied!' : 'Copy Message'}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenWhatsAppClearance(clearanceMed)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  Blast on WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
