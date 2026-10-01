import React, { useState } from 'react';
import { Plus, Trash2, Loader2, Store, IndianRupee } from 'lucide-react';
import { BillingService } from '../../services/billingService';
import { DEV_PHARMACY_ID } from '../../config/development';
import { Bill } from '../../types/billing';
import ReceiptAnimation from './ReceiptAnimation';
import { Medicine } from '../../types/medicine';
import { fetchMedicines } from '../../services/medicineService';
import MedicineSearchDropdown from '../ui/MedicineSearchDropdown';

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

  React.useEffect(() => {
    fetchMedicines().then(setCatalogue).catch(console.error);
  }, []);

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
        pharmacyId: DEV_PHARMACY_ID,
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full relative overflow-hidden">
      {/* Decorative top bar */}
      <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500 absolute top-0 left-0 right-0"></div>
      
      <div className="p-5 border-b border-slate-100 flex items-center justify-between mt-2">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <Store className="w-5 h-5 mr-2 text-emerald-500" />
          Point of Sale (POS)
        </h2>
        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border border-emerald-100">
          Walk-in
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col">
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

        <div className="flex-1 min-h-[250px]">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-bold text-slate-800">Cart Items</h4>
            
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
                <span className="text-2xl font-black text-emerald-600">₹{total.toFixed(2)}</span>
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
    </div>
  );
}
