import React, { useState, useEffect, useMemo } from 'react';
import { SupplierService, Supplier } from '../services/supplierService';
import {
  Plus, Edit2, Trash2, Search, Building2, Phone, Mail, MapPin,
  CreditCard, FileText, CheckCircle2, AlertCircle, Copy, Check,
  Eye, X, ShieldCheck, Calendar, DollarSign, Sparkles, Clock,
  Landmark, ExternalLink, RefreshCw, Layers
} from 'lucide-react';

const REAL_MARG_SAMPLES: Partial<Supplier>[] = [
  {
    supplier_name: 'Shree Ganesh Medicine Distributors',
    contact_person: 'Hasmukhbhai Shah (Managing Partner)',
    mobile: '9825123456',
    alternate_phone: '0261-2451234',
    email: 'orders@shreeganeshpharma.in',
    address: 'Shop No. 12-14, 1st Floor, Medicine Market, Ring Road',
    city: 'Surat',
    state: 'Gujarat',
    pincode: '395002',
    gstin: '24AAGCS1234F1Z8',
    drug_license_number: '20B-GJ-SUR-142512, 21B-GJ-SUR-142513',
    fssai_number: '10721031000145',
    pan_number: 'AAGCS1234F',
    credit_period_days: 21,
    opening_balance: 45200,
    current_balance: 45200,
    bank_name: 'HDFC Bank',
    account_number: '50200012345678',
    ifsc_code: 'HDFC0000084',
    branch_name: 'Ring Road Branch, Surat',
    upi_id: 'shreeganesh@hdfcbank',
    deals_in_brands: 'Sun Pharma, Cipla, Torrent Pharma, Mankind, Zydus',
    notes: 'Primary stockist for cardiac, diabetic & antibiotic ranges. Orders dispatched within 4 hours. Daily 2 PM cutoff.',
    status: 'ACTIVE'
  },
  {
    supplier_name: 'Aarav Healthcare & Surgical Agencies',
    contact_person: 'Pratik V. Mehta (Sales Executive)',
    mobile: '9879944556',
    alternate_phone: '079-26581122',
    email: 'supply@aaravhealth.com',
    address: 'Plot No. 45, GIDC Industrial Estate, Naroda',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '382330',
    gstin: '24AAFFA5678M1ZK',
    drug_license_number: '20B-GJ-AHM-218901, 21B-GJ-AHM-218902',
    fssai_number: '10719022000891',
    pan_number: 'AAFFA5678M',
    credit_period_days: 30,
    opening_balance: 18750,
    current_balance: 18750,
    bank_name: 'ICICI Bank',
    account_number: '004705001234',
    ifsc_code: 'ICIC0000047',
    branch_name: 'Naroda GIDC Branch',
    upi_id: 'aaravhealth@icici',
    deals_in_brands: 'Abbott, Dr. Reddy\'s, Glenmark, Alkem, Intas',
    notes: 'Authorized stockist for pediatrics, nutraceuticals and cold chain products. Vaccine chiller facility available.',
    status: 'ACTIVE'
  },
  {
    supplier_name: 'Navkar Pharma Wholesale Depot',
    contact_person: 'Ramesh Jain (Accounts Head)',
    mobile: '9426811223',
    alternate_phone: '0265-2334455',
    email: 'navkarpharma.brd@gmail.com',
    address: '102, Royal Pharma Complex, Dandia Bazar',
    city: 'Vadodara',
    state: 'Gujarat',
    pincode: '390001',
    gstin: '24AACFN9012P1ZN',
    drug_license_number: '20B-GJ-BAR-349811, 21B-GJ-BAR-349812',
    fssai_number: '10720015000412',
    pan_number: 'AACFN9012P',
    credit_period_days: 15,
    opening_balance: 29400,
    current_balance: 29400,
    bank_name: 'State Bank of India',
    account_number: '31098456123',
    ifsc_code: 'SBIN0000492',
    branch_name: 'Dandia Bazar Main Branch',
    upi_id: '9426811223@sbi',
    deals_in_brands: 'Lupin, Cadila, Macleods, Aristo, FDC',
    notes: '2% cash discount if cleared within 7 days. Monthly statement shared on 1st of every month.',
    status: 'ACTIVE'
  },
  {
    supplier_name: 'Apex Lifesciences & Vaccines Depot',
    contact_person: 'Dipak K. Trivedi (Cold Chain Incharge)',
    mobile: '9712398765',
    alternate_phone: '0281-2244556',
    email: 'orders@apexlifesciences.in',
    address: 'B-4, Pharma Zone, Near Star Hospital, Jamnagar Road',
    city: 'Rajkot',
    state: 'Gujarat',
    pincode: '360006',
    gstin: '24AAKCA4321R1ZX',
    drug_license_number: '20B-GJ-RAJ-556123, 21B-GJ-RAJ-556124',
    fssai_number: '10722045000329',
    pan_number: 'AAKCA4321R',
    credit_period_days: 15,
    opening_balance: 12600,
    current_balance: 12600,
    bank_name: 'Kotak Mahindra Bank',
    account_number: '7711223344',
    ifsc_code: 'KKBK0000812',
    branch_name: 'Jamnagar Road Branch',
    upi_id: 'apexlifesciences@kotak',
    deals_in_brands: 'Serum Institute, Bharat Biotech, Sanofi, GSK, Novo Nordisk',
    notes: 'Specialized in cold-chain logistics: insulins, vaccines, and biologics with temperature loggers.',
    status: 'ACTIVE'
  }
];

