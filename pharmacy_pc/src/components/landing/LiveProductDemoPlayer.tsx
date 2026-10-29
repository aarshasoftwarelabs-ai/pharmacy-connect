import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Package, 
  Receipt, 
  Layers, 
  CheckCircle2, 
  Printer, 
  Send, 
  Building2, 
  IndianRupee, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  FileSpreadsheet, 
  QrCode, 
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Zap,
  Volume2,
  VolumeX,
  Search,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveProductDemoPlayer() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0);
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState<'gu' | 'en'>('gu');
  const [interactiveMode, setInteractiveMode] = useState(false);

  // Scene 1 animated states
  const [scanLaserActive, setScanLaserActive] = useState(true);
  const [searchTyped, setSearchTyped] = useState('');
  const [scannedItemsCount, setScannedItemsCount] = useState(1);

  // Scene 2 animated states
  const [tenderSelected, setTenderSelected] = useState<'UPI' | 'CASH' | 'CARD'>('UPI');
  const [receiptPrinted, setReceiptPrinted] = useState(false);
  const [whatsAppDispatched, setWhatsAppDispatched] = useState(false);

  // Scene 3 animated states
  const [taxTab, setTaxTab] = useState<'GSTR1' | 'GSTR2' | 'GSTR3B'>('GSTR2');
  const [excelDownloaded, setExcelDownloaded] = useState(false);

  const STEP_DURATION = 12000; // 12 seconds per step

  // Auto-play master timer
  useEffect(() => {
    if (!isPlaying || interactiveMode) return;

    const intervalTime = 100;
    const increment = (intervalTime / STEP_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next step
          setCurrentStep((curr) => {
            const next = ((curr + 1) % 3) as 0 | 1 | 2;
            return next;
          });
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, interactiveMode, currentStep]);

  // Step changes trigger micro-animations
  useEffect(() => {
    setProgress(0);
    if (currentStep === 0) {
      // Scene 1: Search typing & barcode scan loop
      setSearchTyped('');
      setScannedItemsCount(1);
      const textToType = 'Augmentin 625 Duo';
      let idx = 0;
      const typeTimer = setInterval(() => {
        if (idx <= textToType.length) {
          setSearchTyped(textToType.slice(0, idx));
          idx++;
        } else {
          clearInterval(typeTimer);
          setTimeout(() => setScannedItemsCount(3), 1500);
        }
      }, 120);

      const laserTimer = setInterval(() => {
        setScanLaserActive(prev => !prev);
      }, 2000);

      return () => {
        clearInterval(typeTimer);
        clearInterval(laserTimer);
      };
    } else if (currentStep === 1) {
      // Scene 2: Multi-tender & receipt roll
      setReceiptPrinted(false);
      setWhatsAppDispatched(false);
      const t1 = setTimeout(() => setTenderSelected('UPI'), 1000);
      const t2 = setTimeout(() => setReceiptPrinted(true), 2500);
      const t3 = setTimeout(() => setWhatsAppDispatched(true), 4500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else if (currentStep === 2) {
      // Scene 3: GSTR tabs & excel download
      setExcelDownloaded(false);
      setTaxTab('GSTR2');
      const t1 = setTimeout(() => setExcelDownloaded(true), 4000);
      return () => clearTimeout(t1);
    }
  }, [currentStep]);

  const steps = [
    {
      id: 0,
      title: '1. Fast Barcode Billing',
      titleGu: '૧. સુપરફાસ્ટ બારકોડ બિલિંગ',
      desc: 'Instant scan, expiry batch select & auto calculations',
      descGu: 'બારકોડ સ્કેન, FEFO બેચ અને ઓટોમેટિક કેલ્ક્યુલેશન',
      icon: Package
    },
    {
      id: 1,
      title: '2. Payment & Thermal Receipt',
      titleGu: '૨. પેમેન્ટ & વ્હોટ્સએપ બિલ',
      desc: 'Multi-tender UPI QR, 3-sec thermal print & WhatsApp invoice',
      descGu: 'UPI QR પેમેન્ટ, થર્મલ પ્રિન્ટ અને WhatsApp રસીદ',
      icon: Receipt
    },
    {
      id: 2,
      title: '3. 1-Click GST Returns (GSTR-1, 2 & 3B)',
      titleGu: '૩. ૧-ક્લિક GST રિટર્ન & ITC',
      desc: 'Outward sales, inward distributor ITC & Gov-ready Excel',
      descGu: 'વેચાણ રિટર્ન, ખરીદી ITC ક્રેડિટ અને ઓડિટ એક્સેલ',
      icon: Layers
    }
  ] as const;

  const captions = {
    0: {
      en: 'Scan barcode or type medicine name: System selects the nearest expiry batch automatically, calculates GST & discounts within seconds.',
      gu: 'દવા સર્ચ કરો અથવા બારકોડ સ્કેન કરો: સિસ્ટમ ઓટોમેટિક સાચી બેચ & એક્સપાયરી પસંદ કરી સેકન્ડોમાં GST ગણી નાખશે.'
    },
    1: {
      en: 'Customer pays via Dynamic UPI QR Code, Cash or Card. Instant 3-inch thermal bill prints and digital invoice sends to WhatsApp!',
      gu: 'ગ્રાહક UPI QR કોડ અથવા રોકડથી ચૂકવે છે. ૩ સેકન્ડમાં થર્મલ પ્રિન્ટ નીકળે છે અને કસ્ટમરના WhatsApp પર બિલ પહોંચી જાય છે!'
    },
    2: {
      en: 'Complete GSTR-1, GSTR-2 (Inward Purchases & ITC) and GSTR-3B auto-generated from real store data. Download Excel for your CA in 1 click.',
      gu: 'GSTR-1, GSTR-2 (ખરીદી ITC) અને GSTR-3B રીપોર્ટ્સ ઓટોમેટિક તૈયાર થાય છે. CA માટે સરકારી એક્સેલ ૧-ક્લિકમાં ડાઉનલોડ કરો.'
    }
  };

  const handleStepClick = (stepIndex: 0 | 1 | 2) => {
    setCurrentStep(stepIndex);
    setProgress(0);
  };

  return (
    <div className="rounded-3xl bg-slate-950 text-slate-100 shadow-2xl border border-slate-800 overflow-hidden relative">
      
      {/* 1. TOP VIDEO PLAYER CHROME / HEADER */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Mac OS window dots & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
          <div className="flex items-center gap-2 text-xs font-black text-slate-200">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>DavaSetu Cloud POS 3.0 • Live Animated Product Tour</span>
          </div>
        </div>

        {/* Video Player Controls */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Live Animation Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[11px]">
            <span className={`w-2 h-2 rounded-full bg-emerald-400 ${isPlaying ? 'animate-ping' : ''}`}></span>
            <span>{isPlaying ? 'AUTO-PLAYING' : 'PAUSED'}</span>
          </div>

          {/* Play / Pause Toggle Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 sm:px-3 sm:py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition flex items-center gap-1.5"
            title={isPlaying ? 'Pause Demo' : 'Play Demo'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Restart Tour Button */}
          <button
            onClick={() => {
              setCurrentStep(0);
              setProgress(0);
              setIsPlaying(true);
            }}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
            title="Restart Tour from Beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Gujarati / English Subtitle Switch */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setLanguage('gu')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${language === 'gu' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'}`}
            >
              ગુજરાતી
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${language === 'en' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'}`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* 2. THREE-STEP TIMELINE TRACK WITH SMOOTH PROGRESS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 bg-slate-900 border-b border-slate-800">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = currentStep === idx;
          const isPassed = currentStep > idx;

          return (
            <button
              key={s.id}
              onClick={() => handleStepClick(idx as 0 | 1 | 2)}
              className={`text-left p-3.5 sm:p-4 border-b md:border-b-0 md:border-r border-slate-800 transition-all relative overflow-hidden group ${
                isActive ? 'bg-slate-800/80' : 'hover:bg-slate-800/40 opacity-70 hover:opacity-100'
              }`}
            >
              {/* Animated Progress Strip for active step */}
              {isActive && isPlaying && (
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              )}
              {isPassed && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/80" />
              )}

              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 transition-transform ${
                  isActive ? 'bg-emerald-500 text-slate-950 scale-105 font-black shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs sm:text-sm font-extrabold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {language === 'gu' ? s.titleGu : s.title}
                    </p>
                    {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                    {language === 'gu' ? s.descGu : s.desc}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. MAIN VIDEO STAGE / SIMULATED SCREEN CANVAS */}
      <div className="p-4 sm:p-6 lg:p-8 min-h-[460px] flex flex-col justify-between relative bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950">
        
        <AnimatePresence mode="wait">
          {/* ========================================================
              SCENE 1: FAST BARCODE BILLING & MEDICINE SCAN
             ======================================================== */}
          {currentStep === 0 && (
            <motion.div
              key="scene-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              {/* Left Column: Interactive Terminal Scan */}
              <div className="lg:col-span-7 space-y-4">
                {/* Search / Scan Bar with Animated Laser Sweep */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
                  {/* Simulated Red Laser Scanner line */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#f43f5e] animate-pulse pointer-events-none top-6" />

                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                      <Zap className="w-3.5 h-3.5" /> Laser Barcode Scanner & Search
                    </span>
                    <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                      Scanner: Connected
                    </span>
                  </div>

                  <div className="relative">
                    <div className="flex items-center bg-slate-950 border border-emerald-500/50 rounded-xl px-3.5 py-3 shadow-inner">
                      <Search className="w-4 h-4 text-emerald-400 mr-2.5 shrink-0" />
                      <span className="font-mono text-sm text-white font-bold">
                        {searchTyped}
                        <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse align-middle" />
                      </span>
                    </div>

                    {/* Auto-suggest dropdown with Batch FEFO details */}
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-white p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-emerald-400" />
                          <span>Augmentin 625 Duo (Amoxycillin + Clavulanic)</span>
                        </div>
                        <span className="text-emerald-400 font-black">₹223.50</span>
                      </div>
                      <div className="px-2 py-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Batch: <strong className="text-white">AG2490</strong> • Stock: 48</span>
                        <span className="text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded font-bold">
                          FEFO Expiry: Oct 2027 (Safe)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scanned Items in Live Counter Cart */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
                    <span>Scanned Medicines in Cart ({scannedItemsCount})</span>
                    <span className="text-emerald-400">✓ Barcode Verified</span>
                  </div>

                  <div className="space-y-2">
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }} 
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-white text-sm">Dolo 650mg Paracetamol Tablets</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">Micro Labs • Batch: DL883 • Exp: 12/28</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">2 Strips</span>
                        <span className="font-black text-emerald-400 text-sm">₹62.00</span>
                      </div>
                    </motion.div>

                    {scannedItemsCount >= 2 && (
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-white text-sm">Augmentin 625 Duo Tablets</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">GSK Pharma • Batch: AG2490 • Exp: 10/27</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">1 Strip</span>
                          <span className="font-black text-emerald-400 text-sm">₹223.50</span>
                        </div>
                      </motion.div>
                    )}

                    {scannedItemsCount >= 3 && (
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-white text-sm">Azithral 500mg Tablets</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">Alembic • Batch: AZ102 • Exp: 05/28</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">1 Pack</span>
                          <span className="font-black text-emerald-400 text-sm">₹119.00</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Instant Live Summary & Patient Card */}
              <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span className="font-extrabold text-sm text-white">Live Bill Calculation</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    POS Active
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total MRP Value:</span>
                    <span className="font-mono text-white font-bold">{scannedItemsCount >= 3 ? '₹404.50' : '₹285.50'}</span>
                  </div>
                  <div className="flex justify-between text-teal-400">
                    <span>Retail Chemist Discount (10%):</span>
                    <span className="font-mono font-bold">{scannedItemsCount >= 3 ? '- ₹40.45' : '- ₹28.55'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>GST (CGST 6% + SGST 6%):</span>
                    <span className="font-mono text-white font-bold">{scannedItemsCount >= 3 ? '+ ₹43.68' : '+ ₹30.83'}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="font-extrabold text-white text-sm">Net Payable Cash:</span>
                    <span className="font-black text-2xl text-emerald-400">
                      {scannedItemsCount >= 3 ? '₹407.73' : '₹287.78'}
                    </span>
                  </div>
                </div>

                {/* Patient Quick Card */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Phone / Name</span>
                    <p className="font-bold text-white mt-0.5">Mahesh Patel (+91 98765 43210)</p>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px]">
                    Auto Loyalty
                  </span>
                </div>

                <div className="pt-1">
                  <div className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Scanned in 1.8 seconds • Ready to Print</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================
              SCENE 2: PAYMENT & THERMAL RECEIPT + WHATSAPP
             ======================================================== */}
          {currentStep === 1 && (
            <motion.div
              key="scene-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              {/* Left Column: Tender Selector & Dynamic UPI QR */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-emerald-400" />
                      <span>Instant Multi-Tender Payment</span>
                    </h4>
                    <span className="text-xs text-emerald-400 font-mono font-bold">Bill: #DS-9481</span>
                  </div>

                  {/* Payment Tabs */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setTenderSelected('UPI')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                        tenderSelected === 'UPI'
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>UPI QR</span>
                    </button>
                    <button
                      onClick={() => setTenderSelected('CASH')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                        tenderSelected === 'CASH'
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>Cash</span>
                    </button>
                    <button
                      onClick={() => setTenderSelected('CARD')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                        tenderSelected === 'CARD'
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Credit / Card</span>
                    </button>
                  </div>

                  {/* Dynamic UPI Simulated Card */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-4">
                    <div className="w-24 h-24 bg-white p-1.5 rounded-xl flex items-center justify-center shrink-0">
                      <QrCode className="w-20 h-20 text-slate-900" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-black tracking-wider block">
                        Auto-Generated Dynamic QR
                      </span>
                      <p className="text-white font-extrabold text-base">₹407.73</p>
                      <p className="text-slate-400 text-[11px]">Pay via PhonePe, GPay, Paytm or any BHIM UPI</p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" /> Payment Auto-Detected
                      </span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Digital Receipt Pill */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: whatsAppDispatched ? 1 : 0.4, y: 0 }}
                  className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-white">WhatsApp Digital Receipt</h5>
                      <p className="text-[11px] text-emerald-300">Sent to Mahesh Patel (+91 98765 43210)</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-full">
                    ✓ Delivered
                  </span>
                </motion.div>
              </div>

              {/* Right Column: Thermal Paper Bill Animation */}
              <div className="lg:col-span-6 flex justify-center">
                <div className="w-full max-w-sm relative">
                  {/* Printer slot simulation */}
                  <div className="w-full h-4 bg-slate-800 rounded-t-xl border border-slate-700 flex items-center justify-center">
                    <span className="w-16 h-1 bg-slate-950 rounded-full"></span>
                  </div>

                  {/* Animated Thermal Paper Roll sliding out */}
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="bg-white text-slate-900 p-5 rounded-b-2xl shadow-2xl font-mono text-xs space-y-3 border-t-2 border-dashed border-slate-300"
                  >
                    <div className="text-center pb-2 border-b border-dashed border-slate-300">
                      <h4 className="font-black text-sm tracking-tight text-slate-900">DAVASETU CHEMIST & POS</h4>
                      <p className="text-[10px] text-slate-600">Katargam, Surat, Gujarat • Ph: 9664781007</p>
                      <p className="text-[10px] font-bold text-slate-700 mt-0.5">GSTIN: 24AAACR1234F1Z8</p>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Invoice: #DS-2026-9481</span>
                      <span>29-Oct-2026 12:45 PM</span>
                    </div>

                    {/* Table */}
                    <div className="space-y-1.5 pt-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>Item (Batch / Exp)</span>
                        <span>Amt (₹)</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Dolo 650mg (2x)</span>
                        <span>62.00</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Augmentin 625 Duo (1x)</span>
                        <span>223.50</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Azithral 500mg (1x)</span>
                        <span>119.00</span>
                      </div>
                    </div>

                    {/* Totals */}
                    <div className="space-y-1 text-[11px] pt-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span>₹404.50</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Retail Discount (10%):</span>
                        <span>- ₹40.45</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>GST (CGST+SGST 12%):</span>
                        <span>+ ₹43.68</span>
                      </div>
                      <div className="flex justify-between font-black text-sm text-slate-900 pt-1.5 border-t border-slate-300">
                        <span>NET AMOUNT:</span>
                        <span className="text-emerald-700 font-extrabold text-base">₹407.73</span>
                      </div>
                      <p className="text-[10px] text-center text-slate-500 pt-2">Paid via UPI • Thank you! Get well soon.</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================
              SCENE 3: 1-CLICK GST RETURNS & CA ITC AUDIT
             ======================================================== */}
          {currentStep === 2 && (
            <motion.div
              key="scene-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="space-y-5"
            >
              {/* CA Tax Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-white">Raju Pharmacy</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        GST Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      GSTIN: <strong className="text-white">24AAACR1234F1Z8</strong> • State: Gujarat (Code 24)
                    </p>
                  </div>
                </div>

                {/* 1-Click Export Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> GSTR-1 Excel
                  </span>
                  <motion.span 
                    animate={excelDownloaded ? { scale: [1, 1.08, 1] } : {}}
                    className={`px-3 py-1.5 rounded-lg text-white font-black text-xs flex items-center gap-1.5 shadow-md ${
                      excelDownloaded ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-indigo-600/80'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" /> GSTR-2 Excel (ITC)
                  </motion.span>
                  <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> GSTR-3B Excel
                  </span>
                </div>
              </div>

              {/* 3 Metric Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="flex items-center text-emerald-400 font-bold">
                      <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Outward Sales Tax
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">GSTR-1</span>
                  </div>
                  <p className="text-xl font-black text-white">₹48,650.00</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">On Taxable Sales: ₹4,05,416.00</p>
                </div>

                <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs text-indigo-300 mb-1">
                    <span className="flex items-center text-blue-400 font-bold">
                      <ArrowDownRight className="w-3.5 h-3.5 mr-1" /> Eligible ITC Credit
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400">GSTR-2</span>
                  </div>
                  <p className="text-xl font-black text-blue-300">₹36,420.00</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">From 14 Distributor Invoices</p>
                </div>

                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
                    <span className="flex items-center font-bold">
                      <IndianRupee className="w-3.5 h-3.5 mr-1" /> Net Cash Tax Payable
                    </span>
                    <span className="text-[10px] font-mono text-amber-400">GSTR-3B</span>
                  </div>
                  <p className="text-xl font-black text-amber-300">₹12,230.00</p>
                  <p className="text-[10px] text-amber-200/80 mt-0.5">CGST: ₹6,115 | SGST: ₹6,115</p>
                </div>
              </div>

              {/* GSTR-2 Inward Supplies Table */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden text-xs">
                <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    GSTR-2 Inward Supplies (Distributor Invoices & Claimed ITC)
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">100% Gov Reconciled</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono">
                    <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase">
                      <tr>
                        <th className="px-3.5 py-2">Invoice #</th>
                        <th className="px-3.5 py-2">Distributor Name</th>
                        <th className="px-3.5 py-2">GSTIN</th>
                        <th className="px-3.5 py-2 text-right">Taxable (₹)</th>
                        <th className="px-3.5 py-2 text-right">Eligible ITC (₹)</th>
                        <th className="px-3.5 py-2 text-right">Total Invoice (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-[11px]">
                      <tr>
                        <td className="px-3.5 py-2 font-bold text-indigo-400">INV-8821</td>
                        <td className="px-3.5 py-2 text-white">Bhoola Distributors</td>
                        <td className="px-3.5 py-2 text-slate-400">24AABCB1234F1Z1</td>
                        <td className="px-3.5 py-2 text-right text-slate-300">1,42,000.00</td>
                        <td className="px-3.5 py-2 text-right font-bold text-blue-400">17,040.00</td>
                        <td className="px-3.5 py-2 text-right text-white font-bold">1,59,040.00</td>
                      </tr>
                      <tr>
                        <td className="px-3.5 py-2 font-bold text-indigo-400">SP-4029</td>
                        <td className="px-3.5 py-2 text-white">Sun Pharma Agency</td>
                        <td className="px-3.5 py-2 text-slate-400">24AACCS5678H1Z3</td>
                        <td className="px-3.5 py-2 text-right text-slate-300">98,500.00</td>
                        <td className="px-3.5 py-2 text-right font-bold text-blue-400">11,820.00</td>
                        <td className="px-3.5 py-2 text-right text-white font-bold">1,10,320.00</td>
                      </tr>
                      <tr>
                        <td className="px-3.5 py-2 font-bold text-indigo-400">CP-9102</td>
                        <td className="px-3.5 py-2 text-white">Cipla Direct Agency</td>
                        <td className="px-3.5 py-2 text-slate-400">24AAACC9012K1Z9</td>
                        <td className="px-3.5 py-2 text-right text-slate-300">63,000.00</td>
                        <td className="px-3.5 py-2 text-right font-bold text-blue-400">7,560.00</td>
                        <td className="px-3.5 py-2 text-right text-white font-bold">70,560.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* 4. BOTTOM DYNAMIC SUBTITLE / CAPTION STRIP */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <p className="text-slate-200 font-semibold leading-relaxed">
            <span className="text-emerald-400 font-bold uppercase tracking-wider mr-1.5">
              {language === 'gu' ? 'લાઇવ ડેમો:' : 'Live Narration:'}
            </span>
            {captions[currentStep][language]}
          </p>
        </div>

        {/* Action Button inside Player */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="#pricing"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Start 15-Day Free Trial</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

    </div>
  );
}
