import React, { useState, useEffect } from 'react';
import { PurchaseService } from '../services/purchaseService';
import { SupplierService } from '../services/supplierService';
import { Plus, Eye } from 'lucide-react';
import { fetchMedicines } from '../services/medicineService';

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
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={scanning}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {scanning ? (
              <span className="flex items-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Scanning...</span>
            ) : (
              <><span className="mr-2 text-lg">✨</span> AI Scan Bill</>
            )}
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors">
            <Plus className="w-4 h-4 mr-2" /> Add Purchase
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading...</div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No purchases found.</div>
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
        <div className="fixed inset-0 bg-black/50 flex justify-center z-50 p-6 overflow-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl my-auto">
            <h2 className="text-lg font-bold mb-4">Create Purchase Invoice</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Supplier</label>
                <select className="w-full border p-2 rounded" value={supplierId} onChange={e=>setSupplierId(e.target.value)}>
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Number</label>
                <input type="text" className="w-full border p-2 rounded" value={invoiceNumber} onChange={e=>setInvoiceNumber(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Date</label>
                <input type="date" className="w-full border p-2 rounded" value={invoiceDate} onChange={e=>setInvoiceDate(e.target.value)} />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
              <h3 className="font-semibold mb-2">Add Item</h3>
              <div className="grid grid-cols-7 gap-2 items-end">
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1">Medicine</label>
                  <select className="w-full border p-2 rounded text-sm" value={selMed} onChange={e=>setSelMed(e.target.value)}>
                    <option value="">Select Medicine</option>
                    {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Batch</label>
                  <input type="text" className="w-full border p-2 rounded text-sm uppercase" value={batch} onChange={e=>setBatch(e.target.value.toUpperCase())} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Expiry</label>
                  <input type="date" className="w-full border p-2 rounded text-sm" value={expiry} onChange={e=>setExpiry(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Qty</label>
                  <input type="number" className="w-full border p-2 rounded text-sm" value={qty} onChange={e=>setQty(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Purchase (₹)</label>
                  <input type="number" className="w-full border p-2 rounded text-sm" value={price} onChange={e=>setPrice(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">MRP (₹)</label>
                  <input type="number" className="w-full border p-2 rounded text-sm" value={mrp} onChange={e=>setMrp(Number(e.target.value))} />
                </div>
              </div>
              <button type="button" onClick={addItem} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded text-sm">Add to List</button>
            </div>

            {items.length > 0 && (
              <div className="mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left p-2">Medicine</th>
                      <th className="text-left p-2">Batch</th>
                      <th className="text-left p-2">Expiry</th>
                      <th className="text-right p-2">Qty</th>
                      <th className="text-right p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{it.medicine_name}</td>
                        <td className="p-2 font-mono text-xs">{it.batch_number}</td>
                        <td className="p-2 text-xs">{it.expiry_date}</td>
                        <td className="p-2 text-right">{it.quantity}</td>
                        <td className="p-2 text-right font-medium">₹{it.total_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded">Cancel</button>
              <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded">Save Purchase</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
