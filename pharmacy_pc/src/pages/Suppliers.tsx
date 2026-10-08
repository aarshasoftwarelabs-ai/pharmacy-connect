import React, { useState, useEffect } from 'react';
import { SupplierService } from '../services/supplierService';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ supplier_name: '', mobile: '', city: '' });
  const [error, setError] = useState('');

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await SupplierService.getSuppliers();
      setSuppliers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await SupplierService.createSupplier(formData);
      setShowModal(false);
      setFormData({ supplier_name: '', mobile: '', city: '' });
      fetchSuppliers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this supplier?')) return;
    try {
      await SupplierService.deactivateSupplier(id);
      fetchSuppliers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 px-4 xl:px-8 pt-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pharmacy-600 to-blue-600 tracking-tight w-fit">Suppliers</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center px-5 py-2.5 bg-pharmacy-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-pharmacy-600/30 hover:bg-pharmacy-700 transition-all hover:-translate-y-0.5">
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl">{error}</div>}

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No suppliers found.</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{s.supplier_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{s.mobile || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{s.city || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button onClick={() => handleDeactivate(s.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Add Supplier</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Supplier Name *</label>
                <input required type="text" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none transition-shadow bg-slate-50 focus:bg-white" value={formData.supplier_name} onChange={e => setFormData({...formData, supplier_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mobile</label>
                <input type="text" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none transition-shadow bg-slate-50 focus:bg-white" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                <input type="text" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none transition-shadow bg-slate-50 focus:bg-white" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-pharmacy-600 text-white rounded-xl font-medium shadow-sm shadow-pharmacy-500/30 hover:bg-pharmacy-700 transition-colors">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
