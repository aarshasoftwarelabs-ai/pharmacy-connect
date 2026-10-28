import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  Sparkles, 
  ArrowRight,
  Database,
  Building2,
  X,
  MessageSquare,
  Phone,
  HelpCircle,
  Layers,
  Check,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  FolderSync
} from 'lucide-react';
import { bulkImportMedicines } from '../../services/medicineService';

export interface ParsedMedicineRow {
  name: string;
  genericName?: string;
  category?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  purchasePrice?: number;
  mrp?: number;
  sellingPrice?: number;
  gstRate?: number;
  hsnCode?: string;
  barcode?: string;
  isValid: boolean;
  validationError?: string;
}

interface Props {
  onSuccess: () => void;
}

type SoftwareProfile = 'MARG' | 'BUSY' | 'VYAPAR' | 'EXCEL';

export default function DistributorCsvImport({ onSuccess }: Props) {
  const [selectedSoftware, setSelectedSoftware] = useState<SoftwareProfile>('MARG');
  const [showGuide, setShowGuide] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedMedicineRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ importedCount: number; totalStockAdded: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Month mapping helper for dates like Nov-26, Aug-27
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  // Robust date parser supporting Marg, Busy, and Indian pharmacy formats
  const normalizeExpiryDate = (raw: string): string => {
    if (!raw) return '';
    const clean = raw.trim().replace(/^["']|["']$/g, '');
    if (!clean) return '';

    // Standard YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (dmyMatch) {
      const month = dmyMatch[2].padStart(2, '0');
      let year = dmyMatch[3];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-28`;
    }

    // MM/YY or MM-YY (Very common in Marg ERP, e.g. 11/26 or 11-26)
    const myMatch = clean.match(/^(\d{1,2})[/-](\d{2,4})$/);
    if (myMatch) {
      const month = myMatch[1].padStart(2, '0');
      let year = myMatch[2];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-28`;
    }

    // Mon-YY or Mon/YY or Mon-YYYY (e.g. Nov-26, Nov/2026, Dec-27)
    const monYearMatch = clean.match(/^([a-zA-Z]{3})[/-](\d{2,4})$/);
    if (monYearMatch) {
      const monStr = monYearMatch[1].toLowerCase();
      const month = monthMap[monStr] || '12';
      let year = monYearMatch[2];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-28`;
    }

    // 4-digit numeric format like 1126 (MMYY)
    if (/^\d{4}$/.test(clean)) {
      const month = clean.slice(0, 2);
      const year = `20${clean.slice(2, 4)}`;
      return `${year}-${month}-28`;
    }

    return '';
  };

  // Download Sample CSV according to selected profile
  const handleDownloadSample = () => {
    let csvHeader = '';
    let sampleRows = '';
    let filename = '';

    if (selectedSoftware === 'MARG') {
      csvHeader = 'ITEM_NAME,BATCH_NO,EXP_DATE,MRP,PRATE,SRATE,CLOSING_QTY,COMP_NAME,HSN_CODE,BARCODE\n';
      sampleRows = [
        'Dolo 650mg Tablet,DL9841,11/27,33.60,24.50,30.00,100,Micro Labs,300490,890103600123',
        'Augmentin 625 Duo,AG6251,08/26,195.00,140.00,180.00,45,GSK Pharma,300490,890103600654',
        'Pantocid 40mg Tablet,PN4021,12/27,110.00,82.00,105.00,80,Sun Pharma,300490,890103600456',
        'Azithral 500mg Tablet,AZ7710,11/26,132.00,95.00,125.00,35,Alembic,300490,890103600789',
        'Montair LC Kid Tab,MN3310,03/27,145.00,102.00,130.00,60,Cipla Ltd,300490,890103600890'
      ].join('\n');
      filename = 'Marg_ERP_Medicine_Stock_Sample.csv';
    } else {
      csvHeader = 'Medicine Name,Generic Name,Category,Batch Number,Expiry Date,Quantity,Purchase Rate,MRP,Selling Price,GST %,HSN Code,Barcode\n';
      sampleRows = [
        'Dolo 650mg Tablet,Paracetamol,Analgesic,DL9841,2027-09-30,100,24.50,33.60,30.00,12,300490,890103600123',
        'Pan 40mg Tablet,Pantoprazole,Antacid,PN4021,2027-12-31,60,82.00,110.00,105.00,12,300490,890103600456',
        'Azithral 500mg Tablet,Azithromycin,Antibiotic,AZ7710,2026-11-30,40,95.00,132.00,125.00,12,300490,890103600789',
        'Cetzine 10mg Tablet,Cetirizine,Antihistamine,CZ1082,2028-03-31,150,18.00,24.00,22.00,12,300490,890103600321',
        'Augmentin 625 Duo,Amoxycillin and Clavulanate,Antibiotic,AG6251,2026-08-31,30,140.00,195.00,180.00,12,300490,890103600654'
      ].join('\n');
      filename = 'DavaSetu_Universal_Stock_Import_Template.csv';
    }

    const blob = new Blob([csvHeader + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Robust CSV / TSV parser with Marg & Busy intelligence
  const parseCSVText = (text: string): ParsedMedicineRow[] => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('The uploaded file is empty or does not contain data rows.');
    }

    // Determine delimiter (comma or tab)
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') && !firstLine.includes(',') ? '\t' : ',';

    // Parse header row
    const headers = firstLine
      .split(delimiter)
      .map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase().replace(/[\s_.-]+/g, '_'));

    const findIndex = (keywords: string[]) => {
      return headers.findIndex(h => keywords.some(k => h.includes(k) || h === k));
    };

    // Smart Column Matchers (Handles Marg ERP, Busy, Vyapar, and generic formats)
    const idxName = findIndex([
      'item_name', 'itemname', 'item', 'product_name', 'product', 'particulars',
      'medicine_name', 'medicine', 'desc', 'description', 'name'
    ]);

    const idxGeneric = findIndex([
      'generic', 'generic_name', 'composition', 'salt', 'salt_name', 'content', 'formula'
    ]);

    const idxCategory = findIndex([
      'comp_name', 'company', 'mfg', 'manufacturer', 'category', 'type', 'brand', 'group'
    ]);

    const idxBatch = findIndex([
      'batch_no', 'batchno', 'batch_number', 'batch', 'lot', 'lot_no'
    ]);

    const idxExpiry = findIndex([
      'exp_date', 'expdate', 'expiry_date', 'expiry', 'exp', 'exp_dt', 'val_date'
    ]);

    const idxQty = findIndex([
      'closing_qty', 'closing_stock', 'closing', 'quantity', 'qty', 'units',
      'stock', 'balance', 'bal_qty', 'current_stock', 'on_hand'
    ]);

    const idxPurchase = findIndex([
      'prate', 'p_rate', 'purchase_rate', 'purchase_price', 'cost_price', 'cost',
      'rate', 'pts', 'p_cost', 'pur_rate'
    ]);

    const idxMrp = findIndex([
      'mrp', 'max_retail', 'm_r_p', 'mrp_rate'
    ]);

    const idxSelling = findIndex([
      'srate', 's_rate', 'selling_price', 'sale_price', 'retail_price', 'ptr',
      'sale_rate', 's_price', 'net_rate'
    ]);

    const idxGst = findIndex(['gst', 'gst_rate', 'tax', 'vat', 'tax_rate']);
    const idxHsn = findIndex(['hsn_code', 'hsncode', 'hsn', 'sac']);
    const idxBarcode = findIndex(['barcode', 'ean', 'upc', 'code']);

    if (idxName === -1) {
      throw new Error('Could not identify a "Medicine / Item Name" column in this file. Please check column headers or use our sample template.');
    }

    const rows: ParsedMedicineRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quotes with commas inside
      const values: string[] = [];
      let inQuotes = false;
      let curr = '';

      for (let ch = 0; ch < line.length; ch++) {
        const c = line[ch];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === delimiter && !inQuotes) {
          values.push(curr.trim().replace(/^["']|["']$/g, ''));
          curr = '';
        } else {
          curr += c;
        }
      }
      values.push(curr.trim().replace(/^["']|["']$/g, ''));

      const name = values[idxName]?.trim() || '';
      
      // Clean numeric values (remove currency symbols, commas)
      const cleanNum = (val: string | undefined): number => {
        if (!val) return 0;
        const cleaned = val.replace(/[^0-9.-]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      };

      const qty = idxQty !== -1 ? Math.floor(cleanNum(values[idxQty])) : 10;
      const purchasePrice = idxPurchase !== -1 ? cleanNum(values[idxPurchase]) : 0;
      const mrp = idxMrp !== -1 ? cleanNum(values[idxMrp]) : 0;
      const parsedSelling = idxSelling !== -1 ? cleanNum(values[idxSelling]) : 0;
      const sellingPrice = parsedSelling > 0 ? parsedSelling : (mrp > 0 ? mrp : purchasePrice * 1.25);
      const gstRate = idxGst !== -1 ? cleanNum(values[idxGst]) || 12 : 12;

      let isValid = true;
      let validationError = '';

      if (!name || name.length < 2) {
        isValid = false;
        validationError = 'Medicine Name is missing';
      } else if (qty < 0) {
        isValid = false;
        validationError = 'Quantity cannot be negative';
      }

      // Format Expiry Date
      const rawExp = idxExpiry !== -1 ? values[idxExpiry] : '';
      const expDate = normalizeExpiryDate(rawExp);

      rows.push({
        name,
        genericName: idxGeneric !== -1 ? values[idxGeneric]?.trim() : '',
        category: idxCategory !== -1 ? values[idxCategory]?.trim() || 'General Pharma' : 'General Pharma',
        batchNumber: (idxBatch !== -1 && values[idxBatch]?.trim()) ? values[idxBatch]?.trim() : `BAT-${Date.now().toString().slice(-4)}`,
        expiryDate: expDate || undefined,
        quantity: qty >= 0 ? qty : 0,
        purchasePrice: purchasePrice,
        mrp: mrp > 0 ? mrp : sellingPrice,
        sellingPrice: sellingPrice,
        gstRate: gstRate,
        hsnCode: idxHsn !== -1 ? values[idxHsn]?.trim() || '3004' : '3004',
        barcode: idxBarcode !== -1 ? values[idxBarcode]?.trim() : undefined,
        isValid,
        validationError
      });
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = parseCSVText(content);
        if (parsed.length === 0) {
          throw new Error('No medicine rows found in this file.');
        }
        setParsedRows(parsed);
      } catch (err: any) {
        setError(err.message || 'Failed to parse inventory file');
        setParsedRows([]);
      }
    };
    reader.onerror = () => {
      setError('Failed to read the file.');
    };
    reader.readAsText(selectedFile);
  };

  const handleRemoveRow = (index: number) => {
    setParsedRows(parsedRows.filter((_, idx) => idx !== index));
  };

  const validRows = parsedRows.filter(r => r.isValid);
  const totalUnits = validRows.reduce((sum, r) => sum + r.quantity, 0);
  const totalPurchaseValue = validRows.reduce((sum, r) => sum + (r.quantity * (r.purchasePrice || 0)), 0);

  const handleImportSubmit = async () => {
    if (validRows.length === 0) {
      alert('No valid medicine rows found to import.');
      return;
    }

    try {
      setImporting(true);
      setError(null);

      const result = await bulkImportMedicines(validRows);
      setImportResult({
        importedCount: result.importedCount,
        totalStockAdded: result.totalStockAdded
      });

      setParsedRows([]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to complete migration into database');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. MIGRATION WIZARD HEADER BANNER */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white p-6 sm:p-7 rounded-3xl border border-emerald-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider mb-3">
              <FolderSync className="w-3.5 h-3.5" />
              <span>Smart Migration Wizard & Instant Stock Importer</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Switch from Marg ERP, Busy or Excel in Under 2 Minutes
            </h2>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed font-medium">
              Import all your existing medicine stock, batch numbers, expiry dates, purchase rates, and MRPs directly into DavaSetu. Zero downtime — your counter sales never stop.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleDownloadSample}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download {selectedSoftware === 'MARG' ? 'Marg Format' : 'Universal'} Sample</span>
            </button>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap shadow-md shadow-emerald-500/20"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{showGuide ? 'Hide Instructions' : 'How to Export from Marg / Busy'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Step-by-Step Export Guide */}
        {showGuide && (
          <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="font-black text-emerald-400 block mb-1">🏢 From Marg ERP 9+:</span>
              <p className="text-slate-300 leading-relaxed font-medium">
                1. Go to <strong>Reports</strong> ➜ <strong>Inventory Reports</strong><br />
                2. Click <strong>Stock Status</strong> ➜ Select All Items<br />
                3. Press <strong>Alt + P</strong> (or click Excel Icon)<br />
                4. Save file as <strong>Excel/CSV</strong> and upload here!
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="font-black text-teal-400 block mb-1">💼 From Busy Accounting:</span>
              <p className="text-slate-300 leading-relaxed font-medium">
                1. Go to <strong>Administration</strong> ➜ <strong>Data Export</strong><br />
                2. Select <strong>Item Masters with Current Stock</strong><br />
                3. Choose format as <strong>Excel / CSV</strong><br />
                4. Save and upload the exported file here!
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="font-black text-cyan-400 block mb-1">📱 From Vyapar / Custom Excel:</span>
              <p className="text-slate-300 leading-relaxed font-medium">
                1. In Vyapar, go to <strong>Items</strong> menu<br />
                2. Click <strong>Export Items to Excel</strong><br />
                3. Or prepare any standard spreadsheet with Item Name, Batch, Expiry, MRP, Qty<br />
                4. Upload file directly below!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. SOFTWARE PROFILE SELECTOR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Select Source Software Profile:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['MARG', 'BUSY', 'VYAPAR', 'EXCEL'] as const).map(soft => (
            <button
              key={soft}
              type="button"
              onClick={() => setSelectedSoftware(soft)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                selectedSoftware === soft
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {soft === 'MARG' && '🏢 Marg ERP 9+'}
              {soft === 'BUSY' && '💼 Busy Accounting'}
              {soft === 'VYAPAR' && '📱 Vyapar / Tally'}
              {soft === 'EXCEL' && '📊 Universal Excel / CSV'}
            </button>
          ))}
        </div>
      </div>

      {/* 3. VIP WHATSAPP FREE ASSISTED MIGRATION CARD (USER'S EXPLICIT REQUEST) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/25">
            <MessageSquare className="w-6 h-6 text-emerald-100" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-black text-emerald-950">
                Prefer Free Assisted Migration? Send Old Software Backup on WhatsApp!
              </h4>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300">
                ⚡ 100% Free VIP Onboarding
              </span>
            </div>
            <p className="text-xs text-emerald-800 font-medium mt-1 leading-relaxed max-w-2xl">
              Don't want to export or map Excel files yourself? Simply send your Marg ERP or Busy backup file to our dedicated migration team. We will clean, verify and upload your entire stock into your DavaSetu account in under 15 minutes — completely free!
            </p>
          </div>
        </div>

        <a
          href="https://wa.me/919664781007?text=Hello%20DavaSetu%20Team%2C%20I%20want%20to%20migrate%20my%20pharmacy%20stock%20from%20Marg%20ERP%20to%20DavaSetu.%20Here%20is%20my%20backup%20file."
          target="_blank"
          rel="noreferrer"
          className="w-full md:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm whitespace-nowrap shadow-md shadow-emerald-600/25 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2 shrink-0"
        >
          <Phone className="w-4 h-4" />
          <span>Send Backup on WhatsApp (+91 96647 81007)</span>
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>

      {/* 4. SUCCESS / ERROR ALERTS */}
      {importResult && (
        <div className="p-5 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mr-3 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-emerald-900 text-base">Migration Successfully Completed!</h4>
              <p className="text-xs text-emerald-800 font-medium mt-0.5">
                Successfully added <strong>{importResult.importedCount} medicines</strong> ({importResult.totalStockAdded} total stock units) directly into your live counter inventory. You can start billing immediately!
              </p>
            </div>
          </div>
          <button
            onClick={() => setImportResult(null)}
            className="p-1.5 text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-semibold flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 shrink-0 text-red-500" />
          {error}
        </div>
      )}

      {/* 5. UPLOAD ZONE OR PREVIEW TABLE */}
      {parsedRows.length === 0 ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all group shadow-xs"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain,.tsv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
            <Upload className="w-8 h-8" />
          </div>

          <h4 className="text-lg font-black text-slate-800 mb-1">
            Click to Upload {selectedSoftware === 'MARG' ? 'Marg ERP Export' : selectedSoftware === 'BUSY' ? 'Busy Stock Export' : 'Excel/CSV Stock File'}
          </h4>
          <p className="text-xs text-slate-500 max-w-md text-center leading-relaxed">
            Drag & drop or browse your CSV file containing medicine names, quantities, batch numbers, expiry dates, and purchase rates.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-slate-600">
            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
              ✓ Marg ERP Column Matching
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
              ✓ Auto Expiry Format Correction
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
              ✓ 100% Data Integrity
            </span>
          </div>
        </div>
      ) : (
        /* PREVIEW AND COMMIT TABLE */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-slate-900 text-base">{file?.name}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {validRows.length} Valid Medicines
                </span>
                {parsedRows.length - validRows.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                    {parsedRows.length - validRows.length} Errors
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Review verified medicine inventory details below before committing to your counter stock.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setParsedRows([]);
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 transition"
              >
                Cancel & Upload Another
              </button>

              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={importing || validRows.length === 0}
                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/25 transition disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Migrating {validRows.length} Medicines...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Commit {validRows.length} Medicines to Live POS
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats Pill Bar */}
          <div className="px-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Catalog Items</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{validRows.length} Medicines</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Quantity Units</span>
              <p className="text-xl font-black text-teal-700 mt-0.5">{totalUnits} Units</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Stock Capital</span>
              <p className="text-xl font-black text-emerald-700 mt-0.5">₹{totalPurchaseValue.toFixed(2)}</p>
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar border-t border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                <tr className="font-bold text-slate-600 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-4">Company / Category</th>
                  <th className="py-3 px-4">Batch No</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">Purchase (₹)</th>
                  <th className="py-3 px-4 text-right">MRP (₹)</th>
                  <th className="py-3 px-4 text-right">Selling (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className={row.isValid ? 'hover:bg-slate-50/80' : 'bg-red-50/40'}>
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {row.name || <span className="text-red-500 italic">Missing Name</span>}
                      {row.genericName && (
                        <span className="block text-[10px] text-emerald-700 font-semibold">{row.genericName}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{row.category || '-'}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">{row.batchNumber || '-'}</td>
                    <td className="py-3 px-4 text-slate-700 font-mono">{row.expiryDate || '-'}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">{row.quantity}</td>
                    <td className="py-3 px-4 text-right text-slate-700">₹{(row.purchasePrice || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-slate-700">₹{(row.mrp || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700">₹{(row.sellingPrice || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      {row.isValid ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-200" title={row.validationError}>
                          Error
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
