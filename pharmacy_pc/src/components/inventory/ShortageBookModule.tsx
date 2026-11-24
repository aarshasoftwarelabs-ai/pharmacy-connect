import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  MessageCircle, 
  Printer, 
  AlertCircle, 
  CheckSquare, 
  Square, 
  ArrowUpRight,
  TrendingDown,
  Building2,
  Copy,
  Check
} from 'lucide-react';
import { Medicine } from '../../types/medicine';
import { Distributor } from '../../services/distributorService';

interface ShortageBookModuleProps {
  medicines: Medicine[];
  distributors: Distributor[];
  pharmacyName?: string;
  onRefresh?: () => void;
}

export default function ShortageBookModule({ 
  medicines = [], 
  distributors = [], 
  pharmacyName = 'My Pharmacy',
  onRefresh
}: ShortageBookModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'OUT_OF_STOCK' | 'CRITICAL'>('ALL');
  const [selectedDistributor, setSelectedDistributor] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customQuantities, setCustomQuantities] = useState<Record<string, number>>({});
  const [copiedToast, setCopiedToast] = useState(false);

  // Compute all shortage medicines: stock <= minimumStock or stock <= 10
  const allShortageItems = useMemo(() => {
    return medicines.filter(m => {
      const stock = m.currentStock ?? m.stock ?? 0;
      const minStock = m.minimumStock || 10;
      return stock <= minStock;
    }).sort((a, b) => {
      const stockA = a.currentStock ?? a.stock ?? 0;
      const stockB = b.currentStock ?? b.stock ?? 0;
      return stockA - stockB; // Out of stock (0) first
    });
  }, [medicines]);

  // Filtered list based on search and sub-filter
  const filteredShortage = useMemo(() => {
    return allShortageItems.filter(m => {
      const stock = m.currentStock ?? m.stock ?? 0;
      
      if (filterType === 'OUT_OF_STOCK' && stock > 0) return false;
      if (filterType === 'CRITICAL' && stock > 5) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesGeneric = m.genericName ? m.genericName.toLowerCase().includes(q) : false;
        const matchesMfg = m.manufacturer ? m.manufacturer.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesGeneric && !matchesMfg) return false;
      }

      return true;
    });
  }, [allShortageItems, filterType, searchTerm]);

  // Default suggested order qty
  const getOrderQty = (m: Medicine): number => {
    if (customQuantities[m.id] !== undefined) {
      return customQuantities[m.id];
    }
    const stock = m.currentStock ?? m.stock ?? 0;
    const minStock = m.minimumStock || 10;
    return Math.max(10, (minStock * 2) - stock);
  };

  const handleQtyChange = (id: string, qty: number) => {
    setCustomQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, qty)
    }));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredShortage.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredShortage.map(m => m.id)));
    }
  };

  // Metrics
  const outOfStockCount = allShortageItems.filter(m => (m.currentStock ?? m.stock ?? 0) <= 0).length;
  const criticalCount = allShortageItems.filter(m => (m.currentStock ?? m.stock ?? 0) > 0 && (m.currentStock ?? m.stock ?? 0) <= 5).length;
  const totalSuggestedUnits = filteredShortage.reduce((sum, m) => sum + getOrderQty(m), 0);

  // WhatsApp Order Generator
  const generateWhatsAppMessage = () => {
    const itemsToOrder = filteredShortage.filter(m => selectedIds.size === 0 || selectedIds.has(m.id));
    if (itemsToOrder.length === 0) return '';

    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const distObj = distributors.find(d => String(d.id) === selectedDistributor);
    const distName = distObj ? distObj.name : 'Medical Distributor';

    let msg = `📋 *PHARMACY PURCHASE ORDER (SHORTAGE / કમી-બુક)*\n`;
    msg += `🏥 *Store:* ${pharmacyName}\n`;
    msg += `🏢 *Distributor:* ${distName}\n`;
    msg += `📅 *Date:* ${dateStr}\n`;
    msg += `------------------------------------------\n`;

    let totalUnits = 0;
    let estTotalCost = 0;

    itemsToOrder.forEach((m, idx) => {
      const stock = m.currentStock ?? m.stock ?? 0;
      const orderQty = getOrderQty(m);
      totalUnits += orderQty;
      const unitCost = m.purchasePrice || (m.sellingPrice * 0.75);
      estTotalCost += (unitCost * orderQty);

      const strengthInfo = m.strength ? ` [${m.strength}]` : '';
      msg += `${idx + 1}. *${m.name}${strengthInfo}* - Order Qty: *${orderQty}* (Stock: ${stock})\n`;
    });

    msg += `------------------------------------------\n`;
    msg += `*Total Items:* ${itemsToOrder.length} Medicines (${totalUnits} Units)\n`;
    msg += `*Est. Order Value:* ₹${estTotalCost.toFixed(2)}\n\n`;
    msg += `Please confirm availability and dispatch today. Thank you!`;

    return msg;
  };

  const handleSendWhatsApp = () => {
    const msg = generateWhatsAppMessage();
    if (!msg) return;

    const distObj = distributors.find(d => String(d.id) === selectedDistributor);
    const phone = distObj?.whatsappNumber ? distObj.whatsappNumber.replace(/\D/g, '') : '';

    if (phone) {
      const fullPhone = phone.length === 10 ? `91${phone}` : phone;
      window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      // Copy to clipboard
      navigator.clipboard.writeText(msg);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3500);
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const handlePrintOrder = () => {
    const itemsToOrder = filteredShortage.filter(m => selectedIds.size === 0 || selectedIds.has(m.id));
    if (itemsToOrder.length === 0) return;

    const dateStr = new Date().toLocaleDateString('en-IN');
    const distObj = distributors.find(d => String(d.id) === selectedDistributor);
    const distName = distObj ? distObj.name : 'General Distributor';

    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <html>
        <head>
          <title>Purchase Order - ${pharmacyName}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; color: #1e293b; }
            h2 { margin: 0 0 5px 0; color: #0f172a; }
            p { margin: 2px 0; font-size: 13px; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
          </style>
        </head>
        <body>
          <h2>${pharmacyName} - PURCHASE ORDER (કમી-બુક)</h2>
          <p><strong>To:</strong> ${distName} | <strong>Date:</strong> ${dateStr}</p>
          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 40px;">#</th>
                <th>Medicine Name</th>
                <th>Manufacturer / Salt</th>
                <th class="text-center">Current Stock</th>
                <th class="text-center">Min Stock</th>
                <th class="text-center">Order Qty</th>
              </tr>
            </thead>
            <tbody>
              ${itemsToOrder.map((m, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td><strong>${m.name}</strong> ${m.strength ? `[${m.strength}]` : ''}</td>
                  <td>${m.manufacturer || m.genericName || '-'}</td>
                  <td class="text-center">${m.currentStock ?? m.stock ?? 0}</td>
                  <td class="text-center">${m.minimumStock || 10}</td>
                  <td class="text-center"><strong>${getOrderQty(m)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Glance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Shortage Items</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{allShortageItems.length}</h3>
            <p className="text-xs text-amber-600 font-semibold mt-0.5">Below reorder threshold</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Out of Stock (Zero)</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{outOfStockCount}</h3>
            <p className="text-xs text-rose-500 font-semibold mt-0.5">High lost sales risk</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Stock (&le; 5)</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{criticalCount}</h3>
            <p className="text-xs text-amber-500 font-semibold mt-0.5">Urgent reorder needed</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suggested Order Units</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{totalSuggestedUnits}</h3>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">For filtered medicines</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Filters & Search */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Sub-filters */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'}`}
            >
              All Shortage ({allShortageItems.length})
            </button>
            <button
              onClick={() => setFilterType('OUT_OF_STOCK')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'OUT_OF_STOCK' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600'}`}
            >
              Out of Stock ({outOfStockCount})
            </button>
            <button
              onClick={() => setFilterType('CRITICAL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterType === 'CRITICAL' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600'}`}
            >
              Critical &le; 5 ({criticalCount})
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[220px]">
            <input
              type="text"
              placeholder="Filter by medicine or salt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Right: Distributor Target & Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {distributors.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                value={selectedDistributor}
                onChange={(e) => setSelectedDistributor(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Wholesalers</option>
                {distributors.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handlePrintOrder}
            disabled={filteredShortage.length === 0}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Print order challan"
          >
            <Printer className="w-3.5 h-3.5" /> Print Order Slip
          </button>

          <button
            onClick={handleSendWhatsApp}
            disabled={filteredShortage.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Order via WhatsApp ({selectedIds.size > 0 ? selectedIds.size : filteredShortage.length})</span>
          </button>
        </div>
      </div>

      {/* Copy Toast Feedback */}
      {copiedToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Purchase Order copied to clipboard! Opening WhatsApp...</span>
        </div>
      )}

      {/* Shortage Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredShortage.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">No Shortage Items Found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              All medicines are well-stocked above minimum levels. Great job!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4 w-10">
                    <button onClick={handleSelectAll} className="flex items-center cursor-pointer">
                      {selectedIds.size === filteredShortage.length && filteredShortage.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-4">Salt / Generic</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Min Threshold</th>
                  <th className="py-3 px-4 text-center">Suggested Order</th>
                  <th className="py-3 px-4 text-right">Est. Unit Cost</th>
                  <th className="py-3 px-4 text-right">Total Est. Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShortage.map(m => {
                  const stock = m.currentStock ?? m.stock ?? 0;
                  const minStock = m.minimumStock || 10;
                  const orderQty = getOrderQty(m);
                  const isSelected = selectedIds.has(m.id);
                  const isZero = stock <= 0;
                  const unitCost = m.purchasePrice || (m.sellingPrice * 0.75);
                  const lineCost = unitCost * orderQty;

                  return (
                    <tr 
                      key={m.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-emerald-50/30' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <button 
                          onClick={() => handleToggleSelect(m.id)} 
                          className="flex items-center cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 flex-wrap">
                          <span>{m.name}</span>
                          {m.strength && (
                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded text-[10px] font-bold">
                              {m.strength}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{m.manufacturer || 'Generic'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate" title={m.genericName}>
                        {m.genericName || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-xs ${
                          isZero 
                            ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {stock} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 font-semibold">
                        {minStock}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min="1"
                          value={orderQty}
                          onChange={(e) => handleQtyChange(m.id, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 font-medium">
                        ₹{unitCost.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                        ₹{lineCost.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
