import { Bill } from '../types/billing';

export const generateA4PrintHTML = (
  bill: Bill, 
  pharmacyName: string = 'PharmacyConnect', 
  ownerName: string = 'Owner',
  autoPrint: boolean = true
) => {
  const isOnline = bill.billType === 'ONLINE';

  const brandHeader = isOnline 
    ? `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 40px; height: 40px; background-color: #10b981; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;">+</div>
        <div>
          <h1 style="margin: 0; color: #064e3b; font-size: 28px;">DavaSetu</h1>
          <p style="margin: 0; color: #059669; font-size: 14px; font-weight: 600;">Trusted Online Pharmacy</p>
        </div>
      </div>
    `
    : `
      <div>
        <h1 style="margin: 0; color: #1e293b; font-size: 28px;">${pharmacyName}</h1>
        <p style="margin: 0; color: #475569; font-size: 14px;">Proprietor: <strong>${ownerName}</strong></p>
        <p style="margin: 0; color: #64748b; font-size: 12px; margin-top: 4px;">Thank you for visiting our store!</p>
      </div>
    `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${bill.billNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
          color: #334155;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .a4-container {
          width: 210mm;
          min-height: 297mm;
          padding: 20mm;
          margin: 10mm auto;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          box-sizing: border-box;
        }
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .invoice-details {
          text-align: right;
        }
        .invoice-details h2 {
          margin: 0;
          color: #0f172a;
          font-size: 32px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .invoice-details p {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: #64748b;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .bill-to h3 {
          margin: 0 0 10px 0;
          color: #94a3b8;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .bill-to p {
          margin: 2px 0;
          font-size: 15px;
          color: #0f172a;
        }
        .bill-to .customer-name {
          font-weight: 700;
          font-size: 18px;
        }
        .table-container {
          width: 100%;
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          background-color: #f1f5f9;
          color: #475569;
          font-weight: 600;
          text-align: left;
          padding: 12px 16px;
          font-size: 13px;
          text-transform: uppercase;
        }
        th.text-right {
          text-align: right;
        }
        th.text-center {
          text-align: center;
        }
        td {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          color: #1e293b;
          font-size: 15px;
        }
        td.text-right {
          text-align: right;
        }
        td.text-center {
          text-align: center;
        }
        .summary-section {
          width: 300px;
          margin-left: auto;
          margin-bottom: 50px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          color: #475569;
          font-size: 15px;
        }
        .summary-row.total {
          border-top: 2px solid #cbd5e1;
          margin-top: 8px;
          padding-top: 16px;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }
        .footer {
          text-align: center;
          padding-top: 30px;
          border-top: 1px solid #e2e8f0;
          color: #94a3b8;
          font-size: 13px;
        }
        .footer strong {
          color: #64748b;
        }
        @media print {
          body { background: white; }
          .a4-container { margin: 0; box-shadow: none; padding: 0; width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="a4-container">
        <!-- Header -->
        <div class="header-section">
          ${brandHeader}
          <div class="invoice-details">
            <h2>INVOICE</h2>
            <p><strong>Bill No:</strong> ${bill.billNumber}</p>
            <p><strong>Date:</strong> ${new Date(bill.createdAt).toLocaleDateString()}</p>
            <p><strong>Type:</strong> ${isOnline ? 'App Order (Online)' : 'Direct Sale (POS)'}</p>
          </div>
        </div>

        <!-- Customer Info -->
        <div class="info-section">
          <div class="bill-to">
            <h3>Billed To</h3>
            <p class="customer-name">${bill.customerName}</p>
            ${bill.customerPhone ? `<p>Phone: ${bill.customerPhone}</p>` : ''}
          </div>
        </div>

        <!-- Items Table -->
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th width="5%" class="text-center">Sr.</th>
                <th width="30%">Item Description</th>
                <th width="10%">HSN/SAC</th>
                <th width="10%" class="text-center">Qty</th>
                <th width="10%" class="text-right">Price</th>
                <th width="10%" class="text-right">Taxable</th>
                <th width="10%" class="text-right">CGST</th>
                <th width="10%" class="text-right">SGST</th>
                <th width="15%" class="text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${(bill.items || []).map((item, index) => `
                <tr>
                  <td class="text-center text-slate-500">${index + 1}</td>
                  <td><strong>${item.medicineName}</strong></td>
                  <td class="text-slate-500" style="font-size: 12px;">${item.hsnCode || '-'}</td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right">${Number(item.unitPrice).toFixed(2)}</td>
                  <td class="text-right">${Number(item.taxableAmount || 0).toFixed(2)}</td>
                  <td class="text-right">${Number(item.cgst || 0).toFixed(2)} <br><span style="font-size:10px;color:#94a3b8">@${(item.gstRate || 0)/2}%</span></td>
                  <td class="text-right">${Number(item.sgst || 0).toFixed(2)} <br><span style="font-size:10px;color:#94a3b8">@${(item.gstRate || 0)/2}%</span></td>
                  <td class="text-right"><strong>${Number(item.lineTotal).toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="summary-section">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>₹${Number(bill.subtotal).toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Discount:</span>
            <span style="color: #ef4444;">- ₹${Number(bill.discount).toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Total Taxable Amount:</span>
            <span>₹${Number(bill.totalTaxableAmount || 0).toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Total CGST:</span>
            <span>₹${Number(bill.totalCgst || 0).toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Total SGST:</span>
            <span>₹${Number(bill.totalSgst || 0).toFixed(2)}</span>
          </div>
          <div class="summary-row total">
            <span>Grand Total:</span>
            <span>₹${Number(bill.total).toFixed(2)}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Thank you for choosing us! We wish you a speedy recovery.</p>
          <p><strong>Powered by DavaSetu</strong></p>
        </div>
      </div>
      ${autoPrint ? `<script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>` : ''}
    </body>
    </html>
  `;
};

export const generateThermalPrintHTML = (
  bill: Bill, 
  pharmacyName: string = 'PharmacyConnect',
  widthType: '58MM' | '80MM' = '80MM',
  autoPrint: boolean = true
) => {
  const isOnline = bill.billType === 'ONLINE';
  const displayName = isOnline ? 'DavaSetu Medicals' : pharmacyName;
  const is58mm = widthType === '58MM';
  const paperWidth = is58mm ? '58mm' : '80mm';
  const bodyWidth = is58mm ? '50mm' : '72mm';
  const fontSize = is58mm ? '10px' : '12px';
  const titleSize = is58mm ? '13px' : '16px';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Thermal Receipt - ${bill.billNumber}</title>
      <style>
        @page {
          size: ${paperWidth} auto;
          margin: 0;
        }
        body { 
          font-family: 'Courier New', Courier, monospace; 
          font-size: ${fontSize}; 
          width: ${bodyWidth}; 
          margin: 0 auto; 
          padding: 2mm; 
          color: #000;
          line-height: 1.25;
        }
        .center { text-align: center; }
        .divider { border-bottom: 1px dashed #000; margin: 4px 0; }
        .double-divider { border-bottom: 2px solid #000; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; font-size: inherit; }
        td, th { text-align: left; vertical-align: top; padding: 2px 0; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        @media print {
          html, body { width: ${paperWidth}; margin: 0; padding: 2mm 1mm; }
        }
      </style>
    </head>
    <body>
      <div class="center">
        <h2 style="margin: 0; font-size: ${titleSize}; text-transform: uppercase;">${displayName}</h2>
        <p style="margin: 1px 0; font-size: 9px;">${is58mm ? 'RETAIL PHARMACY SLIP' : 'RETAIL PHARMACY TAX INVOICE'}</p>
        <p style="margin: 2px 0;">Bill No: <strong>${bill.billNumber}</strong></p>
        <p style="margin: 1px 0;">Date: ${new Date(bill.createdAt).toLocaleDateString()} ${new Date(bill.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
      </div>

      <div class="divider"></div>
      <p style="margin: 1px 0;">Customer: <strong>${bill.customerName}</strong></p>
      ${bill.customerPhone ? `<p style="margin: 1px 0;">Phone: ${bill.customerPhone}</p>` : ''}
      <div class="divider"></div>

      <table>
        <thead>
          <tr style="border-bottom: 1px solid #000;">
            <th style="width: 55%;">Item</th>
            <th class="text-right" style="width: 15%;">Qty</th>
            <th class="text-right" style="width: 30%;">Amt</th>
          </tr>
        </thead>
        <tbody>
        ${(bill.items || []).map(item => `
          <tr>
            <td style="word-break: break-word;">
              <strong>${item.medicineName}</strong>
              ${!is58mm && item.hsnCode ? `<br><span style="font-size:9px;color:#555;">HSN:${item.hsnCode}</span>` : ''}
            </td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${Number(item.lineTotal || (item.quantity * item.unitPrice)).toFixed(2)}</td>
          </tr>
        `).join('')}
        </tbody>
      </table>

      <div class="divider"></div>
      <table>
        <tr>
          <td>Subtotal:</td>
          <td class="text-right">₹${Number(bill.subtotal).toFixed(2)}</td>
        </tr>
        ${Number(bill.discount) > 0 ? `
        <tr>
          <td>Discount:</td>
          <td class="text-right">-₹${Number(bill.discount).toFixed(2)}</td>
        </tr>
        ` : ''}
        ${Number(bill.totalGst || 0) > 0 ? `
        <tr>
          <td>GST Included:</td>
          <td class="text-right">₹${Number(bill.totalGst || 0).toFixed(2)}</td>
        </tr>
        ` : ''}
        <tr class="bold" style="font-size: ${titleSize};">
          <td style="padding-top: 4px;">TOTAL:</td>
          <td class="text-right" style="padding-top: 4px;">₹${Number(bill.total).toFixed(2)}</td>
        </tr>
      </table>

      <div class="double-divider"></div>
      <div class="center" style="margin-top: 6px; font-size: 9px;">
        <p style="margin: 1px 0;">Payment: <strong>${bill.paymentStatus || 'PAID'}</strong></p>
        <p style="margin: 2px 0;">Wish you a speedy recovery!</p>
        <p style="margin: 1px 0;">Powered by DavaSetu</p>
      </div>

      ${autoPrint ? `
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
          }, 250);
        };
      </script>
      ` : ''}
    </body>
    </html>
  `;
};

export const generateB2BPrintHTML = (
  bill: Bill, 
  pharmacyName: string = 'PharmacyConnect', 
  ownerName: string = 'Owner',
  autoPrint: boolean = true
) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tax Invoice - ${bill.billNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: white; color: #1e293b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .a4-container { width: 210mm; padding: 15mm; margin: 0 auto; box-sizing: border-box; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        .border-box { border: 1px solid #cbd5e1; padding: 10px; margin-bottom: 10px; }
        .flex { display: flex; justify-content: space-between; }
        .invoice-title { font-size: 20px; font-weight: bold; text-align: center; text-transform: uppercase; margin: 0 0 15px 0; letter-spacing: 2px; border-bottom: 2px solid #000; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px; }
        th { background-color: #f1f5f9; text-transform: uppercase; }
        .totals { width: 300px; margin-left: auto; margin-top: 10px; font-size: 12px; }
        .totals table { margin: 0; }
        .totals td { padding: 4px 8px; border: none; border-bottom: 1px solid #e2e8f0; }
        .footer { font-size: 10px; text-align: center; margin-top: 40px; color: #64748b; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="a4-container">
        <h1 class="invoice-title">Tax Invoice</h1>
        
        <div class="flex" style="margin-bottom: 10px;">
          <div style="width: 50%;">
            <div class="border-box">
              <h3 style="margin: 0 0 5px 0; font-size: 14px;">Seller / Pharmacy</h3>
              <p style="margin: 2px 0; font-size: 16px;" class="font-bold">${pharmacyName}</p>
              <p style="margin: 2px 0; font-size: 11px;">Proprietor: ${ownerName}</p>
              <p style="margin: 2px 0; font-size: 11px;">GSTIN: <strong>24XXXXX0000X1Z5</strong></p>
              <p style="margin: 2px 0; font-size: 11px;">DL No: <strong>GJ-AHD-XXXXX</strong></p>
            </div>
          </div>
          <div style="width: 48%;">
            <div class="border-box">
              <h3 style="margin: 0 0 5px 0; font-size: 14px;">Invoice Details</h3>
              <p style="margin: 2px 0; font-size: 12px;">Invoice No: <strong>${bill.billNumber}</strong></p>
              <p style="margin: 2px 0; font-size: 12px;">Date: <strong>${new Date(bill.createdAt).toLocaleDateString()}</strong></p>
              <p style="margin: 2px 0; font-size: 12px;">Type: <strong>Credit Sale</strong></p>
            </div>
          </div>
        </div>

        <div class="border-box" style="margin-bottom: 15px;">
          <h3 style="margin: 0 0 5px 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Billed To (Buyer)</h3>
          <p style="margin: 2px 0; font-size: 16px;" class="font-bold">${bill.customerName}</p>
          <p style="margin: 2px 0; font-size: 11px;">Phone: ${bill.customerPhone || 'N/A'}</p>
          <p style="margin: 2px 0; font-size: 11px;">GSTIN: <strong>Provided by Client</strong></p>
          <p style="margin: 2px 0; font-size: 11px;">DL No: <strong>Provided by Client</strong></p>
        </div>

        <table>
          <thead>
            <tr>
              <th width="5%">Sr.</th>
              <th width="35%" style="text-align: left;">Product Description (Medicine)</th>
              <th width="10%">HSN</th>
              <th width="8%">Qty</th>
              <th width="10%" class="text-right">Rate</th>
              <th width="10%" class="text-right">Taxable</th>
              <th width="10%" class="text-right">GST Rate</th>
              <th width="12%" class="text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${(bill.items || []).map((item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td><strong>${item.medicineName}</strong></td>
                <td class="text-center">${item.hsnCode || '-'}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${Number(item.unitPrice).toFixed(2)}</td>
                <td class="text-right">${Number(item.taxableAmount || 0).toFixed(2)}</td>
                <td class="text-right">${item.gstRate || 0}%</td>
                <td class="text-right font-bold">${Number(item.lineTotal).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="flex">
          <div style="width: 50%; font-size: 10px; line-height: 1.5; color: #475569;">
            <p><strong>Terms & Conditions:</strong></p>
            <p>1. Goods once sold will not be taken back.<br>
            2. Interest @ 24% p.a. will be charged if payment is delayed.<br>
            3. Subject to local jurisdiction only.</p>
            <p style="margin-top: 30px;">Receiver's Signature / Stamp</p>
          </div>
          <div class="totals">
            <table>
              <tr>
                <td>Subtotal</td>
                <td class="text-right">₹${Number(bill.subtotal).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Discount</td>
                <td class="text-right" style="color: #dc2626;">-₹${Number(bill.discount).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Taxable Amount</td>
                <td class="text-right">₹${Number(bill.totalTaxableAmount || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>CGST</td>
                <td class="text-right">₹${Number(bill.totalCgst || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>SGST</td>
                <td class="text-right">₹${Number(bill.totalSgst || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td class="font-bold" style="font-size: 16px;">Grand Total</td>
                <td class="text-right font-bold" style="font-size: 16px;">₹${Number(bill.total).toFixed(2)}</td>
              </tr>
            </table>
            <div class="text-center" style="margin-top: 30px;">
              <p style="margin: 0;">For <strong>${pharmacyName}</strong></p>
              <p style="margin: 40px 0 0 0;">Authorized Signatory</p>
            </div>
          </div>
        </div>

        <div class="footer">
          System Generated Tax Invoice • Powered by DavaSetu
        </div>
      </div>
      ${autoPrint ? `<script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>` : ''}
    </body>
    </html>
  `;
};

export const printBill = async (
  bill: Bill, 
  format: 'A4' | 'THERMAL' | 'THERMAL_80MM' | 'THERMAL_58MM' | 'B2B_A4' = 'THERMAL', 
  defaultPharmacyName = 'DavaSetu Pharmacy', 
  defaultOwnerName = 'Admin'
): Promise<{ success: boolean; silent?: boolean; error?: string }> => {
  let pharmacyName = defaultPharmacyName;
  let ownerName = defaultOwnerName;
  
  try {
    const localData = localStorage.getItem('pharmacy_profile_data');
    if (localData) {
      const profile = JSON.parse(localData);
      if (profile.name) pharmacyName = profile.name;
      if (profile.ownerName) ownerName = profile.ownerName;
    }
  } catch (e) {}

  // Determine actual format
  let chosenFormat = format;
  if (chosenFormat === 'THERMAL') {
    const saved = localStorage.getItem('default_printer_format');
    if (saved === 'THERMAL_58MM' || saved === 'THERMAL_80MM' || saved === 'A4') {
      chosenFormat = saved as any;
    } else {
      chosenFormat = 'THERMAL_80MM';
    }
  }

  // Check if running inside Electron desktop and silent printing is preferred
  const isElectron = typeof window !== 'undefined' && !!(window as any).ipcRenderer;
  const isSilentPref = localStorage.getItem('silent_printing_enabled') !== 'false';
  const selectedPrinter = localStorage.getItem('selected_printer_name') || '';

  if (isElectron && isSilentPref) {
    let silentHtml = '';
    let widthType: '58MM' | '80MM' | 'A4' = '80MM';

    if (chosenFormat === 'B2B_A4') {
      silentHtml = generateB2BPrintHTML(bill, pharmacyName, ownerName, false);
      widthType = 'A4';
    } else if (chosenFormat === 'A4') {
      silentHtml = generateA4PrintHTML(bill, pharmacyName, ownerName, false);
      widthType = 'A4';
    } else if (chosenFormat === 'THERMAL_58MM') {
      silentHtml = generateThermalPrintHTML(bill, pharmacyName, '58MM', false);
      widthType = '58MM';
    } else {
      silentHtml = generateThermalPrintHTML(bill, pharmacyName, '80MM', false);
      widthType = '80MM';
    }

    try {
      const result = await (window as any).ipcRenderer.invoke('print-silent', {
        html: silentHtml,
        printerName: selectedPrinter || undefined,
        silent: true,
        widthType
      });

      if (result && result.success) {
        return { success: true, silent: true };
      }
      console.warn('Silent print failed or cancelled in Electron, falling back to window dialog:', result?.error);
    } catch (ipcErr) {
      console.warn('IPC invoke print-silent error, falling back:', ipcErr);
    }
  }

  // Standard browser print window fallback
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print bills.');
    return { success: false, error: 'Popup blocked' };
  }
  
  let html = '';
  if (chosenFormat === 'B2B_A4') {
    html = generateB2BPrintHTML(bill, pharmacyName, ownerName, true);
  } else if (chosenFormat === 'A4') {
    html = generateA4PrintHTML(bill, pharmacyName, ownerName, true);
  } else if (chosenFormat === 'THERMAL_58MM') {
    html = generateThermalPrintHTML(bill, pharmacyName, '58MM', true);
  } else {
    html = generateThermalPrintHTML(bill, pharmacyName, '80MM', true);
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  return { success: true, silent: false };
};

export const testPrintThermalReceipt = async (
  format: '58MM' | '80MM' | 'A4' = '80MM',
  liveBill?: Bill
) => {
  let pharmacyName = 'DavaSetu Pharmacy';
  let ownerName = 'Admin';
  let contactPhone = '';
  try {
    const localData = localStorage.getItem('pharmacy_profile_data');
    if (localData) {
      const profile = JSON.parse(localData);
      if (profile.name) pharmacyName = profile.name;
      if (profile.ownerName) ownerName = profile.ownerName;
      if (profile.phone) contactPhone = profile.phone;
    }
  } catch (e) {}

  const targetBill: Bill = liveBill || {
    id: 'live-' + Date.now(),
    billNumber: 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
    billType: 'RETAIL',
    customerName: 'Walk-in Patient',
    customerPhone: contactPhone || '9876543210',
    items: [
      {
        medicineId: 'dolo650',
        medicineName: 'Paracetamol 650mg Strip',
        quantity: 2,
        unitPrice: 32.50,
        mrp: 35.00,
        lineTotal: 65.00,
        gstRate: 12,
        hsnCode: '300490',
        taxableAmount: 58.04,
        cgst: 3.48,
        sgst: 3.48
      },
      {
        medicineId: 'pantocid40',
        medicineName: 'Pantocid 40mg Tab',
        quantity: 1,
        unitPrice: 95.00,
        mrp: 105.00,
        lineTotal: 95.00,
        gstRate: 12,
        hsnCode: '300490',
        taxableAmount: 84.82,
        cgst: 5.09,
        sgst: 5.09
      }
    ],
    subtotal: 160.00,
    discount: 0,
    totalTaxableAmount: 142.86,
    totalCgst: 8.57,
    totalSgst: 8.57,
    totalGst: 17.14,
    total: 160.00,
    paymentMode: 'CASH',
    paymentStatus: 'PAID',
    createdAt: new Date().toISOString()
  };

  const chosenFmt = format === '58MM' ? 'THERMAL_58MM' : (format === '80MM' ? 'THERMAL_80MM' : 'A4');
  return await printBill(targetBill, chosenFmt, pharmacyName, ownerName);
};

export const printReturnChallan = (challan: any, defaultPharmacyName = 'DavaSetu Pharmacy') => {
  let pharmacyName = defaultPharmacyName;
  let ownerName = 'Admin';
  try {
    const localData = localStorage.getItem('pharmacy_profile_data');
    if (localData) {
      const profile = JSON.parse(localData);
      if (profile.name) pharmacyName = profile.name;
      if (profile.ownerName) ownerName = profile.ownerName;
    }
  } catch (e) {}

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print return challans.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Return Challan - ${challan.challanNumber}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 800px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 25px; border-radius: 8px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
        .title { text-align: right; }
        .title h1 { margin: 0; font-size: 24px; color: #0f172a; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
        .card { background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
        th { background: #f1f5f9; text-transform: uppercase; font-size: 11px; }
        .text-right { text-align: right; }
        .totals { width: 300px; margin-left: auto; margin-bottom: 30px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding-top: 20px; }
        .sig-box { text-align: center; border-top: 1px solid #94a3b8; width: 200px; padding-top: 6px; font-size: 12px; font-weight: bold; }
        @media print { body { padding: 0; } .container { border: none; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h2 style="margin: 0; font-size: 20px; color: #0f172a;">${pharmacyName}</h2>
            <p style="margin: 3px 0; font-size: 12px; color: #64748b;">Proprietor: ${ownerName}</p>
            <p style="margin: 3px 0; font-size: 12px; color: #64748b;">Retail Drug Store & Pharmacy</p>
          </div>
          <div class="title">
            <h1>RETURN CHALLAN</h1>
            <p style="margin: 3px 0; font-size: 13px; font-weight: bold; color: #dc2626;">(Expiry / Breakage Debit Note)</p>
            <p style="margin: 3px 0; font-size: 12px;">Challan No: <strong>${challan.challanNumber}</strong></p>
            <p style="margin: 3px 0; font-size: 12px;">Date: ${new Date(challan.returnDate || challan.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div class="details-grid">
          <div class="card">
            <h4 style="margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; color: #64748b;">Return Given By (Store)</h4>
            <p style="margin: 2px 0; font-weight: bold;">${pharmacyName}</p>
            <p style="margin: 2px 0; font-size: 12px;">Contact: Local Store</p>
          </div>
          <div class="card">
            <h4 style="margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; color: #64748b;">Distributor / Agency</h4>
            <p style="margin: 2px 0; font-weight: bold;">${challan.distributorName || challan.supplierName || 'General Return'}</p>
            <p style="margin: 2px 0; font-size: 12px;">Reason: <strong>${challan.reason || 'Expired / Near Expiry Return'}</strong></p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 35%;">Medicine Description</th>
              <th style="width: 15%;">Batch No</th>
              <th style="width: 15%;">Expiry Date</th>
              <th style="width: 10%;" class="text-right">Qty</th>
              <th style="width: 10%;" class="text-right">Rate (₹)</th>
              <th style="width: 10%;" class="text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${(challan.items || []).map((it: any, idx: number) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${it.medicineName}</strong></td>
                <td>${it.batchNumber || '-'}</td>
                <td>${it.expiryDate ? new Date(it.expiryDate).toLocaleDateString() : '-'}</td>
                <td class="text-right">${it.quantity}</td>
                <td class="text-right">₹${Number(it.purchasePrice || 0).toFixed(2)}</td>
                <td class="text-right font-bold">₹${Number(it.totalAmount || (it.quantity * it.purchasePrice)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table style="margin: 0;">
            <tr>
              <td>Total Returned Quantity</td>
              <td class="text-right font-bold">${challan.totalItems || (challan.items?.reduce((s: any, i: any) => s + i.quantity, 0))} Units</td>
            </tr>
            <tr style="font-size: 15px; font-weight: bold; background: #fef2f2; color: #991b1b;">
              <td>Total Debit Amount</td>
              <td class="text-right">₹${Number(challan.totalAmount).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 11px; color: #64748b; margin-top: 10px;">
          Note: Please credit this debit amount against our pending account or issue Credit Note against these returned expired/damaged items.
        </p>

        <div class="signatures">
          <div class="sig-box">
            Pharmacist Signature / Stamp<br>
            <span style="font-size: 10px; font-weight: normal; color: #64748b;">${pharmacyName}</span>
          </div>
          <div class="sig-box">
            Distributor Receiver Signature<br>
            <span style="font-size: 10px; font-weight: normal; color: #64748b;">Name & Date Received</span>
          </div>
        </div>
      </div>
      <script>
        window.onload = () => { setTimeout(() => window.print(), 350); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
