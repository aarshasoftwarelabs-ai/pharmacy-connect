import { useState, useEffect } from 'react';
import { Truck, Plus, Mail, MessageCircle, MoreVertical, Edit2, Trash2, X, MapPin } from 'lucide-react';
import { Distributor, fetchDistributors, createDistributor, updateDistributor, deleteDistributor } from '../../services/distributorService';

export default function DistributorSettings() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState<Distributor | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsappNumber: '',
    address: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchDistributors();
      setDistributors(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load distributors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingDistributor(null);
    setFormData({ name: '', email: '', whatsappNumber: '', address: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (d: Distributor) => {
    setEditingDistributor(d);
    setFormData({
      name: d.name,
      email: d.email || '',
      whatsappNumber: d.whatsappNumber || '',
      address: d.address || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingDistributor) {
        await updateDistributor(editingDistributor.id, formData);
      } else {
        await createDistributor(formData);
      }
      await loadData();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save distributor');
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to remove this distributor?')) {
      try {
        setLoading(true);
        await deleteDistributor(id);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete distributor');
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center">
            <Truck className="w-4 h-4 mr-2 text-pharmacy-600" />
            Wholesalers & Distributors
          </h3>
          <p className="text-xs text-slate-500 mt-1">Manage your suppliers for Auto-Ordering</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center px-3 py-1.5 bg-pharmacy-100 text-pharmacy-700 hover:bg-pharmacy-200 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" /> Add New
        </button>
      </div>

      <div className="p-6">
        {error && <div className="text-sm text-red-600 mb-4 bg-red-50 p-3 rounded-lg">{error}</div>}
        
        {loading && distributors.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500">Loading distributors...</div>
        ) : distributors.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Truck className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-medium text-slate-800">No distributors added</h4>
            <p className="text-xs text-slate-500 mt-1">Add your wholesalers to use the Auto-Order feature.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {distributors.map(d => (
              <div key={d.id} className="border border-slate-200 rounded-xl p-4 hover:border-pharmacy-300 transition-colors bg-white shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-slate-800">{d.name}</h4>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(d)} className="text-slate-400 hover:text-pharmacy-600 transition-colors p-1"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(d.id)} className="text-slate-400 hover:text-red-600 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                
                <div className="space-y-2 mt-auto">
                  {d.whatsappNumber && (
                    <div className="flex items-center text-xs text-slate-600">
                      <MessageCircle className="w-3.5 h-3.5 mr-2 text-green-500" />
                      {d.whatsappNumber}
                    </div>
                  )}
                  {d.email && (
                    <div className="flex items-center text-xs text-slate-600">
                      <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      {d.email}
                    </div>
                  )}
                  {d.address && (
                    <div className="flex items-start text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{d.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-500/75 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{editingDistributor ? 'Edit Distributor' : 'Add Distributor'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company/Supplier Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-pharmacy-500 focus:border-pharmacy-500" placeholder="e.g. Apollo Distributors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Number</label>
                <input type="text" value={formData.whatsappNumber} onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-pharmacy-500 focus:border-pharmacy-500" placeholder="+91 9876543210" />
                <p className="text-[10px] text-slate-500 mt-1">Orders will be sent to this number automatically.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-pharmacy-500 focus:border-pharmacy-500" placeholder="orders@supplier.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-pharmacy-500 focus:border-pharmacy-500" placeholder="Supplier address..." />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2 bg-pharmacy-600 text-white rounded-lg text-sm font-medium hover:bg-pharmacy-700 disabled:opacity-70">
                  {loading ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
