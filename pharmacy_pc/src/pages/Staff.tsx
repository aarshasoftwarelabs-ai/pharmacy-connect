import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, UserCircle, Key } from 'lucide-react';
import { StaffService, StaffMember, StaffPermission } from '../services/staffService';
import { getPharmacyId } from '../config/development';
import { useAuth } from '../components/auth/AuthContext';

const AVAILABLE_PERMISSIONS: { module: string, perms: { key: string, label: string, desc?: string }[] }[] = [
  { module: 'Dashboard', perms: [{ key: 'DASHBOARD_VIEW', label: 'View Dashboard', desc: 'Can view the main dashboard' }] },
  { module: 'Medicines', perms: [{ key: 'MEDICINES_VIEW', label: 'View Medicines' }, { key: 'MEDICINES_CREATE', label: 'Create Medicines' }, { key: 'MEDICINES_EDIT', label: 'Edit Medicines' }, { key: 'MEDICINES_DELETE', label: 'Delete Medicines' }] },
  { module: 'Inventory', perms: [{ key: 'INVENTORY_VIEW', label: 'View Inventory' }, { key: 'INVENTORY_ADJUST', label: 'Adjust Inventory' }] },
  { module: 'Suppliers', perms: [{ key: 'SUPPLIERS_VIEW', label: 'View Suppliers' }, { key: 'SUPPLIERS_CREATE', label: 'Create Suppliers' }, { key: 'SUPPLIERS_EDIT', label: 'Edit Suppliers' }, { key: 'SUPPLIERS_DEACTIVATE', label: 'Deactivate Suppliers' }] },
  { module: 'Purchases', perms: [{ key: 'PURCHASES_VIEW', label: 'View Purchases' }, { key: 'PURCHASES_CREATE', label: 'Create Purchases' }, { key: 'PURCHASES_CANCEL', label: 'Cancel Purchases' }] },
  { module: 'Billing', perms: [{ key: 'BILLING_VIEW', label: 'View Billing' }, { key: 'BILLING_CREATE', label: 'Create Bills' }, { key: 'BILLING_CANCEL', label: 'Cancel Bills' }, { key: 'BILLING_PRINT', label: 'Print Bills' }] },
  { module: 'Customers', perms: [{ key: 'CUSTOMERS_VIEW', label: 'View Customers' }, { key: 'CUSTOMERS_EDIT', label: 'Edit Customers' }] },
  { module: 'Medicine Requests', perms: [{ key: 'MEDICINE_REQUESTS_VIEW', label: 'View Requests' }, { key: 'MEDICINE_REQUESTS_RESPOND', label: 'Respond to Requests' }] },
  { module: 'Reports', perms: [{ key: 'REPORTS_VIEW', label: 'View Reports' }, { key: 'REPORTS_EXPORT', label: 'Export Reports' }] },
  { module: 'Wholesale', perms: [{ key: 'WHOLESALE_VIEW', label: 'View Wholesale' }, { key: 'WHOLESALE_CREATE', label: 'Create Wholesale' }, { key: 'WHOLESALE_EDIT', label: 'Edit Wholesale' }] },
  { module: 'Staff', perms: [{ key: 'STAFF_VIEW', label: 'View Staff' }, { key: 'STAFF_CREATE', label: 'Create Staff' }, { key: 'STAFF_EDIT', label: 'Edit Staff' }, { key: 'STAFF_DEACTIVATE', label: 'Deactivate Staff' }, { key: 'STAFF_PERMISSIONS', label: 'Manage Permissions' }] },
  { module: 'Settings', perms: [{ key: 'PHARMACY_PROFILE_VIEW', label: 'View Profile' }, { key: 'PHARMACY_PROFILE_EDIT', label: 'Edit Profile' }, { key: 'SETTINGS_VIEW', label: 'View Settings' }, { key: 'SETTINGS_EDIT', label: 'Edit Settings' }] }
];