const INITIAL_FORM_STATE: Partial<Supplier> = {
  supplier_name: '',
  contact_person: '',
  mobile: '',
  alternate_phone: '',
  email: '',
  address: '',
  city: 'Surat',
  state: 'Gujarat',
  pincode: '',
  gstin: '',
  drug_license_number: '',
  fssai_number: '',
  pan_number: '',
  credit_period_days: 21,
  opening_balance: 0,
  bank_name: '',
  account_number: '',
  ifsc_code: '',
  branch_name: '',
  upi_id: '',
  deals_in_brands: '',
  notes: '',
  status: 'ACTIVE'
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals & Drawers
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'compliance' | 'finance' | 'brands'>('basic');
  const [formData, setFormData] = useState<Partial<Supplier>>(INITIAL_FORM_STATE);
  
  // View Dossier Drawer
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
  // Copy tooltip state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await SupplierService.getSuppliers();
      setSuppliers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM_STATE);
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingId(supplier.id || null);
    setFormData({
      supplier_name: supplier.supplier_name || '',
      contact_person: supplier.contact_person || '',
      mobile: supplier.mobile || '',
      alternate_phone: supplier.alternate_phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || 'Gujarat',
      pincode: supplier.pincode || '',
      gstin: supplier.gstin || '',
      drug_license_number: supplier.drug_license_number || '',
      fssai_number: supplier.fssai_number || '',
      pan_number: supplier.pan_number || '',
      credit_period_days: supplier.credit_period_days || 21,
      opening_balance: supplier.opening_balance || 0,
      bank_name: supplier.bank_name || '',
      account_number: supplier.account_number || '',
      ifsc_code: supplier.ifsc_code || '',
      branch_name: supplier.branch_name || '',
      upi_id: supplier.upi_id || '',
      deals_in_brands: supplier.deals_in_brands || '',
      notes: supplier.notes || '',
      status: supplier.status || 'ACTIVE'
    });
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleLoadSample = (sampleIndex = 0) => {
    const sample = REAL_MARG_SAMPLES[sampleIndex % REAL_MARG_SAMPLES.length];
    setFormData({
      ...formData,
      ...sample,
      supplier_name: sample.supplier_name + (editingId ? '' : ` (${Math.floor(100 + Math.random() * 900)})`)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.supplier_name?.trim()) {
        alert('Please enter Supplier / Firm Name');
        return;
      }

      if (editingId) {
        await SupplierService.updateSupplier(editingId, formData);
      } else {
        await SupplierService.createSupplier(formData);
      }
      setShowModal(false);
      setFormData(INITIAL_FORM_STATE);
      setEditingId(null);
      await fetchSuppliers();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDeactivate = async (id: number, currentStatus?: string) => {
    const action = currentStatus === 'INACTIVE' ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${action} this supplier?`)) return;
    try {
      if (currentStatus === 'INACTIVE') {
        await SupplierService.updateSupplier(id, { status: 'ACTIVE' });
      } else {
        await SupplierService.deactivateSupplier(id);
      }
      await fetchSuppliers();
      if (selectedSupplier && selectedSupplier.id === id) {
        setSelectedSupplier(prev => prev ? { ...prev, status: currentStatus === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE' } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  // Quick Seed All Marg Samples if table is empty
  const handleSeedAllSamples = async () => {
    if (!confirm('This will load 4 real-world Gujarat pharma stockists (Sun Pharma, Abbott, Lupin, Serum distributors). Proceed?')) return;
    try {
      setLoading(true);
      for (const sample of REAL_MARG_SAMPLES) {
        try {
          await SupplierService.createSupplier(sample);
        } catch {
          // ignore duplicate
        }
      }
      await fetchSuppliers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        s.supplier_name?.toLowerCase().includes(q) ||
        s.contact_person?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.gstin?.toLowerCase().includes(q) ||
        s.drug_license_number?.toLowerCase().includes(q) ||
        s.deals_in_brands?.toLowerCase().includes(q);

      const matchCity = cityFilter === 'ALL' || s.city?.toLowerCase() === cityFilter.toLowerCase();
      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;

      return matchQuery && matchCity && matchStatus;
    });
  }, [suppliers, searchQuery, cityFilter, statusFilter]);

  // Derived Stats
  const stats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter(s => s.status === 'ACTIVE').length;
    const totalPayable = suppliers.reduce((sum, s) => sum + (parseFloat(String(s.current_balance || 0)) || 0), 0);
    const withGstDl = suppliers.filter(s => s.gstin && s.drug_license_number).length;
    const complianceRate = total > 0 ? Math.round((withGstDl / total) * 100) : 100;
    const totalDays = suppliers.reduce((sum, s) => sum + (s.credit_period_days || 21), 0);
    const avgCreditDays = total > 0 ? Math.round(totalDays / total) : 21;

    return { total, active, totalPayable, complianceRate, avgCreditDays };
  }, [suppliers]);

  // Available unique cities for filter dropdown
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    suppliers.forEach(s => { if (s.city) set.add(s.city); });
    return Array.from(set);
  }, [suppliers]);

  return (
    <div className="space-y-6 pb-16 w-full max-w-7xl mx-auto px-2 sm:px-4">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-72 h-72 bg-pharmacy-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Marg ERP Compatible • Wholesale Stockist Directory
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Suppliers & Distributors Master
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl font-light">
            Comprehensive drug compliance (Form 20B/21B), 15-digit GSTIN, banking RTGS/NEFT/UPI, and pharmaceutical manufacturer distribution agency records.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeedAllSamples}
            title="Load live Gujarat stockists sample data"
            className="flex items-center px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold backdrop-blur-md border border-white/10 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 mr-2 text-amber-300" />
            Load Sample Stockists
          </button>
          
          <button
            onClick={handleOpenAdd}
            className="flex items-center px-5 py-2.5 bg-gradient-to-r from-pharmacy-500 to-emerald-500 hover:from-pharmacy-600 hover:to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Supplier
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={fetchSuppliers} className="text-xs font-bold text-red-600 underline">Retry</button>
        </div>
      )}

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Stockists</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              {stats.total} <span className="text-xs font-semibold text-emerald-600">({stats.active} Active)</span>
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Outstanding</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              ₹{stats.totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">D.L. & GST Verified</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              {stats.complianceRate}% <span className="text-xs font-semibold text-slate-400">Compliant</span>
            </p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Credit Terms</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              {stats.avgCreditDays} <span className="text-xs font-semibold text-slate-400">Days Net</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Distributor name, Brand (Sun, Cipla), City, GSTIN, DL No..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* City filter */}
          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pharmacy-500 cursor-pointer"
          >
            <option value="ALL">All Cities</option>
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pharmacy-500 cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          <button
            onClick={fetchSuppliers}
            title="Refresh"
            className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Suppliers Table / List */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-pharmacy-500" />
            <p className="text-sm font-medium">Fetching Marg ERP Distributor Records...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-700">No matching suppliers found</p>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your search query or load sample data.</p>
            </div>
            <button
              onClick={handleSeedAllSamples}
              className="inline-flex items-center px-4 py-2 bg-pharmacy-600 text-white rounded-xl text-xs font-bold hover:bg-pharmacy-700 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Load Real Gujarat Stockists
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Distributor & Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Licenses & Tax</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Brands Distributed</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Credit & Balance</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredSuppliers.map(s => {
                  const brands = s.deals_in_brands ? s.deals_in_brands.split(',').map(b => b.trim()).filter(Boolean) : [];
                  const balanceNum = parseFloat(String(s.current_balance || 0));

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Column 1: Distributor & Contact */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pharmacy-500/10 to-blue-500/10 border border-pharmacy-500/20 text-pharmacy-700 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                            {s.supplier_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                onClick={() => setSelectedSupplier(s)}
                                className="font-bold text-slate-900 text-sm hover:text-pharmacy-600 cursor-pointer transition-colors"
                              >
                                {s.supplier_name}
                              </span>
                              {s.city && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-medium">
                                  {s.city}
                                </span>
                              )}
                            </div>
                            
                            {s.contact_person && (
                              <p className="text-xs text-slate-600 mt-0.5 font-medium flex items-center gap-1">
                                <span>👤 {s.contact_person}</span>
                              </p>
                            )}

                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                              {s.mobile && (
                                <a
                                  href={`tel:${s.mobile}`}
                                  className="inline-flex items-center gap-1 hover:text-pharmacy-600"
                                  title="Call distributor"
                                >
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{s.mobile}</span>
                                </a>
                              )}
                              {s.alternate_phone && (
                                <span className="text-slate-400">/ {s.alternate_phone}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Licenses & Tax */}
                      <td className="px-6 py-4 text-xs">
                        <div className="space-y-1">
                          {s.gstin ? (
                            <div className="flex items-center gap-1.5 font-mono text-slate-800">
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold">GST</span>
                              <span className="font-semibold">{s.gstin}</span>
                              <button
                                onClick={() => handleCopy(s.gstin || '', `gst_${s.id}`)}
                                title="Copy GSTIN"
                                className="text-slate-400 hover:text-slate-600"
                              >
                                {copiedKey === `gst_${s.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No GSTIN</span>
                          )}

                          {s.drug_license_number ? (
                            <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">DL 20B/21B</span>
                              <span className="truncate max-w-[150px]" title={s.drug_license_number}>{s.drug_license_number}</span>
                            </div>
                          ) : null}

                          {s.pan_number && (
                            <div className="text-[11px] text-slate-500">
                              <span className="font-medium text-slate-400">PAN:</span> {s.pan_number}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Brands */}
                      <td className="px-6 py-4">
                        {brands.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {brands.slice(0, 3).map((brand, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {brand}
                              </span>
                            ))}
                            {brands.length > 3 && (
                              <span
                                onClick={() => setSelectedSupplier(s)}
                                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-pharmacy-50 text-pharmacy-700 cursor-pointer"
                              >
                                +{brands.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">All Pharma Ranges</span>
                        )}
                      </td>

                      {/* Column 4: Credit & Balance */}
                      <td className="px-6 py-4 text-xs">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            ₹{balanceNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 mt-0.5 text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Credit: <strong className="text-slate-700">{s.credit_period_days || 21} Days</strong></span>
                          </div>
                          {s.bank_name && (
                            <div className="text-[11px] text-slate-400 truncate max-w-[140px] mt-0.5" title={`${s.bank_name} - ${s.account_number}`}>
                              🏦 {s.bank_name}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-red-50 text-red-700 border border-red-200/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {s.status || 'ACTIVE'}
                        </span>
                      </td>

                      {/* Column 6: Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Dossier Button */}
                          <button
                            onClick={() => setSelectedSupplier(s)}
                            title="View Complete Marg ERP Dossier"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-pharmacy-600 hover:bg-pharmacy-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(s)}
                            title="Edit Stockist Details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete/Deactivate Button */}
                          <button
                            onClick={() => handleDeactivate(s.id!, s.status)}
                            title={s.status === 'INACTIVE' ? 'Activate' : 'Deactivate'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Modern Tabbed Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-pharmacy-500/20 text-pharmacy-300 text-xs font-semibold uppercase">
                    Marg ERP Master
                  </span>
                  <span className="text-xs text-slate-400">Distributor ID: {editingId ? `#${editingId}` : 'New Record'}</span>
                </div>
                <h2 className="text-xl font-bold mt-1">
                  {editingId ? 'Edit Pharmaceutical Supplier' : 'Add New Pharmaceutical Supplier'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {!editingId && (
                  <button
                    type="button"
                    onClick={() => handleLoadSample(Math.floor(Math.random() * REAL_MARG_SAMPLES.length))}
                    className="flex items-center px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/10 transition-colors"
                    title="Load sample Marg ERP distributor data"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                    Fill Sample Data
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tab Buttons */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === 'basic'
                    ? 'border-pharmacy-600 text-pharmacy-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4" />
                1. Basic & Contact
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('compliance')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === 'compliance'
                    ? 'border-pharmacy-600 text-pharmacy-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                2. Licenses & Tax (GST / DL)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('finance')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === 'finance'
                    ? 'border-pharmacy-600 text-pharmacy-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                3. Credit & Banking
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('brands')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === 'brands'
                    ? 'border-pharmacy-600 text-pharmacy-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                4. Brands & Terms
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[62vh] overflow-y-auto">
                {/* TAB 1: BASIC & CONTACT */}
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Firm / Supplier Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Shree Ganesh Medicine Distributors"
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none transition-shadow"
                          value={formData.supplier_name || ''}
                          onChange={e => setFormData({ ...formData, supplier_name: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Contact Person & Designation
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Hasmukhbhai Shah (Partner)"
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                          value={formData.contact_person || ''}
                          onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Mobile Number (Primary / WhatsApp)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 9825123456"
                          maxLength={15}
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                          value={formData.mobile || ''}
                          onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Alternate Phone / Office Landline
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 0261-2451234"
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                          value={formData.alternate_phone || ''}
                          onChange={e => setFormData({ ...formData, alternate_phone: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="e.g. orders@shreeganeshpharma.in"
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                          value={formData.email || ''}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Premises / Shop Address
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Shop No. 12-14, 1st Floor, Medicine Market, Ring Road"
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                          value={formData.address || ''}
                          onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                        <input
                          type="text"
                          placeholder="e.g. Surat"
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                          value={formData.city || ''}
                          onChange={e => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                          <input
                            type="text"
                            placeholder="Gujarat"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                            value={formData.state || 'Gujarat'}
                            onChange={e => setFormData({ ...formData, state: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code</label>
                          <input
                            type="text"
                            placeholder="395002"
                            maxLength={6}
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                            value={formData.pincode || ''}
                            onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: COMPLIANCE & LICENSES */}
                {activeTab === 'compliance' && (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-blue-800 text-xs flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Drug Compliance Standards (Drugs & Cosmetics Act)</p>
                        <p className="text-blue-700/80 mt-0.5">
                          Indian pharma regulations mandate Form 20B (allopathic non-specified) & Form 21B (Schedule C/C1 biologicals) for wholesale supply, along with 15-character GSTIN.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          GSTIN (15 Digits)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 24AAGCS1234F1Z8"
                          maxLength={15}
                          className="w-full uppercase font-mono border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                          value={formData.gstin || ''}
                          onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                        />
                        <span className="text-[11px] text-slate-400 mt-1 block">Gujarat State Code: 24</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          PAN Number (10 Characters)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. AAGCS1234F"
                          maxLength={10}
                          className="w-full uppercase font-mono border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                          value={formData.pan_number || ''}
                          onChange={e => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Drug License Numbers (Form 20B & 21B)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 20B-GJ-SUR-142512, 21B-GJ-SUR-142513"
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                          value={formData.drug_license_number || ''}
                          onChange={e => setFormData({ ...formData, drug_license_number: e.target.value })}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          FSSAI License Number (14 Digits)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 10721031000145"
                          maxLength={14}
                          className="w-full font-mono border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                          value={formData.fssai_number || ''}
                          onChange={e => setFormData({ ...formData, fssai_number: e.target.value })}
                        />
                        <span className="text-[11px] text-slate-400 mt-1 block">Mandatory for nutritional supplements & health foods.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: FINANCE & BANKING */}
                {activeTab === 'finance' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Credit Period / Net Terms (Days)
                        </label>
                        <select
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none cursor-pointer"
                          value={formData.credit_period_days || 21}
                          onChange={e => setFormData({ ...formData, credit_period_days: parseInt(e.target.value) })}
                        >
                          <option value={7}>7 Days (Fast Moving)</option>
                          <option value={15}>15 Days (Bi-weekly)</option>
                          <option value={21}>21 Days (Standard Marg Terms)</option>
                          <option value={30}>30 Days (Monthly Cycle)</option>
                          <option value={45}>45 Days (Extended)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Opening Balance (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                          value={formData.opening_balance ?? 0}
                          onChange={e => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-[11px] text-slate-400 mt-1 block">Positive indicates payable balance to stockist.</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. HDFC Bank / ICICI Bank"
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                          value={formData.bank_name || ''}
                          onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Account Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 50200012345678"
                          className="w-full font-mono border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                          value={formData.account_number || ''}
                          onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. HDFC0000084"
                          maxLength={11}
                          className="w-full uppercase font-mono border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                          value={formData.ifsc_code || ''}
                          onChange={e => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Branch Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Ring Road Branch, Surat"
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                          value={formData.branch_name || ''}
                          onChange={e => setFormData({ ...formData, branch_name: e.target.value })}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          UPI ID / VPA (For Direct Instant QR Settlement)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. shreeganesh@hdfcbank"
                          className="w-full font-mono border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                          value={formData.upi_id || ''}
                          onChange={e => setFormData({ ...formData, upi_id: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: BRANDS & TERMS */}
                {activeTab === 'brands' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Deals in Brands / Pharma Companies (Comma separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sun Pharma, Cipla, Torrent Pharma, Mankind, Zydus, Abbott"
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none"
                        value={formData.deals_in_brands || ''}
                        onChange={e => setFormData({ ...formData, deals_in_brands: e.target.value })}
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">Allows smart auto-suggestion when entering purchase invoices.</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Order Policy, Dispatch Cutoffs & Return Notes
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Daily order cutoff at 2:00 PM. Returns accepted up to 45 days before expiry date. Cold-chain vehicles available on Tuesday and Friday."
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none resize-none"
                        value={formData.notes || ''}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                      <select
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 outline-none cursor-pointer"
                        value={formData.status || 'ACTIVE'}
                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                      >
                        <option value="ACTIVE">ACTIVE (Authorized for PO & Invoices)</option>
                        <option value="INACTIVE">INACTIVE (Temporarily suspended)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Real-time Marg ERP schema persistence</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-pharmacy-600 to-emerald-600 hover:from-pharmacy-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                  >
                    {editingId ? 'Save Changes' : 'Create Supplier Master'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. View Supplier Dossier Drawer / Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-2xl my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Dossier Header */}
            <div className="p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative">
              <button
                onClick={() => setSelectedSupplier(null)}
                className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-emerald-400 flex items-center justify-center font-black text-2xl flex-shrink-0">
                  {selectedSupplier.supplier_name.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase">
                      {selectedSupplier.status || 'ACTIVE'}
                    </span>
                    <span className="text-xs text-slate-400">Stockist ID #{selectedSupplier.id}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black">{selectedSupplier.supplier_name}</h2>
                  {selectedSupplier.contact_person && (
                    <p className="text-xs text-slate-300 font-medium">👤 Contact: {selectedSupplier.contact_person}</p>
                  )}
                </div>
              </div>

              {/* Quick Actions in Dossier */}
              <div className="flex flex-wrap items-center gap-2.5 mt-5 pt-4 border-t border-white/10 text-xs">
                {selectedSupplier.mobile && (
                  <>
                    <a
                      href={`tel:${selectedSupplier.mobile}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      Call {selectedSupplier.mobile}
                    </a>
                    <a
                      href={`https://wa.me/91${selectedSupplier.mobile.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(selectedSupplier.supplier_name)},%20regarding%20pharmacy%20stock%20order:`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors shadow-sm"
                    >
                      💬 WhatsApp
                    </a>
                  </>
                )}

                {selectedSupplier.email && (
                  <a
                    href={`mailto:${selectedSupplier.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    Email
                  </a>
                )}

                <button
                  onClick={() => {
                    handleOpenEdit(selectedSupplier);
                    setSelectedSupplier(null);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-slate-900 rounded-lg font-bold ml-auto hover:bg-slate-100 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit Dossier
                </button>
              </div>
            </div>

            {/* Dossier Body */}
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto text-sm">
              {/* Statutory Licenses Grid */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Drug Regulatory & Tax Dossier
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-medium block">GSTIN</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono font-bold text-slate-800 text-sm">
                        {selectedSupplier.gstin || 'NOT REGISTERED'}
                      </span>
                      {selectedSupplier.gstin && (
                        <button
                          onClick={() => handleCopy(selectedSupplier.gstin || '', 'dos_gst')}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          {copiedKey === 'dos_gst' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-medium block">Drug License Form 20B & 21B</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-semibold text-slate-800 truncate" title={selectedSupplier.drug_license_number || ''}>
                        {selectedSupplier.drug_license_number || 'N/A'}
                      </span>
                      {selectedSupplier.drug_license_number && (
                        <button
                          onClick={() => handleCopy(selectedSupplier.drug_license_number || '', 'dos_dl')}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          {copiedKey === 'dos_dl' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-medium block">PAN Number</span>
                    <span className="font-mono font-semibold text-slate-800 text-sm mt-1 block">
                      {selectedSupplier.pan_number || 'N/A'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-medium block">FSSAI License</span>
                    <span className="font-mono font-semibold text-slate-800 text-sm mt-1 block">
                      {selectedSupplier.fssai_number || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Settlement & Banking */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-blue-600" />
                  Banking & Credit Settlement
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-medium block">Current Outstanding</span>
                    <span className="font-black text-slate-900 text-base mt-1 block">
                      ₹{parseFloat(String(selectedSupplier.current_balance || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-medium block">Credit Terms</span>
                    <span className="font-bold text-slate-800 text-sm mt-1 block">
                      {selectedSupplier.credit_period_days || 21} Days Net
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-medium block">Opening Balance</span>
                    <span className="font-semibold text-slate-700 text-sm mt-1 block">
                      ₹{parseFloat(String(selectedSupplier.opening_balance || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Bank Account Details */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      🏦 {selectedSupplier.bank_name || 'Bank details not added'}
                    </span>
                    {selectedSupplier.account_number && (
                      <button
                        onClick={() => handleCopy(`Bank: ${selectedSupplier.bank_name}\nA/C: ${selectedSupplier.account_number}\nIFSC: ${selectedSupplier.ifsc_code}`, 'dos_bank')}
                        className="text-xs font-bold text-pharmacy-600 hover:underline flex items-center gap-1"
                      >
                        {copiedKey === 'dos_bank' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        Copy Bank Details
                      </button>
                    )}
                  </div>

                  {selectedSupplier.account_number && (
                    <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono">
                      <div>A/C: <span className="font-semibold text-slate-900">{selectedSupplier.account_number}</span></div>
                      <div>IFSC: <span className="font-semibold text-slate-900">{selectedSupplier.ifsc_code}</span></div>
                      {selectedSupplier.branch_name && <div className="col-span-2 text-slate-500 font-sans">Branch: {selectedSupplier.branch_name}</div>}
                    </div>
                  )}

                  {selectedSupplier.upi_id && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-slate-500 font-medium">UPI VPA: <strong className="text-slate-800 font-mono">{selectedSupplier.upi_id}</strong></span>
                      <button
                        onClick={() => handleCopy(selectedSupplier.upi_id || '', 'dos_upi')}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {copiedKey === 'dos_upi' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Brands & Notes */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deals in Brands</p>
                {selectedSupplier.deals_in_brands ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSupplier.deals_in_brands.split(',').map((b, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs font-semibold">
                        {b.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No brand filters registered</p>
                )}

                {selectedSupplier.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Order & Delivery Terms</p>
                    <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                      {selectedSupplier.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="text-xs text-slate-500 flex items-start gap-2 px-1">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  {selectedSupplier.address ? `${selectedSupplier.address}, ` : ''}
                  {selectedSupplier.city ? `${selectedSupplier.city}, ` : ''}
                  {selectedSupplier.state || 'Gujarat'}
                  {selectedSupplier.pincode ? ` - ${selectedSupplier.pincode}` : ''}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedSupplier(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
