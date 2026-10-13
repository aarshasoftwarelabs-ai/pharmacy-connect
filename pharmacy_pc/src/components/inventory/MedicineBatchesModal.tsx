import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Tag, 
  Calendar, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Loader2, 
  Package, 
  ShieldCheck,
  Copy,
  Check,
  Barcode as BarcodeIcon,
  IndianRupee
} from 'lucide-react';
import { Medicine } from '../../types/medicine';
import { BatchService, BatchItem } from '../../services/batchService';
import BarcodeStickerModal from './BarcodeStickerModal';

interface MedicineBatchesModalProps {
  medicine: Medicine;
  pharmacyName?: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function MedicineBatchesModal({
  medicine,
  pharmacyName = 'K.Y Pharmacy',
  isOpen,
  onClose,
  onUpdate
}: MedicineBatchesModalProps) {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Batch Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Form Fields
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState<number>(medicine.currentStock > 0 ? medicine.currentStock : 50);
  const [purchasePrice, setPurchasePrice] = useState<number>(Math.round((medicine.sellingPrice || 100) * 0.75));
  const [mrp, setMrp] = useState<number>(medicine.mrp || Math.round((medicine.sellingPrice || 100) * 1.15));
  const [sellingPrice, setSellingPrice] = useState<number>(medicine.sellingPrice || 100);
  const [barcode, setBarcode] = useState(medicine.barcode || '');

  // Sticker Modal State
  const [stickerBatch, setStickerBatch] = useState<BatchItem | null>(null);
  const [copiedBatchId, setCopiedBatchId] = useState<number | null>(null);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await BatchService.getBatchesByMedicine(medicine.id);
      setBatches(data);
    } catch (err: any) {
      console.error(err);
      // Fallback to batches prop if available
      if (medicine.batches && medicine.batches.length > 0) {
        setBatches(medicine.batches.map(b => ({
          ...b,
          medicineId: Number(medicine.id),
          pharmacyId: Number(medicine.pharmacyId || 1)
        })));
      } else {
        setBatches([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBatches();
      resetForm();
    }
  }, [isOpen, medicine.id]);

  const resetForm = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setBatchNumber(`B25-${randomSuffix}`);
    // Default expiry 18 months from today
    const exp = new Date();
    exp.setMonth(exp.getMonth() + 18);
    setExpiryDate(exp.toISOString().split('T')[0]);
    setQuantity(medicine.currentStock > 0 ? medicine.currentStock : 50);
    setPurchasePrice(Math.round((medicine.sellingPrice || 100) * 0.75));
    setMrp(medicine.mrp || Math.round((medicine.sellingPrice || 100) * 1.15));
    setSellingPrice(medicine.sellingPrice || 100);
    setBarcode(medicine.barcode || `890${String(medicine.pharmacyId || 1).padStart(3, '0').slice(-3)}${String(medicine.id).padStart(5, '0').slice(-5)}0`);
    setShowAddForm(false);
  };

