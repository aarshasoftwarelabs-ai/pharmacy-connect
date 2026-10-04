import { Bill } from '../types/billing';

export const generateA4PrintHTML = (bill: Bill, pharmacyName: string = 'PharmacyConnect', ownerName: string = 'Owner') => {
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
      <script>
        window.onload = () => { setTimeout(() => window.print(), 500); }
      </script>
    </body>
    </html>
  `;
};

export const generateThermalPrintHTML = (bill: Bill, pharmacyName: string = 'PharmacyConnect') => {
  const isOnline = bill.billType === 'ONLINE';
  const displayName = isOnline ? 'DavaSetu' : pharmacyName;
  
  // Simpler, narrow thermal receipt style
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${bill.billNumber}</title>
      <style>
        body { font-family: monospace; font-size: 12px; width: 80mm; margin: 0 auto; padding: 10px; color: #000; }
        .center { text-align: center; }
        .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; }
        td, th { text-align: left; vertical-align: top; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        @media print {
          body { width: 100%; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="center">
        <h2 style="margin: 0; font-size: 16px;">${displayName}</h2>
        <p style="margin: 2px 0;">Receipt: ${bill.billNumber}</p>
        <p style="margin: 2px 0;">Date: ${new Date(bill.createdAt).toLocaleString()}</p>
      </div>
      <div class="divider"></div>
      <p style="margin: 2px 0;">Customer: ${bill.customerName}</p>
      ${bill.customerPhone ? `<p style="margin: 2px 0;">Phone: ${bill.customerPhone}</p>` : ''}
      <div class="divider"></div>
      <table>
        <tr>
          <th>Item</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Taxable</th>
          <th class="text-right">GST</th>
          <th class="text-right">Amt</th>
        </tr>
        ${(bill.items || []).map(item => `
          <tr>
            <td>${item.medicineName}<br><span style="font-size:10px;">HSN: ${item.hsnCode||'-'}</span></td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${Number(item.taxableAmount||0).toFixed(2)}</td>
            <td class="text-right">${Number((item.cgst||0)+(item.sgst||0)).toFixed(2)}</td>
            <td class="text-right">${Number(item.lineTotal).toFixed(2)}</td>
          </tr>
        `).join('')}
      </table>
      <div class="divider"></div>
      <table>
        <tr>
          <td>Subtotal:</td>
          <td class="text-right">${Number(bill.subtotal).toFixed(2)}</td>
        </tr>
        <tr>
          <td>Discount:</td>
          <td class="text-right">${Number(bill.discount).toFixed(2)}</td>
        </tr>
        <tr>
          <td>Taxable Amt:</td>
          <td class="text-right">${Number(bill.totalTaxableAmount||0).toFixed(2)}</td>
        </tr>
        <tr>
          <td>CGST:</td>
          <td class="text-right">${Number(bill.totalCgst||0).toFixed(2)}</td>
        </tr>
        <tr>
          <td>SGST:</td>
          <td class="text-right">${Number(bill.totalSgst||0).toFixed(2)}</td>
        </tr>
        <tr class="bold" style="font-size: 14px;">
          <td>Total:</td>
          <td class="text-right">${Number(bill.total).toFixed(2)}</td>
        </tr>
      </table>
      <div class="divider"></div>
      <p class="center" style="margin-top: 10px;">Thank You!</p>
      <script>
        window.onload = () => { setTimeout(() => window.print(), 500); }
      </script>
    </body>
    </html>
  `;
};

export const generateB2BPrintHTML = (bill: Bill, pharmacyName: string = 'PharmacyConnect', ownerName: string = 'Owner') => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Wholesale Tax Invoice - ${bill.billNumber}</title>
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
        <h1 class="invoice-title">Tax Invoice (Wholesale B2B)</h1>
        
        <div class="flex" style="margin-bottom: 10px;">
          <div style="width: 50%;">
            <div class="border-box">
              <h3 style="margin: 0 0 5px 0; font-size: 14px;">Supplier (Wholesaler)</h3>
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
          System Generated Wholesale Invoice • Powered by DavaSetu
        </div>
      </div>
      <script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>
    </body>
    </html>
  `;
};

export const printBill = (bill: Bill, format: 'A4' | 'THERMAL' | 'B2B_A4' = 'A4', defaultPharmacyName = 'DavaSetu Pharmacy', defaultOwnerName = 'Admin') => {
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

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print bills.');
    return;
  }
  
  let html = '';
  if (format === 'B2B_A4') {
    html = generateB2BPrintHTML(bill, pharmacyName, ownerName);
  } else if (format === 'A4') {
    html = generateA4PrintHTML(bill, pharmacyName, ownerName);
  } else {
    html = generateThermalPrintHTML(bill, pharmacyName);
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
};
