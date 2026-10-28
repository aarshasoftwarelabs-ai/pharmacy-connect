import { useState, useEffect, useRef } from 'react';
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
  Scan,
  Tag,
  Flame,
  X,
  Camera,
  Barcode,
  FolderSync
} from 'lucide-react';
import { fetchMedicines, createMedicine, updateMedicine, deleteMedicine, generateMissingBarcodes, lookupMedicineByBarcode } from '../services/medicineService';
import { fetchDistributors, Distributor } from '../services/distributorService';
import { PharmacyService, PharmacyProfile } from '../services/pharmacyService';
import { Medicine } from '../types/medicine';
import MedicineForm from '../components/medicines/MedicineForm';
import { AudioAlert } from '../utils/audioAlertService';
import { getPharmacyId } from '../config/development';
import ExpiryReturnModule from '../components/inventory/ExpiryReturnModule';
import DistributorCsvImport from '../components/inventory/DistributorCsvImport';
import MedicineBatchesModal from '../components/inventory/MedicineBatchesModal';
import DeadStockModule from '../components/inventory/DeadStockModule';
import { BatchService } from '../services/batchService';

export default function Inventory() {
  const [activeInventoryTab, setActiveInventoryTab] = useState<'STOCK' | 'EXPIRY_RETURNS' | 'CSV_IMPORT' | 'DEAD_STOCK'>('STOCK');
  const [searchTerm, setSearchTerm] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [pharmacy, setPharmacy] = useState<PharmacyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [viewBatchesMed, setViewBatchesMed] = useState<Medicine | null>(null);
  const [autoOrderConfirmMed, setAutoOrderConfirmMed] = useState<Medicine | null>(null);
  const [deleteConfirmMed, setDeleteConfirmMed] = useState<Medicine | null>(null);
  const [generatingBarcodes, setGeneratingBarcodes] = useState(false);
  const [initializingBatches, setInitializingBatches] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [selectedDistributorId, setSelectedDistributorId] = useState<number | ''>('');
  const [distributorDropdownOpen, setDistributorDropdownOpen] = useState(false);

  const [barcodeStatus, setBarcodeStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string } | null>(null);

  const handleBarcodeScan = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    const lowerCode = code.toLowerCase();
    // Search medicine by barcode, SKU, ID, batch number, or name (exact or substring)
    const match = medicines.find(m => 
      (m.barcode && m.barcode.toLowerCase() === lowerCode) ||
      (m.sku && m.sku.toLowerCase() === lowerCode) ||
      (m.id && m.id.toString() === code) ||
      (m.batches && m.batches.some(b => b.batchNumber && b.batchNumber.toLowerCase() === lowerCode)) ||
      (m.name.toLowerCase() === lowerCode)
    ) || medicines.find(m => 
      m.name.toLowerCase().includes(lowerCode) ||
      (m.genericName && m.genericName.toLowerCase().includes(lowerCode))
    );

    if (match) {
      AudioAlert.playBarcodeBeep();
      setBarcodeStatus({ 
        type: 'success', 
        message: `âœ“ Scanned: ${match.name} (Stock: ${match.currentStock || 0} Units)` 
      });
      setSearchTerm(match.name);
      setTimeout(() => {
        setBarcodeStatus(null);
        setSelectedMedicine(match);
        setIsAddModalOpen(true);
      }, 700);
    } else {
      AudioAlert.playBarcodeBeep();
      setBarcodeStatus({ 
        type: 'idle', 
        message: `ðŸ” Looking up Barcode "${code}"...` 
      });

      let autoFill: any = null;
      try {
        const res = await lookupMedicineByBarcode(code);
        if (res && res.found && res.medicine) {
          autoFill = res.medicine;
        }
      } catch (e) {
        console.warn('Barcode lookup error:', e);
      }

      setBarcodeStatus({ 
        type: 'success', 
        message: autoFill?.name ? `âœ“ Auto-filled "${autoFill.name}" from Barcode!` : `New Barcode "${code}"! Opening Add Medicine...` 
      });

      setTimeout(() => {
        setBarcodeStatus(null);
        setSelectedMedicine({
          name: autoFill?.name || '',
          genericName: autoFill?.genericName || '',
          category: autoFill?.category || 'General',
          strength: autoFill?.strength || '',
          dosageForm: autoFill?.dosageForm || 'Tablet',
          packSize: autoFill?.packSize || '',
          mrp: autoFill?.mrp || 50,
          sellingPrice: autoFill?.sellingPrice || 45,
          purchasePrice: autoFill?.purchasePrice || 35,
          currentStock: autoFill?.currentStock || 10,
          minimumStock: 10,
          barcode: code,
          manufacturer: autoFill?.manufacturer || '',
          hsnCode: autoFill?.hsnCode || '30049099',
          gstRate: autoFill?.gstRate || 12,
          expiryDate: autoFill?.expiryDate || '2028-12-31'
        } as any);
        setIsAddModalOpen(true);
      }, 700);
    }
  };

  // Global listener for USB Barcode Scanners (rapid keyboard stroke sequence ending with Enter)
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 120) {
        keyBuffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (keyBuffer.trim().length >= 2) {
          e.preventDefault();
          handleBarcodeScan(keyBuffer);
          keyBuffer = '';
        }
      } else if (e.key.length === 1) {
        keyBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [medicines]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [medsData, distData, pharmData] = await Promise.all([
        fetchMedicines(),
        fetchDistributors().catch(() => []), // fail gracefully if no permissions
        PharmacyService.getPharmacyProfile(getPharmacyId()).catch(() => null)
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
      if (medData.id) {
        await updateMedicine(medData.id, { ...medData, pharmacyId: getPharmacyId() } as any);
      } else {
        await createMedicine({ ...medData, pharmacyId: getPharmacyId() } as any);
      }
      await loadInitialData(); // Refresh list
      setIsAddModalOpen(false);
      setSelectedMedicine(null);
    } catch (err: any) {
      alert(err.message || 'Failed to save medicine');
      setLoading(false);
    }
  };

  const handleBulkGenerateBarcodes = async () => {
    try {
      setGeneratingBarcodes(true);
      const res = await generateMissingBarcodes();
      alert(`Success: ${res.message}`);
      await loadInitialData();
    } catch (err: any) {
      alert(err.message || 'Failed to auto-generate barcodes');
    } finally {
      setGeneratingBarcodes(false);
    }
  };

  const handleBulkInitializeBatches = async () => {
    try {
      setInitializingBatches(true);
      const res = await BatchService.initializeMissingBatches();
      alert(`Success: ${res.message}`);
      await loadInitialData();
    } catch (err: any) {
      alert(err.message || 'Failed to auto-create batches');
    } finally {
      setInitializingBatches(false);
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
  const missingBarcodeCount = medicines.filter(m => !m.barcode || m.barcode.trim() === '').length;
  const missingBatchCount = medicines.filter(m => !m.batches || m.batches.length === 0).length;

  return (
    <div className="w-full pb-12 space-y-6">
      
      {/* Smart Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pharmacy-600 to-blue-600 tracking-tight flex items-center gap-2 w-fit">
            <Sparkles className="w-8 h-8 text-pharmacy-600" />
            Smart Stock Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">AI-powered insights to optimize your pharmacy inventory.</p>
        </div>
        <div className="flex gap-2 relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-all shadow-sm ${isFilterOpen ? 'bg-pharmacy-50 border-pharmacy-200 text-pharmacy-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            <Filter className="w-4 h-4 mr-2" /> Filters {statusFilter !== 'ALL' && <span className="ml-1.5 flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pharmacy-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-pharmacy-500"></span></span>}
          </button>
          
          {isFilterOpen && (
            <div className="absolute top-full right-[130px] mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-xl z-20 py-2">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Status</div>
              <button onClick={() => { setStatusFilter('ALL'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${statusFilter === 'ALL' ? 'text-pharmacy-600 font-semibold' : 'text-slate-700'}`}>All Items</button>
              <button onClick={() => { setStatusFilter('LOW_STOCK'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${statusFilter === 'LOW_STOCK' ? 'text-amber-600 font-semibold' : 'text-slate-700'}`}>Low Stock</button>
              <button onClick={() => { setStatusFilter('OUT_OF_STOCK'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${statusFilter === 'OUT_OF_STOCK' ? 'text-red-600 font-semibold' : 'text-slate-700'}`}>Out of Stock</button>
            </div>
          )}

          {missingBarcodeCount > 0 && (
            <button 
              onClick={handleBulkGenerateBarcodes}
              disabled={generatingBarcodes}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-sm shadow-indigo-500/20 transition-all disabled:opacity-50"
              title="Generate unique barcodes for all medicines missing barcodes"
            >
              {generatingBarcodes ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2 text-amber-300" />}
              Auto-Barcode ({missingBarcodeCount})
            </button>
          )}

          {missingBatchCount > 0 && (
            <button 
              onClick={handleBulkInitializeBatches}
              disabled={initializingBatches}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 shadow-sm shadow-emerald-500/20 transition-all disabled:opacity-50"
              title="Auto-create initial batches for all medicines missing batches"
            >
              {initializingBatches ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Package className="w-4 h-4 mr-2 text-white" />}
              Auto-Batches ({missingBatchCount})
            </button>
          )}


          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-pharmacy-600 text-white rounded-lg text-sm font-medium hover:bg-pharmacy-700 shadow-sm shadow-pharmacy-500/30 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Medicine
          </button>
        </div>
      </div>

      {/* Module Tabs Navigation */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveInventoryTab('STOCK')}
          className={`flex items-center px-5 py-2.5 font-bold text-xs rounded-xl transition-all ${
            activeInventoryTab === 'STOCK'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4 mr-2" />
          Catalogue & Stock
        </button>

        <button
          onClick={() => setActiveInventoryTab('EXPIRY_RETURNS')}
          className={`flex items-center px-5 py-2.5 font-bold text-xs rounded-xl transition-all ${
            activeInventoryTab === 'EXPIRY_RETURNS'
              ? 'bg-white text-red-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
          Expiry & Return to Distributor
          {expiringSoonCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700">
              {expiringSoonCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveInventoryTab('CSV_IMPORT')}
          className={`flex items-center px-5 py-2.5 font-bold text-xs rounded-xl transition-all ${
            activeInventoryTab === 'CSV_IMPORT'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderSync className="w-4 h-4 mr-2 text-emerald-500" />
          Marg & Excel Smart Migration
        </button>

        <button
          onClick={() => setActiveInventoryTab('DEAD_STOCK')}
          className={`flex items-center px-5 py-2.5 font-bold text-xs rounded-xl transition-all ${
            activeInventoryTab === 'DEAD_STOCK'
              ? 'bg-white text-rose-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Flame className="w-4 h-4 mr-2 text-rose-500" />
          Dead Stock & Clearance
        </button>
      </div>

      {activeInventoryTab === 'EXPIRY_RETURNS' ? (
        <ExpiryReturnModule fallbackMedicines={medicines} onStockUpdated={loadInitialData} />
      ) : activeInventoryTab === 'CSV_IMPORT' ? (
        <DistributorCsvImport onSuccess={() => { loadInitialData(); setActiveInventoryTab('STOCK'); }} />
      ) : activeInventoryTab === 'DEAD_STOCK' ? (
        <DeadStockModule pharmacy={pharmacy} onOpenReturnModule={() => setActiveInventoryTab('EXPIRY_RETURNS')} />
      ) : (
        <>
          {/* Smart Insight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[2rem] -mr-8 -mt-8 transition-transform group-hover:scale-110 pointer-events-none"></div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform self-start relative z-10 shadow-sm border border-blue-100">
            <Package className="w-6 h-6" />
          </div>
          <div className="mt-6 relative z-10">
            <p className="text-sm font-bold text-slate-500 tracking-wide uppercase mb-1">Total Unique Items</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{medicines.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md hover:border-red-200 transition-all cursor-pointer group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-[2rem] -mr-8 -mt-8 transition-transform group-hover:scale-110 pointer-events-none"></div>
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform self-start relative z-10 shadow-sm border border-red-100">
            {lowStockCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="mt-6 relative z-10">
            <p className="text-sm font-bold text-slate-500 tracking-wide uppercase mb-1">Low / Out of Stock</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{lowStockCount}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md hover:border-amber-200 transition-all cursor-pointer group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[2rem] -mr-8 -mt-8 transition-transform group-hover:scale-110 pointer-events-none"></div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform self-start relative z-10 shadow-sm border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
          <div className="mt-6 relative z-10">
            <p className="text-sm font-bold text-slate-500 tracking-wide uppercase mb-1">Expiring Soon (30d)</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{expiringSoonCount}</h3>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pharmacy-50 to-emerald-50 p-6 rounded-[2rem] shadow-sm border border-pharmacy-200 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/50 rounded-bl-[2rem] -mr-8 -mt-8 transition-transform group-hover:scale-110 pointer-events-none"></div>
          <div className="p-3 bg-white text-pharmacy-600 rounded-2xl group-hover:scale-110 transition-transform self-start relative z-10 shadow-sm border border-pharmacy-100">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="mt-6 relative z-10">
            <p className="text-sm font-bold text-pharmacy-700 tracking-wide uppercase mb-1">Smart Reorder</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{smartReorderCount} items</h3>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Smart Data Table Section */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Table Header/Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by medicine name, batch, or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all shadow-sm"
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
              <Loader2 className="w-8 h-8 animate-spin text-pharmacy-500 mb-4" />
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
                  <th className="px-6 py-4">Batches</th>
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
                    suggestionColor = "text-pharmacy-700 font-semibold";
                    iconColor = "text-pharmacy-500";
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
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-xs text-slate-500">{item.category}</span>
                              {item.barcode && (
                                <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded flex items-center">
                                  ðŸ·ï¸ {item.barcode}
                                </span>
                              )}
                            </div>
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
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${expiryStatus}`}>
                            Exp: {expiryLabel}
                          </span>
                          <span className="text-xs text-slate-500">
                            {item.batches?.filter(b => b.availableQuantity > 0).length || 0} Active Batches
                          </span>
                        </div>
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
                              className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-medium text-sm transition-colors flex items-center gap-1.5 group whitespace-nowrap px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm"
                            >
                              Auto-Order
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </button>
                          )}
                          <button 
                            onClick={() => setViewBatchesMed(item)}
                            className="text-pharmacy-600 hover:text-pharmacy-900 font-medium text-sm transition-colors bg-pharmacy-50 hover:bg-pharmacy-100 px-3 py-1.5 rounded-lg"
                          >
                            Batches
                          </button>
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
        </>
      )}
      
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
          <div className="bg-white rounded-[2rem] shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-pharmacy-100 text-pharmacy-600 mb-4">
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
                            className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-pharmacy-50 transition-colors ${selectedDistributorId === '' ? 'bg-pharmacy-50 text-pharmacy-700 font-bold' : 'text-slate-600'}`}
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
                              className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-pharmacy-50 transition-colors ${selectedDistributorId === d.id ? 'bg-pharmacy-50 text-pharmacy-700 font-bold' : 'text-slate-700'}`}
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
                  className="flex-1 px-4 py-2 bg-pharmacy-600 text-white rounded-lg font-medium hover:bg-pharmacy-700 transition-colors shadow-sm"
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
          <div className="bg-white rounded-[2rem] shadow-xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
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

      {viewBatchesMed && (
        <MedicineBatchesModal
          medicine={viewBatchesMed}
          pharmacyName={pharmacy?.name || 'K.Y Pharmacy'}
          isOpen={!!viewBatchesMed}
          onClose={() => setViewBatchesMed(null)}
          onUpdate={loadInitialData}
        />
      )}
      
    </div>
  );
}
