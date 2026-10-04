import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Store, IndianRupee } from 'lucide-react';
import { BillingService } from '../../services/billingService';
import { DEV_PHARMACY_ID } from '../../config/development';
import { Bill } from '../../types/billing';
import { B2BClient } from '../../types/wholesale';
import ReceiptAnimation from './ReceiptAnimation';
import { Medicine } from '../../types/medicine';
import { fetchMedicines } from '../../services/medicineService';
import MedicineSearchDropdown from '../ui/MedicineSearchDropdown';
import api from '../../config/api';

interface Props {
  onSuccess: () => void;
}

export default function WholesaleBillForm({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdBill, setCreatedBill] = useState<Bill | null>(null);

  const [clients, setClients] = useState<B2BClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [items, setItems] = useState([{ medicineName: '', quantity: 1, unitPrice: 0, hsnCode: '', gstRate: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('CREDIT');
  const [catalogue, setCatalogue] = useState<Medicine[]>([]);

  useEffect(() => {
    fetchMedicines().then(setCatalogue).catch(console.error);
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const pharmacyData = JSON.parse(localStorage.getItem('pharmacy_profile_data') || '{}');
      const res = await api.get(`/wholesale/clients/${pharmacyData.id}`);
      setClients(res.data.data || []);
    } catch (error) {
      console.error('Error fetching B2B clients:', error);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { medicineName: '', quantity: 1, unitPrice: 0, hsnCode: '', gstRate: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number, selectedMedicine?: Medicine) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (selectedMedicine) {
      // Prioritize wholesalePrice if it exists, fallback to sellingPrice
      newItems[index].unitPrice = (selectedMedicine as any).wholesalePrice || selectedMedicine.sellingPrice || 0;
      newItems[index].hsnCode = selectedMedicine.hsnCode || '';
      newItems[index].gstRate = selectedMedicine.gstRate || 0;
    } else if (field === 'medicineName' && typeof value === 'string') {
      const match = catalogue.find(m => m.name.toLowerCase() === value.toLowerCase());
      if (match) {
        newItems[index].unitPrice = (match as any).wholesalePrice || match.sellingPrice || 0;
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
    setSelectedClientId(null);
    setItems([{ medicineName: '', quantity: 1, unitPrice: 0, hsnCode: '', gstRate: 0 }]);
    setDiscount(0);
    setCreatedBill(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setError('Please select a B2B client.');
      return;
    }
    if (items.some(item => !item.medicineName || item.quantity <= 0 || item.unitPrice < 0)) {
      setError('Please fill all item details correctly. Quantity must be > 0 and price >= 0.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const client = clients.find(c => c.id === selectedClientId);
      
      const newBill = await BillingService.createBill({
        pharmacyId: DEV_PHARMACY_ID,
        customerName: client?.businessName || 'Wholesale Client',
        customerPhone: client?.phone || '',
        billType: 'WHOLESALE' as any,
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

      // If Payment mode is CREDIT, record a ledger entry for Udhaari
      if (paymentMode === 'CREDIT' && client) {
        await api.post(`/wholesale/clients/${client.id}/ledger`, {
          type: 'DR',
          amount: total,
          description: `Bill #${newBill.billNumber}`,
          referenceId: newBill.id
        });
      }

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
      <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 absolute top-0 left-0 right-0"></div>
      
      <div className="p-5 border-b border-slate-100 flex items-center justify-between mt-2">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <Store className="w-5 h-5 mr-2 text-blue-600" />
          Wholesale Billing
        </h2>
        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border border-blue-100">
          B2B Invoice
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col">
        {error && (
          <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 flex items-center">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Select B2B Client *</label>
            <select
              value={selectedClientId || ''}
              onChange={(e) => setSelectedClientId(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              required
            >
              <option value="" disabled>-- Select a Retailer / Hospital --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.businessName} (Bal: ₹{c.currentBalance})</option>
              ))}
            </select>
            
            {/* AI Warning System */}
            {selectedClientId && (() => {
              const client = clients.find(c => c.id === selectedClientId);
              if (!client) return null;
              
              const limit = Number(client.creditLimit);
              const balance = Number(client.currentBalance);
              if (limit > 0) {
                const utilization = balance / limit;
                if (utilization > 0.9) {
                  return (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start animate-in fade-in slide-in-from-top-1">
                      <div className="text-xl mr-3">🚨</div>
                      <div>
                        <h4 className="text-sm font-bold text-red-800">AI Credit Risk Alert: Defaulter Risk</h4>
                        <p className="text-xs text-red-600 mt-0.5">This client has exceeded 90% of their credit limit (Outstanding: ₹{balance}). AI highly recommends collecting cash or stopping further credit sales to avoid bad debts.</p>
                      </div>
                    </div>
                  );
                } else if (utilization > 0.7) {
                  return (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start animate-in fade-in slide-in-from-top-1">
                      <div className="text-xl mr-3">🟠</div>
                      <div>
                        <h4 className="text-sm font-bold text-orange-800">AI Credit Risk Alert: High Risk</h4>
                        <p className="text-xs text-orange-600 mt-0.5">This client has consumed {Math.round(utilization * 100)}% of their credit limit. Proceed with caution when offering Udhaari.</p>
                      </div>
                    </div>
                  );
                }
              }
              return (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center animate-in fade-in slide-in-from-top-1">
                  <div className="text-lg mr-2">✨</div>
                  <span className="text-xs font-semibold text-green-700">AI Analysis: Low Risk. Client is safe for credit limits.</span>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="flex-1 min-h-[250px]">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-bold text-slate-800">Cart Items (Wholesale Price)</h4>
            
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={handleAddItem}
                className="text-xs flex items-center text-white bg-blue-600 hover:bg-blue-700 font-medium px-3 py-1.5 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
              </button>
            </div>
          </div>

          <div className="space-y-3 pb-2">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-blue-200 transition-colors">
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    required
                  />
                </div>
                <div className="col-span-5 xl:col-span-2 relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-medium">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="W. Price"
                    value={item.unitPrice || ''}
                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    required
                  />
                </div>
                <div className="col-span-4 xl:col-span-2">
                  <select
                    value={item.gstRate}
                    onChange={(e) => handleItemChange(index, 'gstRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
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
            <div className="flex-1 max-w-md">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Payment Terms</h4>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {['CREDIT', 'CASH/UPI'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2 px-3 text-sm font-semibold rounded-lg border-2 transition-all ${
                      paymentMode === mode 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200'
                    }`}
                  >
                    {mode === 'CREDIT' ? 'Credit (Udhaari)' : 'Paid Now'}
                  </button>
                ))}
              </div>
              <div className="text-xs text-slate-500 bg-white p-3 border border-slate-200 rounded-lg">
                {paymentMode === 'CREDIT' 
                  ? 'Selecting Credit will add the total amount to the B2B Client\'s Khata.' 
                  : 'Selecting Paid Now means the bill is settled immediately and will not affect Khata balance.'}
              </div>
            </div>

            <div className="flex-1 max-w-md w-full">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-slate-500">Trade Discount (₹)</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  step="0.01"
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-right bg-white"
                />
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-slate-400">Total GST</span>
                <span className="text-xs font-semibold text-slate-700">₹{totalGst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-200 mb-6">
                <span className="text-lg font-bold text-slate-800">Total Payable</span>
                <span className="text-2xl font-bold text-blue-600">₹{total.toFixed(2)}</span>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-6 py-3.5 bg-blue-600 border border-transparent rounded-lg shadow-md text-base font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <IndianRupee className="w-5 h-5 mr-2" />
                )}
                Generate Wholesale Invoice
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
