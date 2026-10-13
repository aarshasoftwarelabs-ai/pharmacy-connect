import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  CheckSquare, 
  Square, 
  Printer, 
  Plus, 
  FileText, 
  Search, 
  ArrowRight, 
  RotateCcw, 
  Loader2, 
  IndianRupee, 
  CheckCircle2, 
  Store,
  X
} from 'lucide-react';
import { 
  fetchExpiringMedicines, 
  fetchDistributors, 
  createDistributorReturn, 
  fetchDistributorReturns,
  ExpiringMedicineItem, 
  Distributor, 
  DistributorReturn 
} from '../../services/distributorService';
import { printReturnChallan } from '../../utils/printUtils';
import { Medicine } from '../../types/medicine';

interface ExpiryReturnModuleProps {
  fallbackMedicines?: Medicine[];
  onStockUpdated?: () => void;
}

export default function ExpiryReturnModule({ fallbackMedicines = [], onStockUpdated }: ExpiryReturnModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'EXPIRING_LIST' | 'RETURN_HISTORY'>('EXPIRING_LIST');
  const [filterDays, setFilterDays] = useState<number>(90);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EXPIRED' | 'CRITICAL_30' | 'WARNING_60'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [expiringList, setExpiringList] = useState<ExpiringMedicineItem[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [returnHistory, setReturnHistory] = useState<DistributorReturn[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selected items for return challan
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  
  // Return Challan Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDistributorId, setSelectedDistributorId] = useState<number | ''>('');
  const [returnReason, setReturnReason] = useState('EXPIRED_AND_NEAR_EXPIRY');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [apiExpData, distData, histData] = await Promise.all([
        fetchExpiringMedicines(filterDays).catch(() => [] as ExpiringMedicineItem[]),
        fetchDistributors().catch(() => [] as Distributor[]),
        fetchDistributorReturns().catch(() => [] as DistributorReturn[])
      ]);

      let finalExpList = apiExpData;

      // Resilient fallback from already loaded medicines if API returned empty
      if ((!finalExpList || finalExpList.length === 0) && fallbackMedicines.length > 0) {
        const now = Date.now();
        const extracted: ExpiringMedicineItem[] = [];

        for (const m of fallbackMedicines) {
          if (m.batches && m.batches.length > 0) {
            for (const b of m.batches) {
              const expDateStr = b.expiryDate || m.expiryDate;
              if (expDateStr && ((b.availableQuantity ?? b.quantity) > 0 || m.currentStock > 0)) {
                const expMs = new Date(expDateStr).getTime();
                const diffDays = Math.ceil((expMs - now) / (1000 * 60 * 60 * 24));
                if (diffDays <= filterDays) {
                  extracted.push({
                    medicineId: Number(m.id),
                    medicineName: m.name,
                    genericName: m.genericName,
                    category: m.category,
                    manufacturer: m.manufacturer,
                    currentStock: m.currentStock,
                    batchId: b.id,
                    batchNumber: b.batchNumber || 'BATCH-DEF',
                    expiryDate: expDateStr,
                    quantity: b.availableQuantity ?? b.quantity ?? m.currentStock,
                    purchasePrice: b.purchasePrice || (m.sellingPrice * 0.7),
                    mrp: b.mrp || m.sellingPrice,
                    sellingPrice: b.sellingPrice || m.sellingPrice,
                    daysRemaining: diffDays,
                    expiryStatus: diffDays <= 0 ? 'EXPIRED' : diffDays <= 30 ? 'CRITICAL_30' : diffDays <= 60 ? 'WARNING_60' : 'UPCOMING_90'
                  });
                }
              }
            }
          } else if (m.expiryDate && m.currentStock > 0) {
            const expMs = new Date(m.expiryDate).getTime();
            const diffDays = Math.ceil((expMs - now) / (1000 * 60 * 60 * 24));
            if (diffDays <= filterDays) {
              extracted.push({
                medicineId: Number(m.id),
                medicineName: m.name,
                genericName: m.genericName,
                category: m.category,
                manufacturer: m.manufacturer,
                currentStock: m.currentStock,
                batchId: 0,
                batchNumber: 'DEFAULT',
                expiryDate: m.expiryDate,
                quantity: m.currentStock,
                purchasePrice: m.sellingPrice * 0.7,
                mrp: m.sellingPrice,
                sellingPrice: m.sellingPrice,
                daysRemaining: diffDays,
                expiryStatus: diffDays <= 0 ? 'EXPIRED' : diffDays <= 30 ? 'CRITICAL_30' : diffDays <= 60 ? 'WARNING_60' : 'UPCOMING_90'
              });
            }
          }
        }
        finalExpList = extracted.sort((a, b) => a.daysRemaining - b.daysRemaining);
      }

      setExpiringList(finalExpList);
      setDistributors(distData);
      setReturnHistory(histData);
    } catch (err: any) {
      setError(err.message || 'Failed to load expiry data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterDays, fallbackMedicines.length]);

  const getItemKey = (item: ExpiringMedicineItem) => `${item.medicineId}-${item.batchNumber}`;

  const toggleSelect = (item: ExpiringMedicineItem) => {
    const key = getItemKey(item);
    const updated = new Set(selectedKeys);
    if (updated.has(key)) {
      updated.delete(key);
    } else {
      updated.add(key);
    }
    setSelectedKeys(updated);
  };

  const toggleSelectAll = (filteredItems: ExpiringMedicineItem[]) => {
    if (selectedKeys.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedKeys(new Set());
    } else {
      const allKeys = new Set(filteredItems.map(getItemKey));
      setSelectedKeys(allKeys);
    }
  };

  const filteredItems = expiringList.filter(item => {
    const matchesSearch = item.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.genericName && item.genericName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'EXPIRED') {
      return matchesSearch && item.daysRemaining <= 0;
    } else if (statusFilter === 'CRITICAL_30') {
      return matchesSearch && item.daysRemaining > 0 && item.daysRemaining <= 30;
    } else if (statusFilter === 'WARNING_60') {
      return matchesSearch && item.daysRemaining > 30 && item.daysRemaining <= 60;
    }
    return matchesSearch;
  });

  const selectedItemsList = expiringList.filter(it => selectedKeys.has(getItemKey(it)));
  const totalSelectedQty = selectedItemsList.reduce((sum, it) => sum + (it.quantity || 0), 0);
  const totalSelectedValue = selectedItemsList.reduce((sum, it) => sum + ((it.quantity || 0) * (it.purchasePrice || 0)), 0);

  // Stats
  const expiredCount = expiringList.filter(m => m.daysRemaining <= 0).length;
  const expiredValue = expiringList.filter(m => m.daysRemaining <= 0).reduce((s, m) => s + (m.quantity * m.purchasePrice), 0);
  const critical30Count = expiringList.filter(m => m.daysRemaining > 0 && m.daysRemaining <= 30).length;
  const critical30Value = expiringList.filter(m => m.daysRemaining > 0 && m.daysRemaining <= 30).reduce((s, m) => s + (m.quantity * m.purchasePrice), 0);
  const totalUpcomingValue = expiringList.reduce((s, m) => s + (m.quantity * m.purchasePrice), 0);

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemsList.length === 0) return;

    try {
      setSubmittingReturn(true);
      const payloadItems = selectedItemsList.map(it => ({
        medicineId: it.medicineId,
        batchId: it.batchId,
        medicineName: it.medicineName,
        batchNumber: it.batchNumber,
        expiryDate: it.expiryDate,
        quantity: it.quantity,
        purchasePrice: it.purchasePrice,
        reason: it.daysRemaining <= 0 ? 'EXPIRED' : 'NEAR_EXPIRY'
      }));

      const challanNumber = `RET-${Date.now().toString().slice(-6)}`;
      const result = await createDistributorReturn({
        distributorId: selectedDistributorId ? Number(selectedDistributorId) : undefined,
        challanNumber,
        returnDate: new Date().toISOString().split('T')[0],
        reason: returnReason,
        items: payloadItems
      });

      // Find distributor name for print
      const dist = distributors.find(d => d.id === selectedDistributorId);
      const printData = {
        ...result,
        distributorName: dist?.name || 'Selected Distributor'
      };

      setSuccessMessage(`Challan #${challanNumber} created! Stock updated.`);
      setIsModalOpen(false);
      setSelectedKeys(new Set());
      await loadData();
      onStockUpdated?.();

      // Offer immediate print
      setTimeout(() => {
        if (window.confirm('Return Challan created! Would you like to print the return slip now?')) {
          printReturnChallan(printData);
        }
      }, 300);

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to generate return challan');
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2.5 text-amber-500" />
            Expiry Alert & Return to Distributor
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Track expired medicines and generate official Return Challans (Debit Notes) to reclaim payments from distributors.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-xl self-stretch sm:self-auto">
          <button
            onClick={() => setActiveSubTab('EXPIRING_LIST')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'EXPIRING_LIST'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚠️ Expiring Medicines ({expiringList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('RETURN_HISTORY')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'RETURN_HISTORY'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Return Challans History ({returnHistory.length})
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center shadow-sm">
          <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600 shrink-0" />
          <span className="font-bold text-sm">{successMessage}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-red-50/60 p-5 rounded-2xl border border-red-200 shadow-xs">
          <div className="flex justify-between items-center text-red-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Already Expired</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-900">{expiredCount} Batches</div>
          <p className="text-xs text-red-600 mt-1 font-semibold">Total Loss: ₹{expiredValue.toFixed(2)}</p>
        </div>

        <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex justify-between items-center text-amber-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Critical (≤ 30 Days)</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-900">{critical30Count} Batches</div>
          <p className="text-xs text-amber-600 mt-1 font-semibold">Risk Value: ₹{critical30Value.toFixed(2)}</p>
        </div>

        <div className="bg-indigo-50/60 p-5 rounded-2xl border border-indigo-200 shadow-xs">
          <div className="flex justify-between items-center text-indigo-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total At-Risk Stock</span>
            <Calendar className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-900">₹{totalUpcomingValue.toFixed(2)}</div>
          <p className="text-xs text-indigo-600 mt-1 font-semibold">Across {expiringList.length} items</p>
        </div>

        <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex justify-between items-center text-emerald-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Generated Challans</span>
            <FileText className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-900">{returnHistory.length} Slips</div>
          <p className="text-xs text-emerald-600 mt-1 font-semibold">Returned to Distributors</p>
        </div>
      </div>

      {activeSubTab === 'EXPIRING_LIST' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase">Window:</span>
              {[30, 60, 90].map(days => (
                <button
                  key={days}
                  onClick={() => setFilterDays(days)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterDays === days 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Within {days} Days
                </button>
              ))}

              <div className="h-4 w-px bg-slate-300 mx-1"></div>

              <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('EXPIRED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'EXPIRED' ? 'bg-red-600 text-white' : 'bg-white text-red-600 border border-red-200'
                }`}
              >
                🚨 Expired Only
              </button>
              <button
                onClick={() => setStatusFilter('CRITICAL_30')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'CRITICAL_30' ? 'bg-amber-600 text-white' : 'bg-white text-amber-600 border border-amber-200'
                }`}
              >
                ⚠️ ≤ 30 Days
              </button>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search medicine / batch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <button
                type="button"
                onClick={() => loadData()}
                disabled={loading}
                title="Refresh Expiry List"
                className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all shadow-xs disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
              <p className="text-sm font-semibold">Scanning inventory batches...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
              <h4 className="text-lg font-bold text-slate-800">All clear! No medicines expiring in this window.</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">Your store stock is fresh and well within expiry dates.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-10">
                      <button 
                        onClick={() => toggleSelectAll(filteredItems)}
                        className="text-slate-400 hover:text-indigo-600 flex items-center"
                      >
                        {selectedKeys.size === filteredItems.length && filteredItems.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4">Medicine Name</th>
                    <th className="py-3.5 px-4">Batch No</th>
                    <th className="py-3.5 px-4">Expiry Date</th>
                    <th className="py-3.5 px-4 text-center">Days Remaining</th>
                    <th className="py-3.5 px-4 text-right">Available Qty</th>
                    <th className="py-3.5 px-4 text-right">Purchase Rate</th>
                    <th className="py-3.5 px-4 text-right">Return Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredItems.map(item => {
                    const isSelected = selectedKeys.has(getItemKey(item));
                    const isExpired = item.daysRemaining <= 0;
                    const isCritical = item.daysRemaining > 0 && item.daysRemaining <= 30;

                    return (
                      <tr 
                        key={getItemKey(item)}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <button 
                            type="button"
                            onClick={() => toggleSelect(item)}
                            className="text-slate-400 hover:text-indigo-600 flex items-center"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{item.medicineName}</div>
                          <div className="text-xs text-slate-400">{item.category || item.genericName || 'General Product'}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-700">
                          {item.batchNumber}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                          {new Date(item.expiryDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isExpired ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                              Expired ({Math.abs(item.daysRemaining)}d ago)
                            </span>
                          ) : isCritical ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              {item.daysRemaining} days left
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                              {item.daysRemaining} days left
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                          {item.quantity} Units
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-600 font-medium">
                          ₹{Number(item.purchasePrice).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          ₹{(item.quantity * item.purchasePrice).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Sticky Bottom Action Bar when items selected */}
          {selectedKeys.size > 0 && (
            <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-20 shadow-2xl">
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-white/20 rounded-lg text-xs font-bold">
                  {selectedKeys.size} Items Selected
                </span>
                <span className="text-sm">
                  Total Units: <strong className="text-emerald-400">{totalSelectedQty}</strong>
                </span>
                <span className="text-sm">
                  Total Debit Claim: <strong className="text-emerald-400">₹{totalSelectedValue.toFixed(2)}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedKeys(new Set())}
                  className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Clear Selection
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg transition-all text-sm"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Generate Distributor Return Challan
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Return Challans History View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h4 className="font-bold text-slate-800 text-sm">Past Return Slips (Debit Notes)</h4>
            <span className="text-xs text-slate-500">{returnHistory.length} Recorded Returns</span>
          </div>

          {returnHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No return challans generated yet.</p>
              <p className="text-xs text-slate-400 mt-1">Select expired medicines from the list to issue your first return slip.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {returnHistory.map(challan => (
                <div key={challan.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-extrabold text-slate-900 text-base">{challan.challanNumber}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                        {challan.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600">
                      Distributor: <strong className="text-slate-900">{challan.distributorName || challan.supplierName || 'General Agency'}</strong>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Date: {new Date(challan.returnDate || challan.createdAt).toLocaleDateString()} • {challan.items?.length || 0} Products ({challan.totalItems} Units)
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-400 uppercase">Debit Amount</span>
                      <p className="text-lg font-black text-slate-900">₹{Number(challan.totalAmount).toFixed(2)}</p>
                    </div>

                    <button
                      onClick={() => printReturnChallan(challan)}
                      className="flex items-center px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition-colors border border-indigo-200"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5" />
                      Print Slip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Return Challan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="p-5 bg-gradient-to-r from-red-600 to-rose-600 text-white flex justify-between items-center">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-red-200">B2B Inventory Return</span>
                <h4 className="text-lg font-black">Generate Distributor Return Challan</h4>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChallan} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Distributor / Supplier Agency
                </label>
                <select
                  value={selectedDistributorId}
                  onChange={(e) => setSelectedDistributorId(Number(e.target.value) || '')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">-- Choose Distributor --</option>
                  {distributors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.whatsappNumber ? `(${d.whatsappNumber})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Return Reason
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="EXPIRED_STOCK">Expired Stock Return</option>
                  <option value="NEAR_EXPIRY">Near Expiry (Next 30-60 Days)</option>
                  <option value="DAMAGED_OR_BROKEN">Damaged / Leakage / Breakage</option>
                  <option value="RECALL_BY_COMPANY">Batch Recall by Manufacturer</option>
                </select>
              </div>

              {/* Summary of items */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                  <span>Selected Medicines ({selectedItemsList.length}):</span>
                  <span>{totalSelectedQty} Total Units</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar text-xs">
                  {selectedItemsList.map(it => (
                    <div key={getItemKey(it)} className="flex justify-between py-1 border-b border-slate-100 text-slate-700">
                      <span className="truncate pr-2 font-medium">{it.medicineName} ({it.batchNumber})</span>
                      <span className="font-bold">Qty: {it.quantity} • ₹{(it.quantity * it.purchasePrice).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-2.5 mt-2.5 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-800">Total Debit Claim:</span>
                  <span className="font-extrabold text-red-600 text-lg">₹{totalSelectedValue.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Note: Saving this will automatically deduct these returned units from your store stock and create an official printable debit challan slip.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {submittingReturn ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Printer className="w-4 h-4 mr-2" />}
                  Confirm & Print Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
