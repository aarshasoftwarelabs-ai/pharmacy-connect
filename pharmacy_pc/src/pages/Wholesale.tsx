import React, { useState, useEffect } from 'react';
import { Users, FileText, Gift, Plus, Search, Package, Sparkles, Loader2 } from 'lucide-react';
import { B2BClient } from '../types/wholesale';
import api from '../config/api';

export default function Wholesale() {
  const [activeTab, setActiveTab] = useState<'clients' | 'ledger' | 'schemes'>('clients');
  const [clients, setClients] = useState<B2BClient[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchemes, setLoadingSchemes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddSchemeModal, setShowAddSchemeModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', description: '', referenceId: '' });
  const [savingPayment, setSavingPayment] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    address: '',
    gstin: '',
    dlNumber: '',
    creditLimit: '0'
  });
  const [saving, setSaving] = useState(false);
  const [isFetchingGstin, setIsFetchingGstin] = useState(false);

  const handleAiGstinFetch = () => {
    if (!formData.gstin || formData.gstin.length < 10) {
      alert("Please enter a valid GSTIN first to auto-fetch details.");
      return;
    }
    
    setIsFetchingGstin(true);
    // Simulate AI / Government API fetch
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        businessName: 'Apex Pharmaceuticals Pvt Ltd',
        ownerName: 'Vikram Mehta',
        address: '14, SG Highway, Ahmedabad, Gujarat 380015',
        phone: '9876543210',
        dlNumber: 'GJ-AHD-12345'
      }));
      setIsFetchingGstin(false);
    }, 1500);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const pharmacyData = JSON.parse(localStorage.getItem('pharmacy_profile_data') || '{}');
      await api.post('/wholesale/clients', {
        ...formData,
        pharmacyId: pharmacyData.id,
        creditLimit: parseFloat(formData.creditLimit) || 0
      });
      setShowAddModal(false);
      setFormData({ businessName: '', ownerName: '', phone: '', address: '', gstin: '', dlNumber: '', creditLimit: '0' });
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;
    try {
      setSavingPayment(true);
      await api.post(`/wholesale/clients/${selectedClientId}/ledger`, {
        type: 'CR',
        amount: parseFloat(paymentForm.amount),
        description: paymentForm.description || 'Payment Received',
        referenceId: paymentForm.referenceId ? parseInt(paymentForm.referenceId) : null
      });
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', description: '', referenceId: '' });
      fetchLedger(selectedClientId);
      fetchClients(); // refresh balances
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to add payment');
    } finally {
      setSavingPayment(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      setLoadingSchemes(true);
      const pharmacyData = JSON.parse(localStorage.getItem('pharmacy_profile_data') || '{}');
      const res = await api.get(`/wholesale/schemes/${pharmacyData.id}`);
      setSchemes(res.data.data || []);
    } catch (error) {
      console.error('Error fetching schemes:', error);
    } finally {
      setLoadingSchemes(false);
    }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const pharmacyData = JSON.parse(localStorage.getItem('pharmacy_profile_data') || '{}');
      const res = await api.get(`/wholesale/clients/${pharmacyData.id}`);
      setClients(res.data.data || []);
    } catch (error) {
      console.error('Error fetching B2B clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClientId) {
      fetchLedger(selectedClientId);
    }
  }, [selectedClientId]);

  const fetchLedger = async (clientId: number) => {
    try {
      setLoadingLedger(true);
      const res = await api.get(`/wholesale/clients/${clientId}/ledger`);
      setLedgerEntries(res.data.data || []);
    } catch (error) {
      console.error('Error fetching ledger:', error);
    } finally {
      setLoadingLedger(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.gstin && c.gstin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // AI Logic: Calculate Trust Score based on Credit Limit vs Current Balance
  const getAiTrustScore = (client: B2BClient) => {
    const limit = Number(client.creditLimit);
    const balance = Number(client.currentBalance);
    
    if (limit === 0) return { score: 95, label: 'Excellent', color: 'bg-emerald-100 text-emerald-700', icon: '✨' };
    
    const utilization = balance / limit;
    
    if (utilization <= 0.3) return { score: 90, label: 'Low Risk', color: 'bg-green-100 text-green-700', icon: '🟢' };
    if (utilization <= 0.7) return { score: 65, label: 'Moderate', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' };
    if (utilization <= 0.9) return { score: 40, label: 'High Risk', color: 'bg-orange-100 text-orange-700', icon: '🟠' };
    return { score: 15, label: 'Defaulter Risk', color: 'bg-red-100 text-red-700', icon: '🔴' };
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Wholesale (B2B)</h1>
            <p className="text-sm text-slate-500 mt-1">Manage B2B clients, ledgers, and trade schemes</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-pharmacy-600 text-white rounded-lg hover:bg-pharmacy-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add B2B Client
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-6 mt-8 border-b border-slate-200">
          {[
            { id: 'clients', name: 'B2B Clients', icon: Users },
            { id: 'ledger', name: 'Ledger (Khata)', icon: FileText },
            { id: 'schemes', name: 'Trade Schemes', icon: Gift },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center pb-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-pharmacy-600 text-pharmacy-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-pharmacy-600' : 'text-slate-400'}`} />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        {activeTab === 'clients' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="relative w-96">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by business name or GSTIN..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading clients...</div>
            ) : filteredClients.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">No B2B clients found</h3>
                <p className="text-slate-500 text-sm">Add your first wholesale client to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Name</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">GSTIN / DL</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Credit Limit</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">AI Trust Score</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredClients.map((client) => (
                      <tr 
                        key={client.id} 
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setActiveTab('ledger');
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{client.businessName}</div>
                          <div className="text-sm text-slate-500">{client.ownerName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900">{client.phone}</div>
                          <div className="text-sm text-slate-500 truncate max-w-[200px]">{client.address}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-mono text-slate-700">{client.gstin || '-'}</div>
                          <div className="text-xs text-slate-500">DL: {client.dlNumber || '-'}</div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">
                          ₹{Number(client.creditLimit).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {(() => {
                            const ai = getAiTrustScore(client);
                            return (
                              <div className="flex flex-col items-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ai.color}`}>
                                  {ai.icon} {ai.score}/100
                                </span>
                                <span className="text-[10px] text-slate-400 mt-1">{ai.label}</span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-sm font-medium ${
                            Number(client.currentBalance) > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                          }`}>
                            ₹{Number(client.currentBalance).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-slate-700">Select Client:</label>
                <select 
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pharmacy-500 bg-white min-w-[250px]"
                  value={selectedClientId || ''}
                  onChange={(e) => setSelectedClientId(Number(e.target.value))}
                >
                  <option value="" disabled>-- Select a B2B Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.businessName} (Bal: ₹{c.currentBalance})</option>
                  ))}
                </select>
              </div>
              
              {selectedClientId && (
                <button 
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment
                </button>
              )}
            </div>

            {!selectedClientId ? (
              <div className="p-12 text-center text-slate-500 flex-1 flex flex-col justify-center items-center">
                <FileText className="w-12 h-12 text-slate-300 mb-4" />
                <p>Please select a client from the dropdown above to view their Khata.</p>
              </div>
            ) : loadingLedger ? (
              <div className="p-8 text-center text-slate-500 flex-1">Loading ledger...</div>
            ) : ledgerEntries.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex-1 flex flex-col justify-center items-center">
                <p>No transactions found for this client.</p>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Description</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Debit (Bill)</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Credit (Paid)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledgerEntries.map((entry, idx) => (
                      <tr key={entry.id || idx} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {new Date(entry.transactionDate).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">{entry.description || '-'}</div>
                          {entry.referenceId && <div className="text-xs text-slate-500">Ref: #{entry.referenceId}</div>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {entry.transactionType === 'DR' ? (
                            <span className="text-sm font-medium text-red-600">₹{Number(entry.amount).toFixed(2)}</span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {entry.transactionType === 'CR' ? (
                            <span className="text-sm font-medium text-green-600">₹{Number(entry.amount).toFixed(2)}</span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schemes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Active Trade Schemes</h3>
                <p className="text-sm text-slate-500 mt-1">Manage B2B offers like "Buy 10 Get 1 Free" or extra percentage discounts.</p>
              </div>
              <button 
                onClick={() => setShowAddSchemeModal(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Scheme
              </button>
            </div>

            {loadingSchemes ? (
              <div className="flex justify-center items-center h-48 bg-white rounded-xl border border-slate-200">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            ) : schemes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Gift className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="text-lg font-bold text-slate-700">No Active Schemes</h4>
                <p className="text-sm text-slate-500 mt-2 max-w-md">You haven't created any trade schemes yet. Create offers to boost your wholesale orders.</p>
                <button 
                  onClick={() => setShowAddSchemeModal(true)}
                  className="mt-6 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors"
                >
                  Create Your First Scheme
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {schemes.map(scheme => (
                  <div key={scheme.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:border-indigo-300 transition-colors">
                    <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                          {scheme.freeQuantity > 0 ? 'Free Items' : 'Discount'}
                        </div>
                        {scheme.isActive ? (
                          <span className="flex items-center text-xs font-medium text-emerald-600"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></div> Active</span>
                        ) : (
                          <span className="flex items-center text-xs font-medium text-slate-400"><div className="w-2 h-2 rounded-full bg-slate-400 mr-1.5"></div> Expired</span>
                        )}
                      </div>
                      
                      <h4 className="text-xl font-bold text-slate-900 mb-1">{scheme.schemeName}</h4>
                      {scheme.medicineName && (
                        <p className="text-sm font-medium text-slate-600 mb-4 flex items-center">
                          <Package className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          On: {scheme.medicineName}
                        </p>
                      )}
                      
                      <div className="bg-slate-50 rounded-lg p-4 mt-4 border border-slate-100">
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500 font-medium">Condition:</span>
                            <span className="text-sm font-bold text-slate-800">Buy {scheme.minQuantity} items</span>
                          </div>
                          
                          {scheme.freeQuantity > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500 font-medium">Reward:</span>
                              <span className="text-sm font-bold text-indigo-700">Get {scheme.freeQuantity} FREE</span>
                            </div>
                          )}
                          
                          {scheme.discountPercent > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500 font-medium">Reward:</span>
                              <span className="text-sm font-bold text-emerald-700">Extra {Number(scheme.discountPercent)}% OFF</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Add New B2B Client</h2>
              <p className="text-sm text-slate-500 mt-1">Register a new retailer or hospital for wholesale billing.</p>
            </div>
            
            <form onSubmit={handleSaveClient} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business / Pharmacy Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                    placeholder="e.g. Apollo Pharmacy"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Owner / Contact Person</label>
                  <input 
                    type="text" 
                    value={formData.ownerName}
                    onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                    placeholder="e.g. Rahul Patel"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                    placeholder="10-digit number"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input 
                    type="text" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                    placeholder="Full address"
                  />
                </div>

                <div className="col-span-2 relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between items-center">
                    <span>GSTIN</span>
                    <button 
                      type="button" 
                      onClick={handleAiGstinFetch}
                      disabled={isFetchingGstin}
                      className="text-xs flex items-center text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                    >
                      {isFetchingGstin ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      {isFetchingGstin ? 'Fetching...' : 'AI Auto-Fill'}
                    </button>
                  </label>
                  <input 
                    type="text" 
                    value={formData.gstin}
                    onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Drug License (DL) No.</label>
                  <input 
                    type="text" 
                    value={formData.dlNumber}
                    onChange={(e) => setFormData({...formData, dlNumber: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                    placeholder="DL No."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Credit Limit (₹) - Udhaari Limit</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-slate-200">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-pharmacy-600 text-white rounded-lg font-medium hover:bg-pharmacy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {saving ? 'Saving...' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Add Payment Received</h2>
              <p className="text-sm text-slate-500 mt-1">Record a payment from the client to reduce their outstanding balance.</p>
            </div>
            
            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹) *</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input 
                  type="text" 
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="e.g. Cash, NEFT, Cheque No."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference ID (Optional)</label>
                <input 
                  type="text" 
                  value={paymentForm.referenceId}
                  onChange={(e) => setPaymentForm({...paymentForm, referenceId: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="Bill ID or Receipt ID"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-slate-200">
                <button 
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                  disabled={savingPayment}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={savingPayment}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {savingPayment ? 'Saving...' : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Scheme Modal */}
      {showAddSchemeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Create Trade Scheme</h2>
                <p className="text-sm text-slate-500 mt-1">Set up a wholesale offer for B2B clients.</p>
              </div>
              <button onClick={() => setShowAddSchemeModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              try {
                const pharmacyData = JSON.parse(localStorage.getItem('pharmacy_profile_data') || '{}');
                await api.post('/wholesale/schemes', {
                  pharmacyId: pharmacyData.id,
                  schemeName: formData.get('schemeName'),
                  minQuantity: Number(formData.get('minQuantity')),
                  freeQuantity: Number(formData.get('freeQuantity')) || 0,
                  discountPercent: Number(formData.get('discountPercent')) || 0
                });
                setShowAddSchemeModal(false);
                fetchSchemes();
              } catch (err) {
                console.error(err);
                alert('Failed to create scheme');
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Scheme Name *</label>
                <input 
                  type="text" 
                  name="schemeName"
                  placeholder="e.g. Dolo 650 Monsoon Offer"
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min. Quantity (Buy) *</label>
                  <input 
                    type="number" 
                    name="minQuantity"
                    min="1"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Free Quantity (Get)</label>
                  <input 
                    type="number" 
                    name="freeQuantity"
                    min="0"
                    defaultValue="0"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">OR Extra Discount (%)</label>
                <input 
                  type="number" 
                  name="discountPercent"
                  min="0"
                  max="100"
                  defaultValue="0"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddSchemeModal(false)} className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm">Save Scheme</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