  const handleAutoGenerateBatchNo = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setBatchNumber(`B25-${randomSuffix}`);
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNumber.trim() || !expiryDate) {
      alert('Batch number and expiry date are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await BatchService.createBatch({
        medicineId: Number(medicine.id),
        batchNumber: batchNumber.trim().toUpperCase(),
        expiryDate,
        quantity: Number(quantity) || 0,
        purchasePrice: Number(purchasePrice) || 0,
        mrp: Number(mrp) || Number(sellingPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        barcode: barcode.trim() || undefined
      });
      await fetchBatches();
      onUpdate();
      setShowAddForm(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitializeDefaultBatch = async () => {
    try {
      setIsInitializing(true);
      await BatchService.initializeMissingBatches(medicine.id);
      await fetchBatches();
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Failed to initialize batch');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDeleteBatch = async (batchId: number, batchNo: string) => {
    if (!window.confirm(`Are you sure you want to delete batch "${batchNo}"?`)) return;
    try {
      await BatchService.deleteBatch(batchId);
      await fetchBatches();
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Failed to delete batch');
    }
  };

  const handleCopyBarcode = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedBatchId(id);
    setTimeout(() => setCopiedBatchId(null), 2000);
  };

  if (!isOpen) return null;

  const totalBatchStock = batches.reduce((sum, b) => sum + (Number(b.availableQuantity) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm transition-all" onClick={onClose}>
      <div 
        className="bg-white rounded-[2rem] shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-purple-50/30 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
                <Package className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  Medicine Batches
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                    {batches.length} {batches.length === 1 ? 'Batch' : 'Batches'}
                  </span>
                </h3>
                <p className="text-sm text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                  <span className="text-slate-800 font-bold">{medicine.name}</span>
                  {medicine.strength && <span>• {medicine.strength}</span>}
                  <span className="text-slate-400">|</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-semibold">
                    Total Stock: {totalBatchStock || medicine.currentStock} units
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add New Batch
              </button>
            )}
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add Batch Inline Form */}
          {showAddForm && (
            <div className="p-5 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-white rounded-2xl border border-indigo-200 shadow-sm transition-all animate-in fade-in">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Register New Batch for {medicine.name}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateBatch} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Batch Number */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">Batch Number *</label>
                      <button
                        type="button"
                        onClick={handleAutoGenerateBatchNo}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        🪄 Auto
                      </button>
                    </div>
                    <input
                      type="text"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. B25-101"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Quantity (Units) *</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Purchase Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* MRP */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">MRP (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={mrp}
                      onChange={(e) => setMrp(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-emerald-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Barcode */}
                <div className="pt-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batch Barcode (Optional - auto inherits medicine barcode)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="e.g. 890123456789"
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setBarcode(`890${String(medicine.pharmacyId || 1).padStart(3, '0').slice(-3)}${String(medicine.id).padStart(5, '0').slice(-5)}${Math.floor(Math.random() * 10)}`)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Save Batch & Update Stock
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Batches Table or Empty State */}
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
              <p className="text-sm font-medium">Loading batch records...</p>
            </div>
          ) : batches.length === 0 ? (
            /* EMPTY STATE CARD (Fixes user issue!) */
            <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-slate-50/50 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <Package className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">
                No active batches recorded for {medicine.name}
              </h4>
              <p className="text-sm text-slate-500 max-w-md mt-1 mb-6">
                You have <span className="font-bold text-slate-700">{medicine.currentStock} units</span> in overall stock, but no specific batch number or expiry tracking is registered yet.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleInitializeDefaultBatch}
                  disabled={isInitializing}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isInitializing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  )}
                  ⚡ Auto-Initialize Batch from Stock ({medicine.currentStock || 50} Units)
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  + Add Custom Batch
                </button>
              </div>
            </div>
          ) : (
            /* BATCHES TABLE */
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 font-bold text-slate-700">Batch Number</th>
                    <th className="px-5 py-3 font-bold text-slate-700">Barcode</th>
                    <th className="px-5 py-3 font-bold text-slate-700">Expiry Date</th>
                    <th className="px-5 py-3 font-bold text-slate-700 text-right">Available Qty</th>
                    <th className="px-5 py-3 font-bold text-slate-700 text-right">Purchase (₹)</th>
                    <th className="px-5 py-3 font-bold text-slate-700 text-right">MRP (₹)</th>
                    <th className="px-5 py-3 font-bold text-slate-700 text-right">Selling (₹)</th>
                    <th className="px-5 py-3 font-bold text-slate-700 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {batches.map((batch) => {
                    const expDateObj = new Date(batch.expiryDate);
                    const now = new Date();
                    const isExpired = expDateObj < now;
                    const diffDays = Math.ceil((expDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const isExpiringSoon = !isExpired && diffDays <= 90;
                    const batchBarcode = batch.barcode || medicine.barcode || 'N/A';

                    return (
                      <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Batch Number */}
                        <td className="px-5 py-3.5">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md text-xs border border-slate-200">
                            {batch.batchNumber}
                          </span>
                        </td>

                        {/* Barcode */}
                        <td className="px-5 py-3.5 font-mono text-xs">
                          {batchBarcode !== 'N/A' ? (
                            <button
                              type="button"
                              onClick={() => handleCopyBarcode(batchBarcode, batch.id)}
                              className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 px-2 py-0.5 rounded border border-slate-200"
                              title="Click to copy barcode"
                            >
                              <BarcodeIcon className="w-3.5 h-3.5 text-slate-400" />
                              <span>{batchBarcode}</span>
                              {copiedBatchId === batch.id ? (
                                <Check className="w-3 h-3 text-emerald-600 ml-0.5" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400 ml-0.5" />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Expiry Date */}
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                            isExpired 
                              ? 'bg-red-100 text-red-700 border border-red-200' 
                              : isExpiringSoon 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            {expDateObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            {isExpired && ' (Expired)'}
                            {isExpiringSoon && ` (${diffDays}d left)`}
                          </span>
                        </td>

                        {/* Available Qty */}
                        <td className="px-5 py-3.5 text-right font-extrabold text-slate-800">
                          <span className={batch.availableQuantity <= 10 ? 'text-amber-600' : 'text-slate-800'}>
                            {batch.availableQuantity}
                          </span>
                          <span className="text-slate-400 text-xs font-normal ml-1">/ {batch.quantity}</span>
                        </td>

                        {/* Purchase Price */}
                        <td className="px-5 py-3.5 text-right text-slate-600 font-mono text-xs">
                          ₹{Number(batch.purchasePrice || 0).toFixed(2)}
                        </td>

                        {/* MRP */}
                        <td className="px-5 py-3.5 text-right text-slate-700 font-mono font-bold text-xs">
                          ₹{Number(batch.mrp || 0).toFixed(2)}
                        </td>

                        {/* Selling Price */}
                        <td className="px-5 py-3.5 text-right text-emerald-700 font-mono font-bold text-xs">
                          ₹{Number(batch.sellingPrice || 0).toFixed(2)}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Print Sticker for this batch */}
                            <button
                              type="button"
                              onClick={() => setStickerBatch(batch)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition-colors"
                              title="Print Barcode Sticker for this Batch"
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Batch */}
                            <button
                              type="button"
                              onClick={() => handleDeleteBatch(batch.id, batch.batchNumber)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold border border-red-200 transition-colors"
                              title="Delete Batch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            💡 Scan any batch barcode gun at the counter to auto-select this batch during billing.
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Specific Batch Sticker Modal */}
      {stickerBatch && (
        <BarcodeStickerModal
          medicine={{
            ...medicine,
            barcode: stickerBatch.barcode || medicine.barcode,
            sellingPrice: stickerBatch.sellingPrice || medicine.sellingPrice,
            batches: [stickerBatch as any]
          }}
          pharmacyName={pharmacyName}
          isOpen={!!stickerBatch}
          onClose={() => setStickerBatch(null)}
        />
      )}
    </div>
  );
}
