import React, { useState } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { BillingQueueItem, Bill } from '../../types/billing';
import { BillingService } from '../../services/billingService';
import { getPharmacyId } from '../../config/development';
import ReceiptAnimation from './ReceiptAnimation';
import { Medicine } from '../../types/medicine';
import { fetchMedicines } from '../../services/medicineService';

interface Props {
  queueItem: BillingQueueItem;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BillCreationModal({ queueItem, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdBill, setCreatedBill] = useState<Bill | null>(null);

  const [items, setItems] = useState([{ medicineName: queueItem.medicineName || '', quantity: 1, unitPrice: 0, hsnCode: '', gstRate: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [catalogue, setCatalogue] = useState<Medicine[]>([]);

  React.useEffect(() => {
    fetchMedicines().then(setCatalogue).catch(console.error);
  }, []);

  const handleAddItem = () => {
    setItems([...items, { medicineName: '', quantity: 1, unitPrice: 0, hsnCode: '', gstRate: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill if medicine name changes
    if (field === 'medicineName' && typeof value === 'string') {
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
    
    // Assuming intra-state (CGST + SGST)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some(item => !item.medicineName || item.quantity <= 0 || item.unitPrice < 0)) {
      setError('Please fill all item details correctly. Quantity must be > 0 and price >= 0.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const newBill = await BillingService.createBill({
        medicineRequestId: queueItem.id,
        userId: queueItem.userId,
        pharmacyId: getPharmacyId(),
        customerName: queueItem.customerName,
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-slate-900/75 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative inline-block w-full max-w-2xl text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl border border-slate-200">
          {createdBill ? (
            <ReceiptAnimation 
              bill={createdBill} 
              onClose={() => onSuccess()} 
            />
          ) : (
            <>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Create Bill</h3>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">Customer Name</label>
                <div className="mt-1 p-2 bg-slate-50 rounded-md text-slate-900 font-medium">
                  {queueItem.customerName}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Request Date</label>
                <div className="mt-1 p-2 bg-slate-50 rounded-md text-slate-900 font-medium">
                  {new Date(queueItem.confirmedAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold text-slate-900">Bill Items</h4>
                <button 
                  type="button" 
                  onClick={handleAddItem}
                  className="text-xs flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Medicine Name"
                        value={item.medicineName}
                        onChange={(e) => handleItemChange(index, 'medicineName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        required
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        required
                      />
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price (₹)"
                        value={item.unitPrice || ''}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        required
                      />
                    </div>
                    <div className="w-24">
                      <select
                        value={item.gstRate}
                        onChange={(e) => handleItemChange(index, 'gstRate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </div>
                    {items.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md mt-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 mb-6">
              <div className="flex justify-between text-sm">
                <div className="w-1/2 pr-4 border-r border-slate-200 text-slate-500">
                  <div className="flex justify-between mb-1"><span>Taxable Amount:</span> <span className="font-medium text-slate-900">₹{totalTaxableAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between mb-1"><span>CGST:</span> <span className="font-medium text-slate-900">₹{totalCgst.toFixed(2)}</span></div>
                  <div className="flex justify-between mb-1"><span>SGST:</span> <span className="font-medium text-slate-900">₹{totalSgst.toFixed(2)}</span></div>
                  <div className="flex justify-between mb-1"><span>Total GST:</span> <span className="font-medium text-slate-900">₹{totalGst.toFixed(2)}</span></div>
                </div>
                <div className="w-1/2 pl-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-medium text-slate-900">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500">Discount:</span>
                    <input
                      type="number"
                      min="0"
                      max={subtotal}
                      step="0.01"
                      value={discount || ''}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-right"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-base font-bold text-slate-900">Grand Total:</span>
                    <span className="text-xl font-bold text-indigo-600">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Finalize Bill
              </button>
            </div>
          </form>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
