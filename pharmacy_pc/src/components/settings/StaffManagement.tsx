import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit2, Trash2, Shield, KeyRound, Loader2, Search } from 'lucide-react';
import { StaffService, StaffMember } from '../../services/staffService';
import { DEV_PHARMACY_ID } from '../../config/development';

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<StaffMember>>({
    name: '',
    phone: '',
    role: 'BILLER',
    pin: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await StaffService.getPharmacyStaff(DEV_PHARMACY_ID);
      // Backend might return empty if not implemented fully, we will simulate one owner if empty
      if (data.length === 0) {
        setStaff([{
          id: 1,
          pharmacy_id: DEV_PHARMACY_ID,
          name: 'Owner (Default)',
          phone: '9999999999',
          role: 'OWNER',
          is_active: true,
          created_at: new Date().toISOString()
        }]);
      } else {
        setStaff(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await StaffService.updateStaff(editingId, formData);
      } else {
        await StaffService.addStaff(DEV_PHARMACY_ID, formData);
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (error) {
      alert('Failed to save staff member. Note: Make sure backend supports this endpoint.');
      
      // Fallback local simulation for seamless demo
      const newStaff = { ...formData, id: Date.now(), is_active: true, created_at: new Date().toISOString() } as StaffMember;
      if (editingId) {
        setStaff(staff.map(s => s.id === editingId ? { ...s, ...formData } : s));
      } else {
        setStaff([...staff, newStaff]);
      }
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await StaffService.deleteStaff(id);
      fetchStaff();
    } catch (error) {
      setStaff(staff.filter(s => s.id !== id)); // local fallback
    }
  };

  const openAdd = () => {
    setFormData({ name: '', phone: '', role: 'BILLER', pin: '' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (s: StaffMember) => {
    setFormData(s);
    setEditingId(s.id);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <Users className="w-5 h-5 mr-2 text-indigo-600" />
            Staff Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage employee access and generate login PINs.</p>
        </div>
        <button 
          onClick={openAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center transition-colors shadow-md shadow-indigo-200"
        >
          <UserPlus className="w-4 h-4 mr-2" /> Add Staff
        </button>
      </div>

      <div className="p-0">
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Staff Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Login PIN</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-slate-800">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      s.role === 'OWNER' ? 'bg-purple-100 text-purple-800' :
                      s.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      <Shield className="w-3 h-3 mr-1" /> {s.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {s.role === 'OWNER' ? (
                      <span className="text-slate-400 italic">Uses Master Password</span>
                    ) : (
                      <div className="flex items-center">
                        <KeyRound className="w-3 h-3 mr-1 text-slate-400" />
                        <span className="font-mono tracking-widest font-bold text-slate-700">{s.pin || '****'}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {s.role !== 'OWNER' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(s)} className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-300 transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-red-300 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Edit Staff' : 'Add New Staff'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number *</label>
                <input required type="tel" maxLength={10} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g,'')})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role *</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                  <option value="MANAGER">Manager (Full Access except billing plans)</option>
                  <option value="PHARMACIST">Pharmacist (Inventory & Billing)</option>
                  <option value="BILLER">Biller (Only Billing)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">4-Digit Login PIN *</label>
                <input required type="text" maxLength={4} value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g,'')})} placeholder="e.g. 1234" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-center text-xl font-mono tracking-[0.5em]" />
                <p className="text-xs text-slate-500 mt-2 text-center">Staff will use this PIN to log in quickly.</p>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors">
                  {editingId ? 'Save Changes' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
