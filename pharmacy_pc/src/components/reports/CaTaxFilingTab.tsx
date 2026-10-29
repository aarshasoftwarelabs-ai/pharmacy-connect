import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  AlertCircle, 
  FileSpreadsheet, 
  Printer, 
  FileJson, 
  Building2, 
  IndianRupee, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText,
  Lock,
  Edit3,
  ExternalLink,
  XCircle,
  X,
  Package,
  Layers,
  ShoppingBag
} from 'lucide-react';
import { getPharmacyId } from '../../config/development';
import { ReportService, ReportDateRange, CaTaxFilingData } from '../../services/reportService';
import { PharmacyService } from '../../services/pharmacyService';

interface CaTaxFilingTabProps {
  dateRange: ReportDateRange;
}

export default function CaTaxFilingTab({ dateRange }: CaTaxFilingTabProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CaTaxFilingData | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'GSTR1' | 'GSTR2' | 'GSTR3B'>('GSTR1');
  const [gstr1SubTab, setGstr1SubTab] = useState<'B2B' | 'B2CS' | 'HSN' | 'DOCS'>('B2CS');
  const [gstr2SubTab, setGstr2SubTab] = useState<'B2B' | 'RATE' | 'HSN' | 'SUPPLIER'>('B2B');

  // Quick Add GSTIN modal state
  const [showGstinModal, setShowGstinModal] = useState(false);
  const [newGstin, setNewGstin] = useState('');
  const [newState, setNewState] = useState('Gujarat');
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const validateGstinFormat = (gstin?: string) => {
    if (!gstin) return false;
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
    return regex.test(gstin.trim());
  };

  const loadReport = () => {
    setLoading(true);
    ReportService.getCaTaxFilingReport(getPharmacyId(), dateRange)
      .then(res => {
        setReport(res);
        setError(null);
      })
      .catch(err => {
        setError(err.message || 'Failed to load CA tax filing data');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadReport();
  }, [dateRange]);

  // Handle Quick Add GSTIN submission
  const handleSaveGstin = async () => {
    const trimmed = newGstin.trim().toUpperCase();
    if (!validateGstinFormat(trimmed)) {
      setModalError('Please enter a valid 15-digit GSTIN (e.g. 24AAAAA0000A1Z5)');
      return;
    }

    try {
      setModalSaving(true);
      setModalError(null);
      const pharmacyId = report?.pharmacy?.id || getPharmacyId();
      
      const updated = await PharmacyService.updatePharmacyProfile(pharmacyId, {
        gstin: trimmed,
        gstRegistered: true,
        state: newState.trim() || 'Gujarat'
      });

      // Update local storage cache
      try {
        const localData = localStorage.getItem('pharmacy_profile_data');
        const current = localData ? JSON.parse(localData) : {};
        localStorage.setItem('pharmacy_profile_data', JSON.stringify({
          ...current,
          ...updated,
          gstin: trimmed,
          gstRegistered: true,
          state: newState.trim() || 'Gujarat'
        }));
      } catch (e) {
        console.error('Failed to update local profile cache', e);
      }

      setShowGstinModal(false);
      setNewGstin('');
      loadReport();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save GSTIN. Please try again.');
    } finally {
      setModalSaving(false);
    }
  };

  // Export GSTR-1 as CSV
  const handleExportGstr1Csv = () => {
    if (!report || !report.gstr1) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Header
    csvContent += `GSTR-1 SALES RETURN SUMMARY\n`;
    csvContent += `Pharmacy:,"${report.pharmacy.name}"\n`;
    csvContent += `GSTIN:,"${report.pharmacy.gstin || 'NOT REGISTERED'}"\n`;
    csvContent += `Period:,"${dateRange.from || 'Beginning'} to ${dateRange.to || 'Today'}"\n\n`;

    // 1. B2CS Summary
    csvContent += `SECTION 1: B2C SMALL (RETAIL SALES BY RATE)\n`;
    csvContent += `GST Rate (%),Taxable Value (INR),CGST (INR),SGST (INR),IGST (INR),Total Value (INR)\n`;
    report.gstr1.b2cs.forEach(r => {
      csvContent += `${r.rate}%,${r.taxableValue.toFixed(2)},${r.cgst.toFixed(2)},${r.sgst.toFixed(2)},${r.igst.toFixed(2)},${r.totalValue.toFixed(2)}\n`;
    });
    csvContent += `\n`;

    // 2. B2B Invoices
    csvContent += `SECTION 2: B2B INVOICES (WHOLESALE / REGISTERED RECIPIENTS)\n`;
    csvContent += `Invoice Number,Invoice Date,Receiver Name,Receiver GSTIN,Taxable Value (INR),CGST (INR),SGST (INR),IGST (INR),Total Invoice Value (INR)\n`;
    report.gstr1.b2b.forEach(b => {
      csvContent += `"${b.invoiceNumber}","${b.invoiceDate}","${b.receiverName}","${b.receiverGstin}",${b.taxableValue.toFixed(2)},${b.cgst.toFixed(2)},${b.sgst.toFixed(2)},${b.igst.toFixed(2)},${b.invoiceValue.toFixed(2)}\n`;
    });
    csvContent += `\n`;

    // 3. HSN Summary
    csvContent += `SECTION 3: HSN-WISE SUMMARY OF OUTWARD SUPPLIES\n`;
    csvContent += `HSN Code,Description,UQC,Total Quantity,Total Value (INR),Taxable Value (INR),GST Rate (%),CGST (INR),SGST (INR),IGST (INR)\n`;
    report.gstr1.hsnSummary.forEach(h => {
      csvContent += `"${h.hsnCode}","${h.description.replace(/"/g, '""')}","${h.uqc}",${h.totalQuantity},${h.totalValue.toFixed(2)},${h.taxableValue.toFixed(2)},${h.rate}%,${h.cgst.toFixed(2)},${h.sgst.toFixed(2)},${h.igst.toFixed(2)}\n`;
    });
    csvContent += `\n`;

    // 4. Document Issued
    csvContent += `SECTION 4: DOCUMENTS ISSUED SUMMARY\n`;
    csvContent += `Nature of Document,From Serial,To Serial,Total Count,Cancelled Count\n`;
    csvContent += `Tax Invoices,"${report.gstr1.docSummary.fromSerial}","${report.gstr1.docSummary.toSerial}",${report.gstr1.docSummary.totalCount},${report.gstr1.docSummary.cancelledCount}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GSTR1_${report.pharmacy.gstin || 'Report'}_${dateRange.from || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export GSTR-2 as CSV
  const handleExportGstr2Csv = () => {
    if (!report || !report.gstr2) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Header
    csvContent += `GSTR-2 INWARD SUPPLIES & INPUT TAX CREDIT (ITC) REPORT\n`;
    csvContent += `Pharmacy:,"${report.pharmacy.name}"\n`;
    csvContent += `GSTIN:,"${report.pharmacy.gstin || 'NOT REGISTERED'}"\n`;
    csvContent += `Period:,"${dateRange.from || 'Beginning'} to ${dateRange.to || 'Today'}"\n\n`;

    // 1. Inward B2B Invoices (Purchases from Distributors)
    csvContent += `SECTION 1: B2B INWARD INVOICES (PURCHASES FROM DISTRIBUTORS)\n`;
    csvContent += `Invoice Number,Invoice Date,Distributor Name,Distributor GSTIN,City,Taxable Value (INR),CGST (INR),SGST (INR),IGST (INR),Total ITC (INR),Invoice Value (INR),Reverse Charge,ITC Eligibility\n`;
    report.gstr2.b2b.forEach(b => {
      csvContent += `"${b.invoiceNumber}","${b.invoiceDate}","${b.supplierName.replace(/"/g, '""')}","${b.supplierGstin}","${b.supplierCity || ''}",${b.taxableValue.toFixed(2)},${b.cgst.toFixed(2)},${b.sgst.toFixed(2)},${b.igst.toFixed(2)},${b.totalTax.toFixed(2)},${b.invoiceValue.toFixed(2)},"${b.reverseCharge}","${b.itcEligibility}"\n`;
    });
    csvContent += `\n`;

    // 2. Rate-wise Purchases
    csvContent += `SECTION 2: RATE-WISE INWARD SUPPLIES (TAX SLABS)\n`;
    csvContent += `GST Rate (%),Taxable Value (INR),CGST (INR),SGST (INR),IGST (INR),Total ITC (INR),Total Purchases (INR)\n`;
    report.gstr2.rateWise.forEach(r => {
      csvContent += `${r.rate}%,${r.taxableValue.toFixed(2)},${r.cgst.toFixed(2)},${r.sgst.toFixed(2)},${r.igst.toFixed(2)},${r.totalTax.toFixed(2)},${r.totalValue.toFixed(2)}\n`;
    });
    csvContent += `\n`;

    // 3. HSN Summary
    csvContent += `SECTION 3: HSN SUMMARY OF INWARD MEDICINE SUPPLIES\n`;
    csvContent += `HSN Code,Description,UQC,Total Quantity,Total Purchases (INR),Taxable Value (INR),GST Rate (%),CGST (INR),SGST (INR),IGST (INR)\n`;
    report.gstr2.hsnSummary.forEach(h => {
      csvContent += `"${h.hsnCode}","${h.description.replace(/"/g, '""')}","${h.uqc}",${h.totalQuantity},${h.totalValue.toFixed(2)},${h.taxableValue.toFixed(2)},${h.rate}%,${h.cgst.toFixed(2)},${h.sgst.toFixed(2)},${h.igst.toFixed(2)}\n`;
    });
    csvContent += `\n`;

    // 4. Distributor Summary
    csvContent += `SECTION 4: DISTRIBUTOR / SUPPLIER SUMMARY (ITC CLAIMED)\n`;
    csvContent += `Distributor Name,GSTIN,City,Invoices Count,Taxable Purchases (INR),CGST (INR),SGST (INR),IGST (INR),Total Eligible ITC (INR),Total Purchases (INR)\n`;
    report.gstr2.supplierSummary.forEach(s => {
      csvContent += `"${s.supplierName.replace(/"/g, '""')}","${s.supplierGstin}","${s.supplierCity || ''}",${s.totalInvoices},${s.taxableValue.toFixed(2)},${s.cgst.toFixed(2)},${s.sgst.toFixed(2)},${s.igst.toFixed(2)},${s.totalItc.toFixed(2)},${s.totalPurchases.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GSTR2_${report.pharmacy.gstin || 'Report'}_${dateRange.from || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export GSTR-3B as CSV
  const handleExportGstr3bCsv = () => {
    if (!report || !report.gstr3b) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `GSTR-3B MONTHLY RETURN & CA AUDIT REPORT\n`;
    csvContent += `Pharmacy:,"${report.pharmacy.name}"\n`;
    csvContent += `GSTIN:,"${report.pharmacy.gstin || 'NOT REGISTERED'}"\n`;
    csvContent += `Period:,"${dateRange.from || 'Beginning'} to ${dateRange.to || 'Today'}"\n\n`;

    // Table 3.1 Outward Supplies
    csvContent += `TABLE 3.1: DETAILS OF OUTWARD SUPPLIES (SALES)\n`;
    csvContent += `Nature of Supplies,Total Taxable Value (INR),Integrated Tax (INR),Central Tax (INR),State/UT Tax (INR),Total Tax (INR),Total Invoice Value (INR)\n`;
    const out = report.gstr3b.outwardSupplies;
    csvContent += `(a) Outward Taxable Supplies,${out.taxableAmount.toFixed(2)},${out.igst.toFixed(2)},${out.cgst.toFixed(2)},${out.sgst.toFixed(2)},${out.totalTax.toFixed(2)},${out.totalAmount.toFixed(2)}\n\n`;

    // Table 4 Eligible ITC
    csvContent += `TABLE 4: ELIGIBLE INPUT TAX CREDIT (ITC) FROM PURCHASES\n`;
    csvContent += `Details,Taxable Purchases (INR),Integrated Tax (INR),Central Tax (INR),State/UT Tax (INR),Total ITC (INR),Invoices Count\n`;
    const itc = report.gstr3b.eligibleItc;
    csvContent += `(A) All Other ITC (Purchases from Distributors),${itc.taxableAmount.toFixed(2)},${itc.igst.toFixed(2)},${itc.cgst.toFixed(2)},${itc.sgst.toFixed(2)},${itc.totalTax.toFixed(2)},${itc.totalInvoices}\n\n`;

    // Table 5 Net Tax Payable
    csvContent += `TABLE 5: NET TAX PAYABLE IN CASH (OUTWARD TAX LESS ITC)\n`;
    csvContent += `Tax Head,Output Tax Liability (INR),Input Tax Credit (INR),Net Cash Payable (INR)\n`;
    csvContent += `IGST,${out.igst.toFixed(2)},${itc.igst.toFixed(2)},${report.gstr3b.netTaxPayable.igst.toFixed(2)}\n`;
    csvContent += `CGST,${out.cgst.toFixed(2)},${itc.cgst.toFixed(2)},${report.gstr3b.netTaxPayable.cgst.toFixed(2)}\n`;
    csvContent += `SGST,${out.sgst.toFixed(2)},${itc.sgst.toFixed(2)},${report.gstr3b.netTaxPayable.sgst.toFixed(2)}\n`;
    csvContent += `TOTAL,${out.totalTax.toFixed(2)},${itc.totalTax.toFixed(2)},${report.gstr3b.netTaxPayable.totalTax.toFixed(2)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GSTR3B_${report.pharmacy.gstin || 'Report'}_${dateRange.from || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Government GST Offline Tool Compatible JSON
  const handleExportJson = () => {
    if (!report || !report.gstr1) return;

    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = String(now.getFullYear());
    const fp = `${mm}${yyyy}`;

    const gstPortalJson = {
      gstin: report.pharmacy.gstin,
      fp: fp,
      version: "GSTR_Offline_V1.5",
      hash: "hash_sum",
      gstr1: {
        b2b: report.gstr1.b2b.map(item => ({
          ctin: item.receiverGstin || "URP",
          inv: [{
            inum: item.invoiceNumber,
            idt: item.invoiceDate,
            val: item.invoiceValue,
            pos: "24",
            rchrg: "N",
            inv_typ: "R",
            itms: [{
              num: 1,
              itm_det: {
                txval: item.taxableValue,
                rt: (item.cgst > 0 && item.taxableValue > 0 ? (item.cgst / item.taxableValue) * 200 : 0).toFixed(0),
                camt: item.cgst,
                samt: item.sgst,
                iamt: item.igst,
                csamt: 0
              }
            }]
          }]
        })),
        b2cs: report.gstr1.b2cs.map(item => ({
          sply_ty: "INTRA",
          rt: item.rate,
          typ: "OE",
          pos: "24",
          txval: item.taxableValue,
          camt: item.cgst,
          samt: item.sgst,
          iamt: item.igst,
          csamt: 0
        })),
        hsn: {
          data: report.gstr1.hsnSummary.map((item, idx) => ({
            num: idx + 1,
            hsn_sc: item.hsnCode,
            desc: item.description,
            uqc: item.uqc,
            qty: item.totalQuantity,
            val: item.totalValue,
            txval: item.taxableValue,
            iamt: item.igst,
            camt: item.cgst,
            samt: item.sgst,
            csamt: 0
          }))
        },
        doc_issue: {
          doc_det: [{
            doc_num: 1,
            doc_typ: "Invoices for outward supply",
            docs: [{
              num: 1,
              from: report.gstr1.docSummary.fromSerial,
              to: report.gstr1.docSummary.toSerial,
              totnum: report.gstr1.docSummary.totalCount,
              canc: report.gstr1.docSummary.cancelledCount,
              net_issue: report.gstr1.docSummary.totalCount - report.gstr1.docSummary.cancelledCount
            }]
          }]
        }
      },
      gstr2_inward: (report.gstr2?.b2b || []).map(item => ({
        ctin: item.supplierGstin || "UNREGISTERED",
        cname: item.supplierName,
        inv: [{
          inum: item.invoiceNumber,
          idt: item.invoiceDate,
          val: item.invoiceValue,
          pos: "24",
          rchrg: item.reverseCharge,
          inv_typ: "R",
          itms: [{
            num: 1,
            itm_det: {
              txval: item.taxableValue,
              camt: item.cgst,
              samt: item.sgst,
              iamt: item.igst,
              csamt: 0
            },
            itc: {
              elg: "ip",
              tx_c: item.cgst,
              tx_s: item.sgst,
              tx_i: item.igst,
              tx_cs: 0
            }
          }]
        }]
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gstPortalJson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `GST_Returns_${report.pharmacy.gstin}_${fp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-80">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-600">Compiling Live CA & GST Tax Filing Reports (GSTR-1, 2 & 3B)...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-3xl flex items-center border border-red-200">
        <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-sm">Failed to Load Tax Reports</h4>
          <p className="text-xs text-red-600 mt-1">{error || 'Unable to fetch report data from server.'}</p>
        </div>
      </div>
    );
  }

  // Mandatory GSTIN Protection Gate:
  // If pharmacy does not have GSTIN, block report creation & guide user smartly!
  const hasValidGstin = report.hasGstin !== false && Boolean(report.pharmacy?.gstin && report.pharmacy.gstin.trim());

  if (!hasValidGstin) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-orange-500/10 rounded-[2.5rem] p-8 md:p-12 border-2 border-amber-300 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="w-20 h-20 bg-amber-100 border border-amber-300 rounded-3xl flex items-center justify-center mx-auto shadow-sm text-amber-600">
              <Lock className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                GST Number Required • જીએસટી નંબર ફરજિયાત છે
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight pt-2">
                GSTIN Required to Generate CA & Tax Filing Reports
              </h2>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                તમારા ફાર્મસી પ્રોફાઇલમાં હજી સુધી જીએસટી નંબર (GSTIN) દાખલ કરેલ નથી. સરકારી નિયમો અનુસાર <strong className="text-slate-900 font-bold">GSTR-1</strong> (વેચાણ રીટર્ન), <strong className="text-slate-900 font-bold">GSTR-2</strong> (ખરીદી અને ITC ક્રેડિટ), અને <strong className="text-slate-900 font-bold">GSTR-3B</strong> રીપોર્ટ જનરેટ કરવા માટે માન્ય GSTIN હોવો ફરજિયાત છે.
              </p>
            </div>

            {/* Pharmacy Current Status Box */}
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{report.pharmacy.name}</h4>
                  <p className="text-xs text-rose-500 font-semibold flex items-center">
                    <XCircle className="w-3.5 h-3.5 mr-1" /> GST Status: Not Configured
                  </p>
                </div>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 font-mono px-3 py-1.5 rounded-lg border border-slate-200">
                GSTIN: None
              </span>
            </div>

            {/* Smart Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setNewGstin('');
                  setModalError(null);
                  setShowGstinModal(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-pharmacy-600 to-indigo-600 hover:from-pharmacy-700 hover:to-indigo-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                <Edit3 className="w-4 h-4 mr-2" /> Add GSTIN Now & Generate Reports
              </button>
              
              <button
                onClick={() => navigate('/pharmacy-profile')}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-2xl font-bold text-sm shadow-sm transition-all"
              >
                <ExternalLink className="w-4 h-4 mr-2 text-slate-400" /> Go to Pharmacy Profile
              </button>
            </div>
          </div>
        </div>

        {/* Quick Add GSTIN Modal */}
        {showGstinModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-fade-in">
              <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2.5">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-extrabold text-base">Add Pharmacy GSTIN</h3>
                </div>
                <button 
                  onClick={() => setShowGstinModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500 font-medium">
                  Enter your official 15-character Goods and Services Tax Identification Number (GSTIN). Reports will be unlocked immediately.
                </p>

                {modalError && (
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-200 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    GSTIN (15 Characters) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={15}
                      value={newGstin}
                      onChange={(e) => setNewGstin(e.target.value.toUpperCase())}
                      placeholder="e.g. 24AAAAA0000A1Z5"
                      className="w-full uppercase font-mono font-bold tracking-wider px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 focus:bg-white transition-all"
                    />
                    {validateGstinFormat(newGstin) && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-3 top-3.5" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Format: 2 digits (State) + 10 PAN chars + 1 entity + Z + 1 checksum</p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Registered State
                  </label>
                  <input
                    type="text"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    placeholder="e.g. Gujarat"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 focus:bg-white font-medium transition-all"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowGstinModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={modalSaving || !validateGstinFormat(newGstin)}
                    onClick={handleSaveGstin}
                    className="flex items-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-sm transition-all"
                  >
                    {modalSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Save & Unlock Reports
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If GSTIN is present, render all real live reports (GSTR-1, GSTR-2, GSTR-3B)
  const out = report.gstr3b?.outwardSupplies || { taxableAmount: 0, totalTax: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 0 };
  const itc = report.gstr3b?.eligibleItc || { taxableAmount: 0, totalTax: 0, cgst: 0, sgst: 0, igst: 0, totalPurchases: 0, totalInvoices: 0 };
  const netPay = report.gstr3b?.netTaxPayable || { totalTax: 0, cgst: 0, sgst: 0, igst: 0 };

  const gstr1 = report.gstr1 || { b2b: [], b2cs: [], hsnSummary: [], docSummary: { fromSerial: 'N/A', toSerial: 'N/A', totalCount: 0, cancelledCount: 0 } };
  const gstr2 = report.gstr2 || { b2b: [], rateWise: [], hsnSummary: [], supplierSummary: [], summary: { totalInvoices: 0, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, totalPurchases: 0, eligibleItc: 0 } };

  return (
    <div className="space-y-6">
      {/* 1. Top CA / Tax Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <Building2 className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black tracking-tight">{report.pharmacy.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  GST Active
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                GSTIN: <span className="font-mono font-bold text-white">{report.pharmacy.gstin}</span> • State: {report.pharmacy.state || 'Gujarat'}
              </p>
            </div>
          </div>

          {/* 1-Click CA Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportGstr1Csv}
              className="flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-sm transition-all"
              title="Download GSTR-1 Sales Report in Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" /> GSTR-1 Excel
            </button>
            <button
              onClick={handleExportGstr2Csv}
              className="flex items-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-sm transition-all"
              title="Download GSTR-2 Inward Purchases & ITC Report in Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" /> GSTR-2 Excel
            </button>
            <button
              onClick={handleExportGstr3bCsv}
              className="flex items-center px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-sm transition-all"
              title="Download GSTR-3B Monthly Return in Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" /> GSTR-3B Excel
            </button>
            <button
              onClick={handleExportJson}
              className="flex items-center px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black shadow-sm transition-all"
              title="Download Government GST Offline Tool Compatible JSON"
            >
              <FileJson className="w-4 h-4 mr-1.5" /> GST Portal JSON
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
              title="Print CA Tax Audit Summary"
            >
              <Printer className="w-4 h-4 mr-1.5" /> Print
            </button>
          </div>
        </div>

        {/* 3 Metric Cards: Sales Tax, ITC Credit, Net Payable */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          {/* Outward Tax */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold flex items-center">
                <ArrowUpRight className="w-4 h-4 mr-1 text-emerald-400" /> Outward Sales Tax (Liability)
              </span>
              <span className="text-[10px] font-mono text-slate-500">GSTR-1 / T-3.1</span>
            </div>
            <p className="text-2xl font-black text-white">₹{out.totalTax.toFixed(2)}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              On Taxable Sales: ₹{out.taxableAmount.toFixed(2)}
            </p>
          </div>

          {/* Inward Purchases ITC */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold flex items-center">
                <ArrowDownRight className="w-4 h-4 mr-1 text-blue-400" /> Input Tax Credit (ITC)
              </span>
              <span className="text-[10px] font-mono text-slate-500">GSTR-2 / T-4</span>
            </div>
            <p className="text-2xl font-black text-blue-300">₹{itc.totalTax.toFixed(2)}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              From {itc.totalInvoices} Distributor Invoices (₹{itc.totalPurchases.toFixed(2)})
            </p>
          </div>

          {/* Net Cash Payable */}
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-indigo-300 mb-1">
              <span className="font-semibold flex items-center">
                <IndianRupee className="w-4 h-4 mr-1 text-indigo-400" /> Net Cash Tax Payable
              </span>
              <span className="text-[10px] font-mono text-indigo-300">GSTR-3B / T-5</span>
            </div>
            <p className="text-2xl font-black text-amber-300">₹{netPay.totalTax.toFixed(2)}</p>
            <p className="text-[11px] text-indigo-200 font-medium mt-1">
              CGST: ₹{netPay.cgst.toFixed(2)} | SGST: ₹{netPay.sgst.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Form Switcher Tabs (GSTR-1, GSTR-2, GSTR-3B) */}
      <div className="flex border-b border-slate-200 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveFormTab('GSTR1')}
          className={`pb-3 px-6 text-sm font-black transition-all border-b-2 flex items-center whitespace-nowrap ${
            activeFormTab === 'GSTR1'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          GSTR-1 (Outward Sales Return)
        </button>

        <button
          onClick={() => setActiveFormTab('GSTR2')}
          className={`pb-3 px-6 text-sm font-black transition-all border-b-2 flex items-center whitespace-nowrap ${
            activeFormTab === 'GSTR2'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 mr-2" />
          GSTR-2 (Inward Purchases & ITC)
        </button>

        <button
          onClick={() => setActiveFormTab('GSTR3B')}
          className={`pb-3 px-6 text-sm font-black transition-all border-b-2 flex items-center whitespace-nowrap ${
            activeFormTab === 'GSTR3B'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 mr-2" />
          GSTR-3B (Monthly Summary & Net Tax)
        </button>
      </div>

      {/* 3. GSTR-1 View */}
      {activeFormTab === 'GSTR1' && (
        <div className="space-y-4">
          {/* Sub Navigation */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto custom-scrollbar">
            {[
              { key: 'B2CS', label: 'B2C Small (Retail)' },
              { key: 'B2B', label: `B2B Invoices (${gstr1.b2b.length})` },
              { key: 'HSN', label: `HSN Summary (${gstr1.hsnSummary.length})` },
              { key: 'DOCS', label: 'Documents Issued' },
            ].map((sub) => (
              <button
                key={sub.key}
                onClick={() => setGstr1SubTab(sub.key as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  gstr1SubTab === sub.key
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* SubTab 1: B2CS Retail by Rate */}
          {gstr1SubTab === 'B2CS' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  B2C Small Supplies (Retail Customers Grouped by Tax Slab)
                </span>
                <span className="text-xs text-slate-500 font-semibold">Place of Supply: 24-Gujarat</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">GST Rate</th>
                      <th className="px-6 py-3 text-right">Taxable Value (₹)</th>
                      <th className="px-6 py-3 text-right">CGST (₹)</th>
                      <th className="px-6 py-3 text-right">SGST (₹)</th>
                      <th className="px-6 py-3 text-right">IGST (₹)</th>
                      <th className="px-6 py-3 text-right">Total Invoice Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {gstr1.b2cs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium">
                          No retail sales recorded in this period.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {gstr1.b2cs.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-6 py-3.5 font-black text-indigo-600">{r.rate}%</td>
                            <td className="px-6 py-3.5 text-right font-medium text-slate-700">₹{r.taxableValue.toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-right font-medium text-slate-700">₹{r.cgst.toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-right font-medium text-slate-700">₹{r.sgst.toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-right font-medium text-slate-700">₹{r.igst.toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-right font-black text-slate-900">₹{r.totalValue.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-black">
                          <td className="px-6 py-3 text-slate-900">Total B2C</td>
                          <td className="px-6 py-3 text-right text-slate-900">
                            ₹{gstr1.b2cs.reduce((acc, c) => acc + c.taxableValue, 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-right text-slate-900">
                            ₹{gstr1.b2cs.reduce((acc, c) => acc + c.cgst, 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-right text-slate-900">
                            ₹{gstr1.b2cs.reduce((acc, c) => acc + c.sgst, 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-right text-slate-900">
                            ₹{gstr1.b2cs.reduce((acc, c) => acc + c.igst, 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-right text-indigo-700 font-black">
                            ₹{gstr1.b2cs.reduce((acc, c) => acc + c.totalValue, 0).toFixed(2)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubTab 2: B2B Invoices */}
          {gstr1SubTab === 'B2B' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  B2B Tax Invoices (Registered Wholesale / Institution Buyers)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">Invoice #</th>
                      <th className="px-6 py-3 text-left">Date</th>
                      <th className="px-6 py-3 text-left">Buyer / Client</th>
                      <th className="px-6 py-3 text-left">Buyer GSTIN</th>
                      <th className="px-6 py-3 text-right">Taxable (₹)</th>
                      <th className="px-6 py-3 text-right">CGST (₹)</th>
                      <th className="px-6 py-3 text-right">SGST (₹)</th>
                      <th className="px-6 py-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {gstr1.b2b.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-slate-400 font-medium">
                          No B2B wholesale invoices found in this period.
                        </td>
                      </tr>
                    ) : (
                      gstr1.b2b.map((b, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-6 py-3.5 font-black text-indigo-600">{b.invoiceNumber}</td>
                          <td className="px-6 py-3.5 text-slate-500 font-medium">
                            {new Date(b.invoiceDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-slate-900">{b.receiverName}</td>
                          <td className="px-6 py-3.5 font-mono text-[11px] text-slate-600">{b.receiverGstin || 'UNREGISTERED'}</td>
                          <td className="px-6 py-3.5 text-right font-medium text-slate-700">₹{b.taxableValue.toFixed(2)}</td>
                          <td className="px-6 py-3.5 text-right font-medium text-slate-700">₹{b.cgst.toFixed(2)}</td>
                          <td className="px-6 py-3.5 text-right font-medium text-slate-700">₹{b.sgst.toFixed(2)}</td>
                          <td className="px-6 py-3.5 text-right font-black text-slate-900">₹{b.invoiceValue.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubTab 3: HSN Summary */}
          {gstr1SubTab === 'HSN' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  HSN-wise Summary of Outward Medicine Supplies
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">HSN Code</th>
                      <th className="px-6 py-3 text-left">Description</th>
                      <th className="px-6 py-3 text-center">UQC</th>
                      <th className="px-6 py-3 text-right">Total Qty</th>
                      <th className="px-6 py-3 text-right">Total Value (₹)</th>
                      <th className="px-6 py-3 text-right">Taxable Value (₹)</th>
                      <th className="px-6 py-3 text-right">Rate</th>
                      <th className="px-6 py-3 text-right">CGST (₹)</th>
                      <th className="px-6 py-3 text-right">SGST (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {gstr1.hsnSummary.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-slate-400 font-medium">
                          No HSN medicine sales found in this period.
                        </td>
                      </tr>
                    ) : (
                      gstr1.hsnSummary.map((h, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-6 py-3.5 font-mono font-bold text-indigo-600">{h.hsnCode}</td>
                          <td className="px-6 py-3.5 font-semibold text-slate-800">{h.description}</td>
                          <td className="px-6 py-3.5 text-center text-slate-500 font-bold">{h.uqc}</td>
                          <td className="px-6 py-3.5 text-right font-bold text-slate-900">{h.totalQuantity}</td>
                          <td className="px-6 py-3.5 text-right text-slate-700">₹{h.totalValue.toFixed(2)}</td>
                          <td className="px-6 py-3.5 text-right font-semibold text-slate-900">₹{h.taxableValue.toFixed(2)}</td>
                          <td className="px-6 py-3.5 text-right font-black text-indigo-600">{h.rate}%</td>
                          <td className="px-6 py-3.5 text-right text-slate-700">₹{h.cgst.toFixed(2)}</td>
                          <td className="px-6 py-3.5 text-right text-slate-700">₹{h.sgst.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubTab 4: Documents Issued */}
          {gstr1SubTab === 'DOCS' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Summary of Documents Issued During the Period
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">From Serial Number</span>
                  <p className="text-base font-black text-indigo-600">{gstr1.docSummary.fromSerial}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">To Serial Number</span>
                  <p className="text-base font-black text-indigo-600">{gstr1.docSummary.toSerial}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">Total Bills Issued</span>
                  <p className="text-base font-black text-emerald-600">{gstr1.docSummary.totalCount}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">Cancelled Invoices</span>
                  <p className="text-base font-black text-red-600">{gstr1.docSummary.cancelledCount}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. GSTR-2 View (Inward Supplies / Purchases & Input Tax Credit) */}
      {activeFormTab === 'GSTR2' && (
        <div className="space-y-4">
          {/* Sub Navigation */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto custom-scrollbar">
            {[
              { key: 'B2B', label: `B2B Purchases (${gstr2.b2b.length})` },
              { key: 'RATE', label: `Rate-wise ITC (${gstr2.rateWise.length})` },
              { key: 'HSN', label: `HSN Inward (${gstr2.hsnSummary.length})` },
              { key: 'SUPPLIER', label: `Distributor Summary (${gstr2.supplierSummary.length})` },
            ].map((sub) => (
              <button
                key={sub.key}
                onClick={() => setGstr2SubTab(sub.key as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  gstr2SubTab === sub.key
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* SubTab 1: B2B Inward Invoices */}
          {gstr2SubTab === 'B2B' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center">
                  <Package className="w-4 h-4 mr-2 text-indigo-600" />
                  B2B Inward Supplies (Distributor Invoices & Claimed ITC)
                </span>
                <span className="text-xs text-slate-500 font-semibold">Total Invoices: {gstr2.b2b.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase">
                    <tr>
                      <th className="px-5 py-3 text-left">Invoice #</th>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-left">Distributor Name</th>
                      <th className="px-5 py-3 text-left">Distributor GSTIN</th>
                      <th className="px-5 py-3 text-right">Taxable (₹)</th>
                      <th className="px-5 py-3 text-right">CGST (₹)</th>
                      <th className="px-5 py-3 text-right">SGST (₹)</th>
                      <th className="px-5 py-3 text-right">IGST (₹)</th>
                      <th className="px-5 py-3 text-right">Total ITC (₹)</th>
                      <th className="px-5 py-3 text-right">Invoice Total (₹)</th>
                      <th className="px-5 py-3 text-center">ITC Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {gstr2.b2b.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-6 py-8 text-center text-slate-400 font-medium">
                          No inward distributor purchase invoices recorded in this period.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {gstr2.b2b.map((b, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-5 py-3.5 font-black text-indigo-600">{b.invoiceNumber}</td>
                            <td className="px-5 py-3.5 text-slate-500 font-medium">
                              {new Date(b.invoiceDate).toLocaleDateString('en-IN')}
                            </td>
                            <td className="px-5 py-3.5 font-bold text-slate-900">{b.supplierName}</td>
                            <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">{b.supplierGstin || 'UNREGISTERED'}</td>
                            <td className="px-5 py-3.5 text-right font-medium text-slate-700">₹{b.taxableValue.toFixed(2)}</td>
                            <td className="px-5 py-3.5 text-right font-medium text-slate-700">₹{b.cgst.toFixed(2)}</td>
                            <td className="px-5 py-3.5 text-right font-medium text-slate-700">₹{b.sgst.toFixed(2)}</td>
                            <td className="px-5 py-3.5 text-right font-medium text-slate-700">₹{b.igst.toFixed(2)}</td>
                            <td className="px-5 py-3.5 text-right font-black text-blue-600">₹{b.totalTax.toFixed(2)}</td>
                            <td className="px-5 py-3.5 text-right font-black text-slate-900">₹{b.invoiceValue.toFixed(2)}</td>
                            <td className="px-5 py-3.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                {b.itcEligibility}
                              </span>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-black">
                          <td colSpan={4} className="px-5 py-3.5 text-slate-900">Total Inward Supplies</td>
                          <td className="px-5 py-3.5 text-right text-slate-900">
                            ₹{gstr2.b2b.reduce((acc, c) => acc + c.taxableValue, 0).toFixed(2)}
                          </td>
                          <td className="px-5 py-3.5 text-right text-slate-900">
                            ₹{gstr2.b2b.reduce((acc, c) => acc + c.cgst, 0).toFixed(2)}
                          </td>
                          <td className="px-5 py-3.5 text-right text-slate-900">
                            ₹{gstr2.b2b.reduce((acc, c) => acc + c.sgst, 0).toFixed(2)}
                          </td>
                          <td className="px-5 py-3.5 text-right text-slate-900">
                            ₹{gstr2.b2b.reduce((acc, c) => acc + c.igst, 0).toFixed(2)}
                          </td>
                          <td className="px-5 py-3.5 text-right text-blue-700 font-black">
                            ₹{gstr2.b2b.reduce((acc, c) => acc + c.totalTax, 0).toFixed(2)}
                          </td>
                          <td className="px-5 py-3.5 text-right text-slate-900 font-black">
                            ₹{gstr2.b2b.reduce((acc, c) => acc + c.invoiceValue, 0).toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubTab 2: Rate-wise Purchases */}
          {gstr2SubTab === 'RATE' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Rate-wise Inward Supplies (Grouped by Purchase GST Slabs)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">GST Rate</th>
                      <th className="px-6 py-3 text-right">Taxable Purchases (₹)</th>
                      <th className="px-6 py-3 text-right">CGST (₹)</th>
                      <th className="px-6 py-3 text-right">SGST (₹)</th>
                      <th className="px-6 py-3 text-right">IGST (₹)</th>
                      <th className="px-6 py-3 text-right">Total Eligible ITC (₹)</th>
                      <th className="px-6 py-3 text-right">Total Purchases Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {gstr2.rateWise.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400 font-medium">
                          No rate-wise purchase items found in this period.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {gstr2.rateWise.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-6 py-3.5 font-black text-indigo-600">{r.rate}%</td>
                            <td className="px-6 py-3.5 text-right font-medium text-slate-700">₹{r.taxableValue.toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-right font-medium text-slate-700">₹{r.cgst.toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-right font-medium text-slate-700">₹{r.sgst.toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-right font-medium text-slate-700">₹{r.igst.toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-right font-black text-blue-600">₹{r.totalTax.toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-right font-black text-slate-900">₹{r.totalValue.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-black">
                          <td className="px-6 py-3 text-slate-900">Grand Total</td>
                          <td className="px-6 py-3 text-right text-slate-900">
                            ₹{gstr2.rateWise.reduce((acc, c) => acc + c.taxableValue, 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-right text-slate-900">
                            ₹{gstr2.rateWise.reduce((acc, c) => acc + c.cgst, 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-right text-slate-900">
                            ₹{gstr2.rateWise.reduce((acc, c) => acc + c.sgst, 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-right text-slate-900">
                            ₹{gstr2.rateWise.reduce((acc, c) => acc + c.igst, 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-right text-blue-700 font-black">
                            ₹{gstr2.rateWise.reduce((acc, c) => acc + c.totalTax, 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-right text-slate-900 font-black">
                            ₹{gstr2.rateWise.reduce((acc, c) => acc + c.totalValue, 0).toFixed(2)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubTab 3: HSN Inward Summary */}
          {gstr2SubTab === 'HSN' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  HSN-wise Summary of Inward Medicine Purchases
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">HSN Code</th>
                      <th className="px-6 py-3 text-left">Description</th>
                      <th className="px-6 py-3 text-center">UQC</th>
                      <th className="px-6 py-3 text-right">Quantity</th>
                      <th className="px-6 py-3 text-right">Total Purchases (₹)</th>
                      <th className="px-6 py-3 text-right">Taxable Value (₹)</th>
                      <th className="px-6 py-3 text-right">Rate</th>
                      <th className="px-6 py-3 text-right">CGST (₹)</th>
                      <th className="px-6 py-3 text-right">SGST (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {gstr2.hsnSummary.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-slate-400 font-medium">
                          No HSN medicine purchases recorded in this period.
                        </td>
                      </tr>
                    ) : (
                      gstr2.hsnSummary.map((h, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-6 py-3.5 font-mono font-bold text-indigo-600">{h.hsnCode}</td>
                          <td className="px-6 py-3.5 font-semibold text-slate-800">{h.description}</td>
                          <td className="px-6 py-3.5 text-center text-slate-500 font-bold">{h.uqc}</td>
                          <td className="px-6 py-3.5 text-right font-bold text-slate-900">{h.totalQuantity}</td>
                          <td className="px-6 py-3.5 text-right text-slate-700">₹{h.totalValue.toFixed(2)}</td>
                          <td className="px-6 py-3.5 text-right font-semibold text-slate-900">₹{h.taxableValue.toFixed(2)}</td>
                          <td className="px-6 py-3.5 text-right font-black text-indigo-600">{h.rate}%</td>
                          <td className="px-6 py-3.5 text-right text-slate-700">₹{h.cgst.toFixed(2)}</td>
                          <td className="px-6 py-3.5 text-right text-slate-700">₹{h.sgst.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubTab 4: Distributor / Supplier Summary */}
          {gstr2SubTab === 'SUPPLIER' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center">
                  <ShoppingBag className="w-4 h-4 mr-2 text-indigo-600" />
                  Distributor & Supplier-wise Input Tax Credit (ITC) Summary
                </span>
                <span className="text-xs text-slate-500 font-semibold">{gstr2.supplierSummary.length} Distributors</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">Distributor / Supplier</th>
                      <th className="px-6 py-3 text-left">GSTIN</th>
                      <th className="px-6 py-3 text-left">City</th>
                      <th className="px-6 py-3 text-center">Invoices</th>
                      <th className="px-6 py-3 text-right">Taxable Purchases (₹)</th>
                      <th className="px-6 py-3 text-right">CGST (₹)</th>
                      <th className="px-6 py-3 text-right">SGST (₹)</th>
                      <th className="px-6 py-3 text-right">Total Eligible ITC (₹)</th>
                      <th className="px-6 py-3 text-right">Total Purchases (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {gstr2.supplierSummary.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-slate-400 font-medium">
                          No distributors recorded for this period.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {gstr2.supplierSummary.map((s, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-6 py-3.5 font-bold text-slate-900">{s.supplierName}</td>
                            <td className="px-6 py-3.5 font-mono text-[11px] text-slate-600">{s.supplierGstin || 'UNREGISTERED'}</td>
                            <td className="px-6 py-3.5 text-slate-500 font-medium">{s.supplierCity || '—'}</td>
                            <td className="px-6 py-3.5 text-center font-bold text-slate-700">{s.totalInvoices}</td>
                            <td className="px-6 py-3.5 text-right font-medium text-slate-700">₹{s.taxableValue.toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-right font-medium text-slate-700">₹{s.cgst.toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-right font-medium text-slate-700">₹{s.sgst.toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-right font-black text-blue-600">₹{s.totalItc.toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-right font-black text-slate-900">₹{s.totalPurchases.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-black">
                          <td colSpan={3} className="px-6 py-3 text-slate-900">Total All Distributors</td>
                          <td className="px-6 py-3 text-center text-slate-900">
                            {gstr2.supplierSummary.reduce((acc, c) => acc + c.totalInvoices, 0)}
                          </td>
                          <td className="px-6 py-3 text-right text-slate-900">
                            ₹{gstr2.supplierSummary.reduce((acc, c) => acc + c.taxableValue, 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-right text-slate-900">
                            ₹{gstr2.supplierSummary.reduce((acc, c) => acc + c.cgst, 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-right text-slate-900">
                            ₹{gstr2.supplierSummary.reduce((acc, c) => acc + c.sgst, 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-right text-blue-700 font-black">
                            ₹{gstr2.supplierSummary.reduce((acc, c) => acc + c.totalItc, 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-right text-slate-900 font-black">
                            ₹{gstr2.supplierSummary.reduce((acc, c) => acc + c.totalPurchases, 0).toFixed(2)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. GSTR-3B View */}
      {activeFormTab === 'GSTR3B' && (
        <div className="space-y-6">
          {/* Table 3.1 Outward Taxable Supplies */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                3.1 Details of Outward Supplies and inward supplies liable to reverse charge
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Nature of Supplies</th>
                    <th className="px-6 py-3 text-right">Total Taxable Value (₹)</th>
                    <th className="px-6 py-3 text-right">Integrated Tax (₹)</th>
                    <th className="px-6 py-3 text-right">Central Tax (₹)</th>
                    <th className="px-6 py-3 text-right">State/UT Tax (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  <tr>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      (a) Outward taxable supplies (other than zero rated, nil rated and exempted)
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">₹{out.taxableAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-700">₹{out.igst.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-700">₹{out.cgst.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-700">₹{out.sgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold text-slate-500">
                      (b) Outward taxable supplies (zero rated)
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500">₹0.00</td>
                    <td className="px-6 py-4 text-right text-slate-500">₹0.00</td>
                    <td className="px-6 py-4 text-right text-slate-500">₹0.00</td>
                    <td className="px-6 py-4 text-right text-slate-500">₹0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 4 Eligible Input Tax Credit (ITC) */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                4. Eligible Input Tax Credit (ITC) from Purchases
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Details</th>
                    <th className="px-6 py-3 text-right">Taxable Purchases (₹)</th>
                    <th className="px-6 py-3 text-right">Integrated Tax (₹)</th>
                    <th className="px-6 py-3 text-right">Central Tax (₹)</th>
                    <th className="px-6 py-3 text-right">State/UT Tax (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  <tr>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      (A) ITC Available (All other ITC - Distributor purchases)
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">₹{itc.taxableAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-blue-600">₹{itc.igst.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-blue-600">₹{itc.cgst.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-blue-600">₹{itc.sgst.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-black">
                    <td className="px-6 py-3 text-slate-900">
                      (C) Net ITC Available (A - B)
                    </td>
                    <td className="px-6 py-3 text-right text-slate-900">₹{itc.taxableAmount.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-blue-600">₹{itc.igst.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-blue-600">₹{itc.cgst.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-blue-600">₹{itc.sgst.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 5 Net Tax Payable in Cash */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                5. Net Tax Payable in Cash (Outward Liability less Eligible ITC)
              </h3>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Final Amount for CA Challan
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Tax Head</th>
                    <th className="px-6 py-3 text-right">Output Tax Liability (₹)</th>
                    <th className="px-6 py-3 text-right">ITC Available (₹)</th>
                    <th className="px-6 py-3 text-right">Net Tax Payable in Cash (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  <tr>
                    <td className="px-6 py-3.5 font-bold text-slate-800">Integrated Tax (IGST)</td>
                    <td className="px-6 py-3.5 text-right font-medium text-slate-700">₹{out.igst.toFixed(2)}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-blue-600">₹{itc.igst.toFixed(2)}</td>
                    <td className="px-6 py-3.5 text-right font-black text-slate-900">₹{netPay.igst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5 font-bold text-slate-800">Central Tax (CGST)</td>
                    <td className="px-6 py-3.5 text-right font-medium text-slate-700">₹{out.cgst.toFixed(2)}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-blue-600">₹{itc.cgst.toFixed(2)}</td>
                    <td className="px-6 py-3.5 text-right font-black text-slate-900">₹{netPay.cgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5 font-bold text-slate-800">State/UT Tax (SGST)</td>
                    <td className="px-6 py-3.5 text-right font-medium text-slate-700">₹{out.sgst.toFixed(2)}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-blue-600">₹{itc.sgst.toFixed(2)}</td>
                    <td className="px-6 py-3.5 text-right font-black text-slate-900">₹{netPay.sgst.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-indigo-50/50 font-black text-sm">
                    <td className="px-6 py-4 text-indigo-900">Total Net Tax Payable</td>
                    <td className="px-6 py-4 text-right text-indigo-900">₹{out.totalTax.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-blue-700">₹{itc.totalTax.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-emerald-700 text-base">₹{netPay.totalTax.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
