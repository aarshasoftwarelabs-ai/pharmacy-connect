import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Tag, 
  Sliders, 
  Layers, 
  Copy, 
  Check, 
  Store,
  Sparkles
} from 'lucide-react';
import { Medicine } from '../../types/medicine';
import { generateBarcodeSvg, generateBarcodeDataUrl } from '../../utils/barcodeGenerator';

interface BarcodeStickerModalProps {
  medicine: Medicine;
  pharmacyId?: number;
  pharmacyName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function BarcodeStickerModal({
  medicine,
  pharmacyId,
  pharmacyName = 'K.Y Pharmacy',
  isOpen,
  onClose
}: BarcodeStickerModalProps) {
  const [printQty, setPrintQty] = useState<number>(1);
  const [labelSize, setLabelSize] = useState<'THERMAL_50x25' | 'THERMAL_38x25' | 'A4_SHEET'>('THERMAL_50x25');
  const [selectedBatchIndex, setSelectedBatchIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const effectivePharmacyId = pharmacyId ?? medicine.pharmacyId ?? 1;
  const barcodeText = medicine.barcode || `890${String(effectivePharmacyId).padStart(3, '0')}${String(medicine.id).padStart(5, '0')}0`;
  const selectedBatch = medicine.batches && medicine.batches.length > 0 
    ? medicine.batches[selectedBatchIndex] 
    : null;

  const batchNumber = selectedBatch?.batchNumber || 'B2401';
  const expiryDate = selectedBatch?.expiryDate 
    ? new Date(selectedBatch.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' })
    : (medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' }) : '12/26');
  
  const mrpValue = selectedBatch?.mrp || medicine.sellingPrice || 0;

  const barcodeSvgHtml = generateBarcodeSvg(barcodeText, {
    height: 40,
    moduleWidth: 2,
    includeText: true,
    fontSize: 10
  });

  const barcodeDataUrl = generateBarcodeDataUrl(barcodeText, {
    height: 40,
    moduleWidth: 2,
    includeText: true
  });

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(barcodeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print barcode stickers.');
      return;
    }

    const isThermal = labelSize.startsWith('THERMAL');
    const widthMm = labelSize === 'THERMAL_38x25' ? '38mm' : '50mm';
    const heightMm = '25mm';

    const stickersArray = Array.from({ length: Math.max(1, printQty) });

    const stickersHtml = stickersArray.map(() => `
      <div class="sticker">
        <div class="store-name">${pharmacyName}</div>
        <div class="med-name">${medicine.name}</div>
        <div class="meta-row">
          <span>B: ${batchNumber}</span>
          <span>EXP: ${expiryDate}</span>
          <span class="mrp">MRP: ₹${Number(mrpValue).toFixed(2)}</span>
        </div>
        <div class="barcode-box">
          ${barcodeSvgHtml}
        </div>
      </div>
    `).join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sticker - ${medicine.name}</title>
          <style>
            @page {
              size: ${isThermal ? `${widthMm} ${heightMm}` : 'A4'};
              margin: ${isThermal ? '0' : '8mm'};
            }
            body {
              margin: 0;
              padding: ${isThermal ? '1mm' : '4mm'};
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background: #fff;
              color: #000;
              -webkit-print-color-adjust: exact;
            }
            .grid-container {
              display: flex;
              flex-wrap: wrap;
              gap: 2mm;
            }
            .sticker {
              width: ${widthMm};
              height: ${heightMm};
              box-sizing: border-box;
              padding: 1.5mm 2mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              text-align: center;
              border: ${isThermal ? 'none' : '1px dashed #ccc'};
              page-break-inside: avoid;
              overflow: hidden;
            }
            .store-name {
              font-size: 7pt;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              line-height: 1;
              color: #111;
            }
            .med-name {
              font-size: 8pt;
              font-weight: 900;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              line-height: 1.1;
              margin: 0.5mm 0;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              font-size: 6.5pt;
              font-weight: 700;
              line-height: 1;
              color: #222;
              margin-bottom: 0.5mm;
            }
            .meta-row .mrp {
              font-weight: 900;
            }
            .barcode-box {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 12mm;
              overflow: hidden;
            }
            .barcode-box svg {
              width: 100%;
              height: 100%;
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            ${stickersHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <Tag className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Print Barcode Sticker</h2>
              <p className="text-xs text-slate-400">{medicine.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* 1. Live Sticker Preview Card */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
              Sticker Live Preview (Real Sticker Size)
            </label>
            <div className="flex justify-center p-4 bg-slate-100 rounded-2xl border border-slate-200">
              {/* Actual Sticker Box */}
              <div className="w-[280px] bg-white rounded-xl shadow-md border-2 border-indigo-200 p-3 flex flex-col justify-between text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-indigo-600 text-[9px] font-black text-white px-2 py-0.5 rounded-bl-lg">
                  STORE BARCODE
                </div>

                <div className="text-[10px] font-extrabold uppercase tracking-wide text-slate-600 truncate mt-1">
                  {pharmacyName}
                </div>

                <div className="text-xs font-black text-slate-900 truncate my-1">
                  {medicine.name}
                </div>

                <div className="flex justify-between text-[10px] font-extrabold text-slate-700 px-1 mb-1">
                  <span>B: {batchNumber}</span>
                  <span>EXP: {expiryDate}</span>
                  <span className="text-emerald-700 font-black">MRP: ₹{Number(mrpValue).toFixed(2)}</span>
                </div>

                {/* Barcode Graphic */}
                <div 
                  className="w-full h-14 flex items-center justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: barcodeSvgHtml }}
                />
              </div>
            </div>
          </div>

          {/* 2. Barcode Details Pill */}
          <div className="flex items-center justify-between p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-900">Code:</span>
              <span className="font-mono text-xs font-black text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                {barcodeText}
              </span>
            </div>
            <button
              onClick={handleCopyBarcode}
              className="flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                </>
              )}
            </button>
          </div>

          {/* 3. Batch Selection if medicine has multiple batches */}
          {medicine.batches && medicine.batches.length > 1 && (
            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Select Batch for Sticker
              </label>
              <select
                value={selectedBatchIndex}
                onChange={(e) => setSelectedBatchIndex(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {medicine.batches.map((b, idx) => (
                  <option key={b.id || idx} value={idx}>
                    Batch: {b.batchNumber} • Exp: {b.expiryDate} • MRP: ₹{b.mrp || medicine.sellingPrice} (Stock: {b.availableQuantity || b.quantity})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 4. Printer Label Format & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Label / Paper Size
              </label>
              <select
                value={labelSize}
                onChange={(e) => setLabelSize(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="THERMAL_50x25">50mm x 25mm (Standard Label)</option>
                <option value="THERMAL_38x25">38mm x 25mm (Small Strip Label)</option>
                <option value="A4_SHEET">A4 Sticker Sheet (Multiple per page)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Stickers Quantity
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={printQty}
                  onChange={(e) => setPrintQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex space-x-1">
                  {[5, 10, 20].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPrintQty(n)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-600 transition-colors"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/30 transition-all"
          >
            <Printer className="w-4 h-4 mr-2" /> Print {printQty} Sticker{printQty > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
