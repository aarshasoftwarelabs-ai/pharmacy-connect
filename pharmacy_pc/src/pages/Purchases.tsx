import React, { useState, useEffect } from 'react';
import { PurchaseService } from '../services/purchaseService';
import { SupplierService } from '../services/supplierService';
import { Plus, Eye, Wand2, Calendar, FileText, Package, FileImage, Layers, Hash, X } from 'lucide-react';
import { fetchMedicines } from '../services/medicineService';
import MedicineSearchDropdown from '../components/ui/MedicineSearchDropdown';

export default function Purchases() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  
  // Basic form state
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<any[]>([]);

  // Item form
  const [selMed, setSelMed] = useState('');
  const [batch, setBatch] = useState('');
  const [expiry, setExpiry] = useState('');
  const [qty, setQty] = useState(0);
  const [mrp, setMrp] = useState(0);
  const [price, setPrice] = useState(0);

  const fetchInitial = async () => {
    try {
      setLoading(true);
      const [pData, sData, mData] = await Promise.all([
        PurchaseService.getPurchases(),
        SupplierService.getSuppliers(),
        fetchMedicines()
      ]);
      setPurchases(pData);
      setSuppliers(sData.filter((s:any) => s.status === 'ACTIVE'));
      setMedicines(mData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInitial(); }, []);

  const addItem = () => {
    if(!selMed || !batch || !expiry || qty <= 0 || mrp <= 0 || price <= 0) {
      alert("Please fill all item fields properly");
      return;
    }
    const med = medicines.find(m => m.id.toString() === selMed);
    setItems([...items, {
      medicine_id: med.id,
      medicine_name: med.name,
      batch_number: batch,
      expiry_date: expiry,
      quantity: qty,
      free_quantity: 0,
      purchase_price: price,
      mrp: mrp,
      selling_price: mrp,
      total_amount: price * qty
    }]);
    setSelMed(''); setBatch(''); setExpiry(''); setQty(0); setMrp(0); setPrice(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(items.length === 0) return alert("Add at least one item");
    if(!supplierId || !invoiceNumber) return alert("Fill invoice details");

    const subtotal = items.reduce((acc, curr) => acc + curr.total_amount, 0);
    try {
      await PurchaseService.createPurchase({
        supplier_id: supplierId,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        subtotal: subtotal,
        grand_total: subtotal,
        items
      });
      setShowModal(false);
      setItems([]);
      setInvoiceNumber('');
      fetchInitial();
    } catch(err:any) {
      alert(err.message);
    }
  };

  const [scanning, setScanning] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setScanning(true);
      const data = await PurchaseService.scanBill(file);
      
      // Try to find the supplier by name (case-insensitive fuzzy match)
      if (data.supplier_name) {
        const found = suppliers.find(s => s.supplier_name.toLowerCase().includes(data.supplier_name.toLowerCase()));
        if (found) setSupplierId(found.id.toString());
      }
      
      if (data.invoice_number) setInvoiceNumber(data.invoice_number);
      if (data.invoice_date) setInvoiceDate(data.invoice_date);
      
      if (data.items && data.items.length > 0) {
        const newItems = data.items.map((item: any) => {
          // Find matching medicine in our DB
          const matchedMed = medicines.find(m => m.name.toLowerCase().includes(item.medicine_name.toLowerCase()));
          return {
            medicine_id: matchedMed ? matchedMed.id : '',
            medicine_name: matchedMed ? matchedMed.name : item.medicine_name,
            batch_number: item.batch_number || '',
            expiry_date: item.expiry_date || '',
            quantity: item.quantity || 0,
            free_quantity: 0,
            purchase_price: item.purchase_price || 0,
            mrp: item.mrp || 0,
            selling_price: item.mrp || 0,
            total_amount: (item.purchase_price || 0) * (item.quantity || 0)
          };
        });
        setItems(newItems);
      }
      
      setShowModal(true);
    } catch (err: any) {
      alert(err.message || 'Failed to scan bill');
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Purchases</h1>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          {purchases.length > 0 && (
            <>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={scanning}
                className="relative overflow-hidden group flex items-center px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 disabled:opacity-70 transition-all duration-300 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 transform origin-left transition-transform duration-500 rounded-xl pointer-events-none"></div>
                {scanning ? (
                  <span className="flex items-center relative z-10"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div> Processing...</span>
                ) : (
                  <span className="flex items-center relative z-10">
                    <Wand2 className="w-4 h-4 mr-2 animate-pulse text-violet-200" />
                    AI Scan Invoice
                  </span>
                )}
              </button>
              <button onClick={() => setShowModal(true)} className="flex items-center px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 shadow-md transition-all transform hover:-translate-y-0.5">
                <Plus className="w-4 h-4 mr-2" /> Add Purchase
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-500">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="font-medium text-slate-600">Loading your purchases...</p>
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center bg-slate-50/50">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Package className="w-12 h-12 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No purchases yet</h3>
            <p className="text-slate-500 max-w-sm mb-8">Get started by creating your first wholesale purchase invoice or simply scan it using our AI OCR tool.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowModal(true)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                Enter Manually
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 flex items-center">
                <Wand2 className="w-4 h-4 mr-2" /> AI Scan Invoice
              </button>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {purchases.map(p => (
                <tr key={p.id}>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(p.invoice_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{p.invoice_number}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{p.supplier_name}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">₹{p.grand_total}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">{p.payment_status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center z-50 p-4 sm:p-6 overflow-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-auto flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-indigo-500" />
                  Create Purchase Invoice
                </h2>
                <p className="text-sm text-slate-500 mt-1">Enter details manually or use AI to extract them from an invoice image.</p>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar">
              {/* Invoice Meta */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center">Supplier</label>
                  <div className="relative">
                    <select className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none outline-none font-medium text-slate-700" value={supplierId} onChange={e=>setSupplierId(e.target.value)}>
                      <option value="">Select a supplier...</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center">Invoice Number</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Hash className="w-4 h-4" />
                    </div>
                    <input type="text" placeholder="e.g. INV-2026-001" className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700" value={invoiceNumber} onChange={e=>setInvoiceNumber(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center">Invoice Date</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 z-10">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input type="date" className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700 [color-scheme:light] relative [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" value={invoiceDate} onChange={e=>setInvoiceDate(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Add Item Box */}
              <div className="bg-gradient-to-br from-indigo-50/50 to-white p-5 rounded-2xl mb-8 border border-indigo-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <h3 className="font-bold text-slate-800 mb-4 flex items-center text-sm uppercase tracking-wider">
                  <Package className="w-4 h-4 mr-2 text-indigo-600" />
                  Add Medicine to Invoice
                </h3>
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Medicine Product</label>
                    <MedicineSearchDropdown
                      catalogue={medicines}
                      value={selMed ? medicines.find(m => m.id.toString() === selMed)?.name || selMed : ''}
                      onChange={(val, med) => {
                        setSelMed(med ? med.id.toString() : val);
                      }}
                      placeholder="Search & Select..."
                      className="w-full"
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Batch No.</label>
                    <input type="text" placeholder="BATCH123" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono" value={batch} onChange={e=>setBatch(e.target.value.toUpperCase())} />
                  </div>
                  <div className="col-span-6 md:col-span-2 relative">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Expiry</label>
                    <div className="relative">
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 z-10">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <input type="date" className="w-full pl-8 pr-1 py-2.5 bg-white border border-slate-200 rounded-xl text-xs tracking-tight focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-700 [color-scheme:light] relative [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" value={expiry} onChange={e=>setExpiry(e.target.value)} />
                    </div>
                  </div>
                  <div className="col-span-3 md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Qty</label>
                    <input type="number" placeholder="0" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" value={qty || ''} onChange={e=>setQty(Number(e.target.value))} />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Purchase (₹)</label>
                    <input type="number" placeholder="0.00" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" value={price || ''} onChange={e=>setPrice(Number(e.target.value))} />
                  </div>
                  <div className="col-span-5 md:col-span-2">
                    <button type="button" onClick={addItem} className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors shadow-sm flex items-center justify-center">
                      <Plus className="w-4 h-4 mr-1.5" /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              {items.length > 0 ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-6 bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600">Medicine Product</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600">Batch</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600">Expiry</th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-600">Quantity</th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-600">Rate</th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-600">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-4 py-3 font-medium text-slate-800 flex items-center">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 font-bold text-xs">{it.medicine_name.charAt(0)}</div>
                              {it.medicine_name}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-600 uppercase bg-slate-50 group-hover:bg-transparent transition-colors">{it.batch_number}</td>
                            <td className="px-4 py-3 text-slate-600">{it.expiry_date}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700">{it.quantity}</td>
                            <td className="px-4 py-3 text-right text-slate-500">₹{it.purchase_price.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">₹{it.total_amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200">
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-right font-semibold text-slate-600">Grand Total</td>
                          <td className="px-4 py-3 text-right font-bold text-lg text-indigo-700">
                            ₹{items.reduce((acc, curr) => acc + curr.total_amount, 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center bg-slate-50/50 mb-6 text-slate-500">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Layers className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-medium text-slate-700">No items added yet</p>
                  <p className="text-sm mt-1">Add medicines from the form above or use the AI Scan</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
              <button type="button" onClick={handleSubmit} className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center">
                Save Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
