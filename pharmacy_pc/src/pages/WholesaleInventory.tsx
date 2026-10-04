import { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  ArrowRight,
  Sparkles,
  Loader2,
  Trash2,
  ChevronDown,
  RefreshCcw
} from 'lucide-react';
import { fetchMedicines, createMedicine, updateMedicine, deleteMedicine } from '../services/medicineService';
import { fetchDistributors, Distributor } from '../services/distributorService';
import { PharmacyService, PharmacyProfile } from '../services/pharmacyService';
import { Medicine } from '../types/medicine';
import MedicineForm from '../components/medicines/MedicineForm';
import ExpiryReturns from '../components/inventory/ExpiryReturns';
import { DEV_PHARMACY_ID } from '../config/development';

export default function WholesaleInventory() {
  const getActualPharmacyId = () => {
    try {
      const localData = localStorage.getItem('pharmacy_profile_data');
      if (localData) {
        const p = JSON.parse(localData);
        if (p.id) return p.id;
      }
    } catch (e) {}
    return DEV_PHARMACY_ID;
  };
  const [activeTab, setActiveTab] = useState<'inventory' | 'returns'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [pharmacy, setPharmacy] = useState<PharmacyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [autoOrderConfirmMed, setAutoOrderConfirmMed] = useState<Medicine | null>(null);
  const [deleteConfirmMed, setDeleteConfirmMed] = useState<Medicine | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [selectedDistributorId, setSelectedDistributorId] = useState<number | ''>('');
  const [distributorDropdownOpen, setDistributorDropdownOpen] = useState(false);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const actualId = getActualPharmacyId();
      const [medsData, distData, pharmData] = await Promise.all([
        fetchMedicines(),
        fetchDistributors().catch(() => []), // fail gracefully if no permissions
        PharmacyService.getPharmacyProfile(actualId).catch(() => null)
      ]);
      setMedicines(medsData);
      setDistributors(distData);
      setPharmacy(pharmData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSaveMedicine = async (medData: Partial<Medicine>) => {
    try {
      setLoading(true);
      const actualId = getActualPharmacyId();
      if (medData.id) {
        await updateMedicine(medData.id, { ...medData, pharmacyId: actualId } as any);
      } else {
        await createMedicine({ ...medData, pharmacyId: actualId } as any);
      }
      await loadInitialData(); // Refresh list
      setIsAddModalOpen(false);
      setSelectedMedicine(null);
    } catch (err: any) {
      alert(err.message || 'Failed to save medicine');
      setLoading(false);
    }
  };

  const handleAutoOrder = async () => {
    if (!autoOrderConfirmMed) return;
    const targetStock = autoOrderConfirmMed.minimumStock * 2;
    const orderQuantity = targetStock - autoOrderConfirmMed.currentStock;

    if (selectedDistributorId !== '') {
      const dist = distributors.find(d => d.id === Number(selectedDistributorId));
      
      const pharmacyDetails = pharmacy ? `\n\nFrom:\n${pharmacy.name}\n${pharmacy.address}` : '';
      
      if (dist && dist.whatsappNumber) {
        const message = `Hello ${dist.name},\n\nWe need to order ${orderQuantity} units of ${autoOrderConfirmMed.name} ${autoOrderConfirmMed.strength}. Please arrange this at your earliest convenience.${pharmacyDetails}`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${dist.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
      } else if (dist && dist.email) {
        const subject = encodeURIComponent(`Order Request: ${autoOrderConfirmMed.name}`);
        const body = encodeURIComponent(`Hello ${dist.name},\n\nWe need to order ${orderQuantity} units of ${autoOrderConfirmMed.name} ${autoOrderConfirmMed.strength}.\n\nPlease arrange this at your earliest convenience.${pharmacyDetails}\n\nThank you.`);
        window.open(`mailto:${dist.email}?subject=${subject}&body=${body}`);
      } else {
        alert('Selected distributor does not have a WhatsApp number or Email set.');
      }
    }

    try {
      setLoading(true);
      await updateMedicine(autoOrderConfirmMed.id, { currentStock: targetStock });
      await loadInitialData();
      setAutoOrderConfirmMed(null);
      setSelectedDistributorId('');
    } catch (err: any) {
      alert(err.message || 'Failed to process auto-order');
      setLoading(false);
    }
  };

  const handleDeleteMedicine = async () => {
    if (!deleteConfirmMed) return;
    try {
      setLoading(true);
      await deleteMedicine(deleteConfirmMed.id);
      await loadInitialData();
      setDeleteConfirmMed(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete medicine');
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isLowStock = m.currentStock > 0 && m.currentStock <= m.minimumStock;
    const isOutOfStock = m.currentStock === 0;

    let matchesFilter = true;
    if (statusFilter === 'LOW_STOCK') matchesFilter = isLowStock;
    else if (statusFilter === 'OUT_OF_STOCK') matchesFilter = isOutOfStock;

    return matchesSearch && matchesFilter;
  });

  const lowStockCount = medicines.filter(m => m.currentStock <= m.minimumStock).length;
  
  // Calculate expiring soon (within 30 days)
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  const expiringSoonCount = medicines.filter(m => {
    if (!m.expiryDate) return false;
    const expDate = new Date(m.expiryDate);
    return expDate <= thirtyDaysFromNow;
  }).length;
  
  const smartReorderCount = lowStockCount;

  return (
    <div className="space-y-6">
      
      {/* Smart Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            B2B Stock & Catalog
          </h2>
          <p className="text-sm text-slate-500 mt-1">AI-powered insights to optimize your pharmacy inventory.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inventory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Package className="w-4 h-4 mr-2" /> Stock Management
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'returns' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <RefreshCcw className="w-4 h-4 mr-2" /> Expiry Returns Tracker
          </button>
        </div>
      </div>

      {activeTab === 'returns' ? (
        <ExpiryReturns />
      ) : (
        <>
          <div className="flex justify-end relative z-10 gap-2 mt-4">
        <div className="flex gap-2 relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-all shadow-sm ${isFilterOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            <Filter className="w-4 h-4 mr-2" /> Filters {statusFilter !== 'ALL' && <span className="ml-1.5 flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>}
          </button>
          
          {isFilterOpen && (
            <div className="absolute top-full right-[130px] mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-xl z-20 py-2">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Status</div>
              <button onClick={() => { setStatusFilter('ALL'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${statusFilter === 'ALL' ? 'text-indigo-600 font-semibold' : 'text-slate-700'}`}>All Items</button>
              <button onClick={() => { setStatusFilter('LOW_STOCK'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${statusFilter === 'LOW_STOCK' ? 'text-amber-600 font-semibold' : 'text-slate-700'}`}>Low Stock</button>
              <button onClick={() => { setStatusFilter('OUT_OF_STOCK'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${statusFilter === 'OUT_OF_STOCK' ? 'text-red-600 font-semibold' : 'text-slate-700'}`}>Out of Stock</button>
            </div>
          )}

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-500/30 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Medicine
          </button>
        </div>
      </div>

      {/* Smart Insight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-blue-200 transition-colors cursor-pointer group">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Unique Items</p>
            <h3 className="text-2xl font-bold text-slate-800">{medicines.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-red-200 transition-colors cursor-pointer group">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:scale-110 transition-transform relative">
            {lowStockCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Low / Out of Stock</p>
            <h3 className="text-2xl font-bold text-slate-800">{lowStockCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-amber-200 transition-colors cursor-pointer group">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Expiring Soon (30d)</p>
            <h3 className="text-2xl font-bold text-slate-800">{expiringSoonCount}</h3>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pharmacy-50 to-emerald-50 p-5 rounded-2xl shadow-sm border border-indigo-100 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group">
          <div className="p-3 bg-white text-indigo-600 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-700">Bulk Reorder</p>
            <h3 className="text-2xl font-bold text-slate-800">{smartReorderCount} items</h3>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Smart Data Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Table Header/Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by medicine name, batch, or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            {lowStockCount > 0 && (
              <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold border border-red-100">
                Needs Attention ({lowStockCount})
              </span>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
              <p>Loading real-time inventory...</p>
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              No medicines found matching your search.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-6 py-4">Medicine Info</th>
                  <th className="px-6 py-4">Stock Level</th>
                  <th className="px-6 py-4">Expiry</th>
                  <th className="px-6 py-4">Smart Suggestion</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMedicines.map((item) => {
                  const isLowStock = item.currentStock <= item.minimumStock;
                  const isCriticalStock = item.currentStock <= (item.minimumStock / 2);
                  const isOverStocked = item.currentStock > (item.minimumStock * 3);
                  
                  const statusLabel = isCriticalStock ? 'Critical Stock' : 
                                      isLowStock ? 'Low Stock' : 
                                      isOverStocked ? 'Overstocked' : 'In Stock';
                                      
                  let suggestionText = "Sufficient stock. No action needed.";
                  let suggestionColor = "text-slate-500";
                  let iconColor = "text-slate-400";

                  if (isCriticalStock) {
                    suggestionText = `Critical! Reorder ${(item.minimumStock * 2) - item.currentStock} units ASAP`;
                    suggestionColor = "text-red-600 font-bold";
                    iconColor = "text-red-500";
                  } else if (isLowStock) {
                    suggestionText = `Low stock. Order ${(item.minimumStock * 2) - item.currentStock} units soon`;
                    suggestionColor = "text-indigo-700 font-semibold";
                    iconColor = "text-indigo-500";
                  } else if (isOverStocked) {
                    suggestionText = `Excess stock. Hold orders for now.`;
                    suggestionColor = "text-blue-600 font-medium";
                    iconColor = "text-blue-500";
                  }

                  let expiryStatus = "text-slate-600";
                  let expiryLabel = "N/A";
                  if (item.expiryDate) {
                    const expDate = new Date(item.expiryDate);
                    expiryLabel = expDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
                    if (expDate < today) {
                      expiryStatus = "text-red-600 font-bold";
                      suggestionText = "Medicine Expired! Remove from shelf immediately.";
                      suggestionColor = "text-red-600 font-bold";
                      iconColor = "text-red-600";
                    } else if (expDate <= thirtyDaysFromNow) {
                      expiryStatus = "text-amber-600 font-bold";
                      suggestionText = "Expiring soon. Put on clearance or return to supplier.";
                      suggestionColor = "text-amber-600 font-bold";
                      iconColor = "text-amber-500";
                    }
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{item.name} {item.strength}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{item.category} • SKU: {item.sku || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                            statusLabel === 'Low Stock' ? 'bg-amber-100 text-amber-700' :
                            statusLabel === 'Critical Stock' ? 'bg-red-100 text-red-700 animate-pulse' :
                            statusLabel === 'Overstocked' ? 'bg-blue-100 text-blue-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {item.currentStock} Units
                          </span>
                          <span className="text-[10px] text-slate-400">Min: {item.minimumStock}</span>
                        </div>
                        {/* Visual Stock Bar */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              isCriticalStock ? 'bg-red-500' : 
                              isLowStock ? 'bg-amber-500' : 
                              isOverStocked ? 'bg-blue-500' : 
                              'bg-emerald-500'
                            }`} 
                            style={{ width: `${Math.min((item.currentStock / (item.minimumStock * 2)) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${expiryStatus}`}>
                          {expiryLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2 max-w-[200px]">
                          <Sparkles className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconColor}`} />
                          <p className={`text-xs ${suggestionColor}`}>
                            {suggestionText}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {isLowStock && (
                            <button 
                              onClick={() => setAutoOrderConfirmMed(item)}
                              className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors flex items-center gap-1 group"
                            >
                              Auto-Order
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedMedicine(item);
                              setIsAddModalOpen(true);
                            }}
                            className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => setDeleteConfirmMed(item)}
                            className="text-red-500 hover:text-red-700 p-1.5 transition-colors"
                            title="Delete Medicine"
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
          )}
        </div>
      </div>
      
      {isAddModalOpen && (
        <MedicineForm 
          medicine={selectedMedicine}
          existingMedicines={medicines}
          onClose={() => { setIsAddModalOpen(false); setSelectedMedicine(null); }} 
          onSave={handleSaveMedicine} 
        />
      )}

      {autoOrderConfirmMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-500/75 backdrop-blur-sm transition-all" onClick={() => setAutoOrderConfirmMed(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Auto-Order</h3>
              <p className="text-sm text-slate-500 mb-4">
                You are about to place a smart purchase order to refill <span className="font-semibold text-slate-800">{autoOrderConfirmMed.name}</span>.
              </p>
              
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Current Stock:</span>
                  <span className="font-semibold text-red-600">{autoOrderConfirmMed.currentStock} Units</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Target Reorder Level:</span>
                  <span className="font-semibold text-emerald-600">{autoOrderConfirmMed.minimumStock * 2} Units</span>
                </div>
              </div>

              {distributors.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Supplier / Distributor</label>
                  <div className="relative">
                    <div 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white cursor-pointer flex justify-between items-center"
                      onClick={() => setDistributorDropdownOpen(!distributorDropdownOpen)}
                    >
                      <span className={selectedDistributorId === '' ? 'text-slate-500' : 'text-slate-800'}>
                        {selectedDistributorId === '' 
                          ? '-- Do not send message (Internal update only) --' 
                          : distributors.find(d => d.id === selectedDistributorId)?.name + (distributors.find(d => d.id === selectedDistributorId)?.whatsappNumber ? ' (WhatsApp)' : distributors.find(d => d.id === selectedDistributorId)?.email ? ' (Email)' : '')}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                    {distributorDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setDistributorDropdownOpen(false)}></div>
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1">
                          <div 
                            className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-indigo-50 transition-colors ${selectedDistributorId === '' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'}`}
                            onClick={() => {
                              setSelectedDistributorId('');
                              setDistributorDropdownOpen(false);
                            }}
                          >
                            -- Do not send message (Internal update only) --
                          </div>
                          {distributors.map(d => (
                            <div 
                              key={d.id}
                              className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-indigo-50 transition-colors ${selectedDistributorId === d.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'}`}
                              onClick={() => {
                                setSelectedDistributorId(d.id);
                                setDistributorDropdownOpen(false);
                              }}
                            >
                              {d.name} <span className="text-slate-400 text-xs ml-1">{d.whatsappNumber ? '(WhatsApp)' : d.email ? '(Email)' : ''}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-slate-400 italic text-center mb-6">
                * This action will instantly update the stock levels for demonstration purposes. If a supplier is selected, it will open WhatsApp or Email.
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setAutoOrderConfirmMed(null)}
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAutoOrder}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Confirm Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-500/75 backdrop-blur-sm transition-all" onClick={() => setDeleteConfirmMed(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Medicine?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete <span className="font-semibold text-slate-800">{deleteConfirmMed.name}</span> from your inventory? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmMed(null)}
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteMedicine}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
