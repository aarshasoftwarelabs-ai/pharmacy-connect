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
  X
} from 'lucide-react';
import { bulkImportMedicines } from '../../services/medicineService';

interface ParsedMedicineRow {
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

export default function DistributorCsvImport({ onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedMedicineRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ importedCount: number; totalStockAdded: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download Sample CSV
  const handleDownloadSample = () => {
    const csvHeader = 'Medicine Name,Generic Name,Category,Batch Number,Expiry Date,Quantity,Purchase Rate,MRP,Selling Price,GST %,HSN Code,Barcode\n';
    const sampleRows = [
      'Dolo 650mg Tablet,Paracetamol,Analgesic,DL9841,2027-09-30,100,24.50,33.60,30.00,12,300490,890103600123',
      'Pan 40mg Tablet,Pantoprazole,Antacid,PN4021,2027-12-31,60,82.00,110.00,105.00,12,300490,890103600456',
      'Azithral 500mg Tablet,Azithromycin,Antibiotic,AZ7710,2026-11-30,40,95.00,132.00,125.00,12,300490,890103600789',
      'Cetzine 10mg Tablet,Cetirizine,Antihistamine,CZ1082,2028-03-31,150,18.00,24.00,22.00,12,300490,890103600321',
      'Augmentin 625 Duo,Amoxycillin and Clavulanate,Antibiotic,AG6251,2026-08-31,30,140.00,195.00,180.00,12,300490,890103600654'
    ].join('\n');

    const blob = new Blob([csvHeader + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Distributor_Medicine_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Robust CSV parser
  const parseCSVText = (text: string): ParsedMedicineRow[] => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV file is empty or missing data rows');
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

    const findIndex = (keywords: string[]) => {
      return headers.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const idxName = findIndex(['medicine name', 'product name', 'item name', 'name', 'medicine', 'product']);
    const idxGeneric = findIndex(['generic', 'composition', 'salt']);
    const idxCategory = findIndex(['category', 'type', 'form']);
    const idxBatch = findIndex(['batch number', 'batch no', 'batch']);
    const idxExpiry = findIndex(['expiry date', 'exp date', 'expiry', 'exp']);
    const idxQty = findIndex(['quantity', 'qty', 'units', 'stock']);
    const idxPurchase = findIndex(['purchase rate', 'purchase price', 'cost price', 'rate', 'cost', 'pts']);
    const idxMrp = findIndex(['mrp', 'max retail']);
    const idxSelling = findIndex(['selling price', 'sale price', 'retail price', 'ptr']);
    const idxGst = findIndex(['gst', 'tax', 'vat']);
    const idxHsn = findIndex(['hsn', 'sac']);
    const idxBarcode = findIndex(['barcode', 'upc', 'ean']);

    if (idxName === -1) {
      throw new Error('Could not find "Medicine Name" column in CSV file');
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
        } else if (c === ',' && !inQuotes) {
          values.push(curr.trim().replace(/^["']|["']$/g, ''));
          curr = '';
        } else {
          curr += c;
        }
      }
      values.push(curr.trim().replace(/^["']|["']$/g, ''));

      const name = values[idxName]?.trim() || '';
      const qty = parseInt(values[idxQty] || '0', 10);
      const purchasePrice = parseFloat(values[idxPurchase] || '0');
      const mrp = parseFloat(values[idxMrp] || '0');
      const sellingPrice = parseFloat(values[idxSelling] || '0') || (mrp > 0 ? mrp : purchasePrice * 1.25);
      const gstRate = parseFloat(values[idxGst] || '12');

      let isValid = true;
      let validationError = '';

      if (!name) {
        isValid = false;
        validationError = 'Medicine Name is required';
      } else if (isNaN(qty) || qty <= 0) {
        isValid = false;
        validationError = 'Valid Quantity (> 0) is required';
      }

      // Format Expiry Date if MM/YY or MM/YYYY
      let expDate = idxExpiry !== -1 ? values[idxExpiry]?.trim() : '';
      if (expDate && /^\d{1,2}\/\d{2,4}$/.test(expDate)) {
        const parts = expDate.split('/');
        const month = parts[0].padStart(2, '0');
        let year = parts[1];
        if (year.length === 2) year = `20${year}`;
        expDate = `${year}-${month}-28`;
      }

      rows.push({
        name,
        genericName: idxGeneric !== -1 ? values[idxGeneric]?.trim() : '',
        category: idxCategory !== -1 ? values[idxCategory]?.trim() : 'Tablets',
        batchNumber: idxBatch !== -1 ? values[idxBatch]?.trim() : `BAT-${Date.now().toString().slice(-4)}`,
        expiryDate: expDate || undefined,
        quantity: isNaN(qty) ? 0 : qty,
        purchasePrice: isNaN(purchasePrice) ? 0 : purchasePrice,
        mrp: isNaN(mrp) ? 0 : mrp,
        sellingPrice: isNaN(sellingPrice) ? 0 : sellingPrice,
        gstRate: isNaN(gstRate) ? 12 : gstRate,
        hsnCode: idxHsn !== -1 ? values[idxHsn]?.trim() : '3004',
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
        setParsedRows(parsed);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file');
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
      alert('No valid medicine rows to import.');
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

      // Reset file and trigger inventory refresh
      setParsedRows([]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to complete bulk inventory import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center">
            <FileSpreadsheet className="w-6 h-6 mr-2.5 text-emerald-600" />
            Distributor Purchase CSV / Excel Import
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Instantly upload bulk stock (100–200+ medicines) from distributor purchase bills in 1 click instead of typing each item manually.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadSample}
          className="flex items-center px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl transition-all shadow-xs shrink-0"
        >
          <Download className="w-4 h-4 mr-1.5 text-emerald-600" />
          Download Sample Template (.CSV)
        </button>
      </div>

      {importResult && (
        <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mr-3 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-900 text-base">Bulk Stock Import Complete!</h4>
              <p className="text-xs text-emerald-700">
                Successfully added <strong>{importResult.importedCount} medicines</strong> ({importResult.totalStockAdded} total stock units) directly into your inventory catalogue & batch records.
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

      {/* Upload Zone */}
      {parsedRows.length === 0 ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
            <Upload className="w-8 h-8" />
          </div>

          <h4 className="text-lg font-bold text-slate-800 mb-1">Click to Upload Distributor Purchase CSV</h4>
          <p className="text-xs text-slate-500 max-w-sm text-center">
            Upload your supplier bill CSV containing medicine names, quantities, batches, and purchase rates.
          </p>

          <div className="mt-4 inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
            Supports Standard CSV, Excel CSV exports, and TSV files
          </div>
        </div>
      ) : (
        /* Preview & Confirmation Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base">{file?.name}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {validRows.length} Valid Rows
                </span>
                {parsedRows.length - validRows.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                    {parsedRows.length - validRows.length} Errors
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Review extracted data below before committing to stock.
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
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl bg-white hover:bg-slate-50"
              >
                Cancel & Upload Another
              </button>

              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={importing || validRows.length === 0}
                className="flex items-center px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Importing {validRows.length} Medicines...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Commit {validRows.length} Items to Stock
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Summary Pill Bar */}
          <div className="px-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Items</span>
              <p className="text-lg font-black text-slate-800">{validRows.length} Medicines</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Quantity Units</span>
              <p className="text-lg font-black text-indigo-600">{totalUnits} Units</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Purchase Value</span>
              <p className="text-lg font-black text-emerald-600">₹{totalPurchaseValue.toFixed(2)}</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar border-t border-slate-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                <tr className="font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-4">Batch No</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">Purchase (₹)</th>
                  <th className="py-3 px-4 text-right">MRP (₹)</th>
                  <th className="py-3 px-4 text-right">Selling (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className={row.isValid ? 'hover:bg-slate-50/80' : 'bg-red-50/40'}>
                    <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {row.name || <span className="text-red-500 italic">Missing Name</span>}
                      {row.category && <span className="block text-[10px] text-slate-400 font-normal">{row.category}</span>}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{row.batchNumber || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{row.expiryDate || '-'}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">{row.quantity}</td>
                    <td className="py-3 px-4 text-right text-slate-700">₹{(row.purchasePrice || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-slate-700">₹{(row.mrp || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{(row.sellingPrice || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      {row.isValid ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Valid
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800" title={row.validationError}>
                          Error
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors"
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