export default function Staff() {
  const { isOwner, hasPermission } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Permissions state
  const [isPermsModalOpen, setIsPermsModalOpen] = useState(false);
  const [managingPermsStaff, setManagingPermsStaff] = useState<StaffMember | null>(null);
  const [staffPermissions, setStaffPermissions] = useState<StaffPermission[]>([]);
  const [permsLoading, setPermsLoading] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'BILLER' as 'OWNER' | 'MANAGER' | 'PHARMACIST' | 'BILLER',
    pin: '',
    is_active: true
  });

  const getActualPharmacyId = () => {
    try {
      const localData = localStorage.getItem('pharmacy_profile_data');
      if (localData) {
        const profile = JSON.parse(localData);
        if (profile.id) return profile.id;
      }
    } catch (e) {}
    return getPharmacyId();
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await StaffService.getPharmacyStaff(getActualPharmacyId());
      setStaff(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await StaffService.updateStaff(editingStaff.id, formData);
      } else {
        await StaffService.addStaff(getActualPharmacyId(), formData);
      }
      setIsModalOpen(false);
      setEditingStaff(null);
      fetchStaff();
    } catch (error) {
      alert('Failed to save staff member');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      try {
        await StaffService.deleteStaff(id);
        fetchStaff();
      } catch (error) {
        alert('Failed to delete staff member');
      }
    }
  };

  const openAddModal = () => {
    setFormData({ name: '', phone: '', email: '', role: 'BILLER', pin: '', is_active: true });
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  const openEditModal = (member: StaffMember) => {
    setFormData({
      name: member.name,
      phone: member.phone,
      email: member.email || '',
      role: member.role,
      pin: member.pin || '',
      is_active: member.is_active
    });
    setEditingStaff(member);
    setIsModalOpen(true);
  };

  const openPermissionsModal = async (member: StaffMember) => {
    setManagingPermsStaff(member);
    setIsPermsModalOpen(true);
    setPermsLoading(true);
    try {
      const perms = await StaffService.getPermissions(member.id);
      setStaffPermissions(perms);
    } catch (err) {
      alert('Failed to load permissions');
    } finally {
      setPermsLoading(false);
    }
  };

  const handlePermissionToggle = (key: string, granted: boolean) => {
    setStaffPermissions(prev => {
      const existing = prev.find(p => p.permission_key === key);
      if (existing) {
        return prev.map(p => p.permission_key === key ? { ...p, granted } : p);
      } else {
        return [...prev, { permission_key: key, granted }];
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!managingPermsStaff) return;
    setSavingPerms(true);
    try {
      await StaffService.updatePermissions(managingPermsStaff.id, staffPermissions);
      setIsPermsModalOpen(false);
      setManagingPermsStaff(null);
    } catch (err: any) {
      alert(err.message || 'Failed to save permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-16 space-y-6 px-4 xl:px-8 pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pharmacy-600 to-blue-600 tracking-tight flex items-center w-fit">
            <Users className="w-8 h-8 mr-3 text-pharmacy-600" />
            Staff Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">Manage your employees, their roles, and access pins.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-pharmacy-600 text-white px-4 py-2 rounded-xl font-bold shadow-sm shadow-pharmacy-600/30 hover:bg-pharmacy-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Staff Member
        </button>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-600 mb-4"></div>
            Loading staff...
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <UserCircle className="w-16 h-16 mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-600">No staff members found</p>
            <p className="text-sm">Click "Add Staff Member" to add employees.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee Info</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-pharmacy-50 flex items-center justify-center text-pharmacy-700 font-bold border border-pharmacy-100">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-slate-900">{member.name}</div>
                          <div className="text-xs text-slate-500 flex items-center mt-1">
                            <Key className="w-3 h-3 mr-1" /> PIN: {member.pin ? '••••' : 'Not set'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        member.role === 'OWNER' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        member.role === 'MANAGER' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        member.role === 'PHARMACIST' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        <Shield className="w-3 h-3 mr-1" />
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <div>{member.phone}</div>
                      {member.email && <div className="text-xs text-slate-400 mt-0.5">{member.email}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isOwner() && member.role !== 'OWNER' && (
                        <button onClick={() => openPermissionsModal(member)} className="text-pharmacy-600 hover:text-pharmacy-900 mr-4" title="Manage Permissions">
                          <Shield className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => openEditModal(member)} className="text-pharmacy-600 hover:text-pharmacy-900 mr-4" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(member.id)} className="text-red-500 hover:text-red-700" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-800/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent outline-none transition-shadow bg-slate-50 focus:bg-white" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input 
                    required
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent outline-none transition-shadow bg-slate-50 focus:bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Access PIN (4 digits)</label>
                  <input 
                    type="password" 
                    maxLength={4}
                    value={formData.pin}
                    onChange={e => setFormData({...formData, pin: e.target.value.replace(/[^0-9]/g, '')})}
                    placeholder="e.g. 1234"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent outline-none transition-shadow bg-slate-50 focus:bg-white" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent outline-none transition-shadow bg-slate-50 focus:bg-white" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as any})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent outline-none transition-shadow bg-slate-50 focus:bg-white"
                >
                  <option value="BILLER">Biller / Cashier</option>
                  <option value="PHARMACIST">Pharmacist</option>
                  <option value="MANAGER">Store Manager</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>

              <div className="flex items-center pt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="rounded border-slate-300 text-pharmacy-600 focus:ring-pharmacy-500 w-4 h-4 mr-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Account is Active</label>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-pharmacy-600 text-white rounded-xl font-medium hover:bg-pharmacy-700 transition-colors"
                >
                  {editingStaff ? 'Save Changes' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {isPermsModalOpen && managingPermsStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-800/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-pharmacy-600" />
                Manage Permissions: {managingPermsStaff.name}
              </h3>
              <button onClick={() => setIsPermsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              {permsLoading ? (
                <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-600"></div></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {AVAILABLE_PERMISSIONS.map((group, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">{group.module}</h4>
                      <div className="space-y-3">
                        {group.perms.map(p => {
                          const isGranted = staffPermissions.find(sp => sp.permission_key === p.key)?.granted || false;
                          return (
                            <label key={p.key} className="flex items-start cursor-pointer group">
                              <div className="flex-shrink-0 mt-0.5">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 text-pharmacy-600 border-slate-300 rounded focus:ring-pharmacy-500"
                                  checked={isGranted}
                                  onChange={(e) => handlePermissionToggle(p.key, e.target.checked)}
                                />
                              </div>
                              <div className="ml-3">
                                <span className="block text-sm font-medium text-slate-700 group-hover:text-pharmacy-600 transition-colors">{p.label}</span>
                                {p.desc && <span className="block text-xs text-slate-500">{p.desc}</span>}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-[2rem]">
              <button 
                onClick={() => setIsPermsModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSavePermissions}
                disabled={savingPerms}
                className="px-4 py-2 bg-pharmacy-600 text-white rounded-xl font-medium hover:bg-pharmacy-700 transition-colors disabled:opacity-50"
              >
                {savingPerms ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
