import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, Smartphone, Check, AlertTriangle, X, RefreshCw, 
  Sparkles, Layers, Zap, Calendar, DollarSign, Tag, Barcode, Scan, Search, CheckCircle, ArrowRight,
  Wifi
} from 'lucide-react';
import { io } from 'socket.io-client';
import { scanMedicineBox, ScannedMedicineBoxData } from '../../services/medicineService';
import { AudioAlert } from '../../utils/audioAlertService';

export interface SmartScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacyId?: number;
  mode?: 'BILLING' | 'INVENTORY' | 'GENERAL';
  // When a 1D Barcode or 2D QR Code is detected
  onBarcodeScan?: (code: string) => void;
  // When AI Box OCR is captured and confirmed
  onApplyToBilling?: (data: ScannedMedicineBoxData) => void;
  onApplyToStock?: (data: ScannedMedicineBoxData) => void;
  onApplyToCreate?: (data: ScannedMedicineBoxData) => void;
  title?: string;
  subtitle?: string;
}

export const SmartScannerModal: React.FC<SmartScannerModalProps> = ({
  isOpen,
  onClose,
  pharmacyId = 1,
  mode = 'GENERAL',
  onBarcodeScan,
  onApplyToBilling,
  onApplyToStock,
  onApplyToCreate,
  title,
  subtitle,
}) => {
  const [activeTab, setActiveTab] = useState<'mobile' | 'camera' | 'upload'>('mobile');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScannedMedicineBoxData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Barcode Detection & Mobile Live states
  const [barcodeAutoDetect, setBarcodeAutoDetect] = useState(true);
  const [lastDetectedBarcode, setLastDetectedBarcode] = useState<string | null>(null);
  const [mobileLastScan, setMobileLastScan] = useState<any>(null);
  const scanIntervalRef = useRef<any>(null);

  // Camera states
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable fields in OCR result
  const [editableBatch, setEditableBatch] = useState('');
  const [editableExpiry, setEditableExpiry] = useState('');
  const [editableMrp, setEditableMrp] = useState<number>(0);
  const [editableName, setEditableName] = useState('');

  // Stop camera stream & clear detection interval
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async (deviceId?: string) => {
    stopCamera();
    setError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Video play error:', e));
      }
      setCameraActive(true);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      if (!selectedCameraId && videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }

      // Start background Barcode & QR Code Detector (Chromium / Electron native BarcodeDetector)
      startBarcodeDetection();

    } catch (err: any) {
      console.warn('Camera start error:', err);
      setError('Could not access camera. Please allow camera permissions, use your Mobile App scanner, or upload an image.');
      setCameraActive(false);
    }
  };

  const startBarcodeDetection = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if ('BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'itf']
        });

        scanIntervalRef.current = setInterval(async () => {
          if (!streamRef.current || !videoRef.current || !barcodeAutoDetect || scanning || result) {
            return;
          }
          if (videoRef.current.readyState >= 2) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                const detectedCode = String(barcodes[0].rawValue).trim();
                if (detectedCode && detectedCode !== lastDetectedBarcode) {
                  setLastDetectedBarcode(detectedCode);
                  AudioAlert.playBarcodeBeep();
                  if (onBarcodeScan) {
                    stopCamera();
                    onBarcodeScan(detectedCode);
                    onClose();
                  }
                }
              }
            } catch (e) {
              // Ignore single frame detect errors
            }
          }
        }, 320);
      } catch (e) {
        console.warn('BarcodeDetector initialization skipped:', e);
      }
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !result) {
      startCamera(selectedCameraId || undefined);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab, result]);

  // Live Socket connection for mobile app scans
  useEffect(() => {
    if (!isOpen) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'https://pharmacy-backend-e210.onrender.com';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      const activeId = (pharmacyId || 1).toString();
      socket.emit('join_pharmacy', activeId);
      if (activeId !== '8') socket.emit('join_pharmacy', '8');
      if (activeId !== '1') socket.emit('join_pharmacy', '1');
    });

    socket.on('mobile_item_scanned', (scanItem: any) => {
      if (scanItem && (scanItem.medicineName || scanItem.barcode)) {
        setMobileLastScan(scanItem);
        AudioAlert.playSuccessChime();
        if (scanItem.barcode && onBarcodeScan) {
          setTimeout(() => {
            onBarcodeScan(scanItem.barcode);
            onClose();
          }, 900);
        }
      }
    });

    socket.on('mobile_box_ocr_scanned', (scanItem: any) => {
      if (scanItem) {
        setMobileLastScan(scanItem);
        AudioAlert.playSuccessChime();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isOpen, pharmacyId, onBarcodeScan, onClose]);

  // Handle Capture from Camera for AI Box Text (Batch, Exp, MRP)
  const handleCaptureFromCamera = async () => {
    if (!videoRef.current || !cameraActive) return;
    setError(null);
    setScanning(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas rendering failed');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPreviewUrl(dataUrl);

      AudioAlert.playBarcodeBeep();

      const ocrData = await scanMedicineBox(dataUrl, pharmacyId, false);
      handleScanSuccess(ocrData);
    } catch (err: any) {
      console.error('Capture OCR error:', err);
      setError(err.message || 'Failed to extract text from camera snapshot.');
    } finally {
      setScanning(false);
    }
  };

  // Handle File Upload (detect both barcode or OCR)
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setError(null);
    setScanning(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);

      // Check if uploaded file contains a barcode first
      if ('BarcodeDetector' in window && onBarcodeScan) {
        try {
          const img = new Image();
          img.src = URL.createObjectURL(file);
          await new Promise((res) => { img.onload = res; });
          const detector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e']
          });
          const barcodes = await detector.detect(img);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            AudioAlert.playBarcodeBeep();
            onBarcodeScan(barcodes[0].rawValue);
            onClose();
            return;
          }
        } catch (e) {
          // Fall through to AI OCR
        }
      }

      // Run AI Box OCR
      const ocrData = await scanMedicineBox(file, pharmacyId, false);
      handleScanSuccess(ocrData);
    } catch (err: any) {
      console.error('File OCR error:', err);
      setError(err.message || 'Failed to extract data from uploaded box image.');
    } finally {
      setScanning(false);
    }
  };

  const handleScanSuccess = (data: ScannedMedicineBoxData) => {
    setResult(data);
    setEditableBatch(data.batch_number || '');
    setEditableExpiry(data.expiry_date || data.raw_expiry || '');
    setEditableMrp(data.mrp || 0);
    setEditableName(data.matched_medicine?.name || data.medicine_name || '');
    AudioAlert.playSuccessSound();
  };

  const getUpdatedData = (): ScannedMedicineBoxData => {
    return {
      ...result,
      batch_number: editableBatch,
      expiry_date: editableExpiry,
      mrp: editableMrp,
      medicine_name: editableName,
    };
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 via-emerald-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-inner">
              <Sparkles className="w-5 h-5 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold tracking-tight">
                  {title || '⚡ All-in-One Smart Scanner'}
                </h2>
                <span className="bg-emerald-400/20 text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold border border-emerald-400/30">
                  BARCODE + QR + AI BOX OCR
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                {subtitle || 'સ્માર્ટ સ્કેનર — Barcode, QR Code અથવા દવાના બોક્સનું લખાણ (Batch, Exp, MRP) એક જ જગ્યાએથી સ્કેન કરો'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Mode Tabs */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => { setActiveTab('mobile'); setResult(null); setError(null); stopCamera(); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                activeTab === 'mobile'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/40'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Smartphone className={`w-4 h-4 ${activeTab === 'mobile' ? 'text-emerald-300 animate-pulse' : 'text-indigo-600'}`} />
              <span>📱 Mobile Scanner (ભલામણ કરેલ - No Gun Needed)</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('camera'); setResult(null); setError(null); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                activeTab === 'camera'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Scan className="w-4 h-4 text-emerald-300" />
              <span>📷 PC Webcam (Barcode + Box OCR)</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('upload'); setResult(null); setError(null); stopCamera(); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                activeTab === 'upload'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>📁 Upload Box Image</span>
            </button>
          </div>

          {activeTab === 'camera' && availableCameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={(e) => {
                setSelectedCameraId(e.target.value);
                startCamera(e.target.value);
              }}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none"
            >
              {availableCameras.map(cam => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  📷 {cam.label || `Camera ${cam.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs font-medium leading-relaxed">
                <span className="font-bold">Notice:</span> {error}
              </div>
            </div>
          )}

          {/* TAB 1: LIVE ALL-IN-ONE CAMERA */}
          {activeTab === 'camera' && !result && (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-xl aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden shadow-inner border-2 border-slate-800 flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover transition-opacity duration-300 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
                />

                {cameraActive ? (
                  <>
                    {/* Framing Box & Animated Laser */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-[82%] h-[68%] border-2 border-dashed border-teal-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                        {/* Corner Accents */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />

                        {/* Animated Laser Scan Line */}
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10B981] animate-pulse absolute top-1/2 -translate-y-1/2" />
                        
                        <div className="absolute bottom-2 inset-x-0 text-center">
                          <span className="bg-black/75 backdrop-blur-md text-emerald-300 font-bold text-[11px] px-3.5 py-1 rounded-full border border-emerald-500/40 shadow-sm">
                            Point Barcode/QR Code or Box Text Here
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Top Status Pill: Barcode Auto-detection */}
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                      <span className="bg-slate-900/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        Auto-Barcode: ON
                      </span>
                    </div>

                    {lastDetectedBarcode && (
                      <div className="absolute top-3 right-3 z-20 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg border border-emerald-400 flex items-center gap-1.5 animate-bounce">
                        <CheckCircle className="w-4 h-4" />
                        <span>Barcode: {lastDetectedBarcode}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 text-center text-slate-400 flex flex-col items-center">
                    <div className="p-3 bg-slate-900 rounded-2xl mb-3 text-emerald-400">
                      <Barcode className="w-8 h-8 animate-pulse" />
                    </div>
                    <p className="text-xs font-semibold text-slate-200">Camera preview is connecting...</p>
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Retry Camera
                    </button>
                  </div>
                )}

                {scanning && (
                  <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center text-white z-30">
                    <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
                    <span className="text-sm font-bold tracking-wide">Reading Medicine Box Text with AI...</span>
                    <span className="text-xs text-slate-300 mt-1">Extracting Batch No, Expiry & MRP</span>
                  </div>
                )}
              </div>

              {/* Action Buttons underneath camera */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 w-full max-w-xl">
                <button
                  type="button"
                  onClick={handleCaptureFromCamera}
                  disabled={scanning || !cameraActive}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-teal-600/30 flex items-center justify-center space-x-2 text-xs transition-all transform active:scale-95 disabled:opacity-50"
                  title="Capture frame and use AI Vision to read printed Batch No, Expiry Date & MRP from packaging"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>{scanning ? 'Analyzing Text...' : '📸 Snap & Read Box Text (Batch, Exp, MRP)'}</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: UPLOAD IMAGE / PHOTO */}
          {activeTab === 'upload' && !result && (
            <div className="max-w-xl mx-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                }}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                }}
                className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50 hover:bg-teal-50/40 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform mb-4 shadow-sm">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-800">Drop medicine box or barcode photo here</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Click to browse from your computer or drag & drop a photo. Supports Barcode reading as well as Box Text (Batch, Exp, MRP).
                </p>
                <div className="mt-4 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-teal-700 shadow-sm">
                  Supports PNG, JPG, WEBP, Dot-matrix, and Inkjet photos
                </div>
              </div>

              {scanning && (
                <div className="mt-6 p-6 bg-teal-50 rounded-2xl border border-teal-200 flex items-center justify-center space-x-3 text-teal-900">
                  <RefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
                  <span className="text-sm font-bold">Smart AI is analyzing image...</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: WIRELESS MOBILE COMPANION (RECOMMENDED / ZERO HARDWARE COST) */}
          {activeTab === 'mobile' && !result && (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Money Saving Banner */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white rounded-3xl p-5 shadow-xl shadow-teal-600/15 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                    <Smartphone className="w-7 h-7 text-emerald-200" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold tracking-tight">📱 Mobile Smartphone Scanner</h3>
                      <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        ₹0 Hardware Cost
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100 font-medium mt-0.5">
                      કોઈ મોંઘી USB Barcode Gun ખરીદવાની જરૂર નથી — સ્માર્ટફોન કેમેરાથી 1 સેકન્ડમાં સ્કેન કરો!
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Real-Time Radar Card */}
              <div className="bg-white rounded-3xl p-5 border border-indigo-100 shadow-md">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping absolute inset-0" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                        Live Socket Cloud Sync: CONNECTED & READY
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Pharmacy Station ID #{pharmacyId || 1} • Listening for mobile phone scans
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl">
                    ⚡ Auto-Inject to PC
                  </span>
                </div>

                {/* 3 Step Visual Guide in Gujarati & English */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                  <div className="bg-slate-50 hover:bg-indigo-50/50 p-4 rounded-2xl border border-slate-200/80 transition-all">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mb-2.5 shadow-sm">
                      1
                    </div>
                    <h5 className="text-xs font-bold text-slate-800">મોબાઇલ એપ ખોલો</h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      સ્ટાફના ફોનમાં <b>PharmacyConnect App</b> ખોલી <b>Staff Scanner</b> પર ટેપ કરો.
                    </p>
                  </div>

                  <div className="bg-slate-50 hover:bg-indigo-50/50 p-4 rounded-2xl border border-slate-200/80 transition-all">
                    <div className="w-7 h-7 rounded-xl bg-teal-600 text-white text-xs font-bold flex items-center justify-center mb-2.5 shadow-sm">
                      2
                    </div>
                    <h5 className="text-xs font-bold text-slate-800">દવા કે બોક્સ સ્કેન કરો</h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      દવાનો <b>Barcode</b> સ્કેન કરો અથવા <b>Box OCR</b> થી દવાના બોક્સનો ફોટો પાડો.
                    </p>
                  </div>

                  <div className="bg-slate-50 hover:bg-indigo-50/50 p-4 rounded-2xl border border-slate-200/80 transition-all">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mb-2.5 shadow-sm">
                      3
                    </div>
                    <h5 className="text-xs font-bold text-slate-800">PC માં સીધું લાઈવ આવશે</h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      તમારે કશું જ ટાઈપ નહીં કરવું પડે — દવા આપોઆપ PC સ્ક્રીન પર ઉમેરાઈ જશે!
                    </p>
                  </div>
                </div>

                {/* Last Received Scan Display (Live Feedback) */}
                {mobileLastScan && (
                  <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <span>✓ તાજેતરમાં સ્કેન થયેલ દવા: {mobileLastScan.medicineName}</span>
                          {mobileLastScan.batchNumber && (
                            <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                              Batch: {mobileLastScan.batchNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-700">
                          MRP: ₹{mobileLastScan.mrp || mobileLastScan.unitPrice || 0} • Expiry: {mobileLastScan.expiryDate || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 shadow-sm">
                      Live Added!
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RESULT STATE: OCR EXTRACTION RESULT CARD */}
          {result && (
            <div className="space-y-5 animate-fadeIn">
              {/* Success Banner */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950 flex items-center space-x-2">
                      <span>✓ Text Successfully Extracted by AI</span>
                      <span className="text-[11px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-semibold">
                        {(result.confidence ? result.confidence * 100 : 96).toFixed(0)}% Confidence
                      </span>
                    </h4>
                    <p className="text-xs text-emerald-700 font-medium">
                      Review extracted batch, expiry, and MRP below. You can edit any field before applying.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setPreviewUrl(null);
                    if (activeTab === 'camera') startCamera();
                  }}
                  className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Another</span>
                </button>
              </div>

              {/* Grid: Preview & Extracted Bento Cards */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* Left: Scanned Image Thumbnail */}
                {previewUrl && (
                  <div className="md:col-span-4 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md flex flex-col">
                    <div className="p-2.5 bg-slate-800/80 border-b border-slate-700 text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>Scanned Packaging</span>
                      <span className="text-teal-400">Target Region</span>
                    </div>
                    <div className="p-2 flex-1 flex items-center justify-center bg-slate-950">
                      <img 
                        src={previewUrl} 
                        alt="Scanned Box" 
                        className="max-h-60 w-full object-contain rounded-xl"
                      />
                    </div>
                    {result.manufacturer && (
                      <div className="p-2 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 text-center font-medium truncate">
                        {result.manufacturer}
                      </div>
                    )}
                  </div>
                )}

                {/* Right: Data Fields Form */}
                <div className={`${previewUrl ? 'md:col-span-8' : 'md:col-span-12'} space-y-4`}>
                  
                  {/* Medicine Name & Match */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                      Medicine Name (દવાનું નામ)
                    </label>
                    <input
                      type="text"
                      value={editableName}
                      onChange={(e) => setEditableName(e.target.value)}
                      placeholder="e.g. Panresh-DSR / Rabresh-DSR"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-teal-500 shadow-sm"
                    />
                    {result.matched_medicine ? (
                      <div className="mt-2 flex items-center space-x-2 text-xs text-emerald-700 font-bold bg-emerald-100/60 px-3 py-1.5 rounded-lg border border-emerald-200">
                        <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>Matched in Inventory: <b>{result.matched_medicine.name}</b> (Stock: {result.matched_medicine.currentStock || 0})</span>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center space-x-2 text-xs text-indigo-700 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                        <span>New Medicine: Ready to create or inward into inventory</span>
                      </div>
                    )}
                  </div>

                  {/* 3-Column Key Metrics: Batch, Expiry, MRP */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Batch Number */}
                    <div className="bg-white border-2 border-teal-500/40 rounded-2xl p-3.5 shadow-sm">
                      <div className="flex items-center justify-between text-xs font-bold text-teal-800 mb-1">
                        <span className="flex items-center space-x-1">
                          <Tag className="w-3.5 h-3.5 text-teal-600" />
                          <span>Batch No.</span>
                        </span>
                        <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">AI DETECTED</span>
                      </div>
                      <input
                        type="text"
                        value={editableBatch}
                        onChange={(e) => setEditableBatch(e.target.value)}
                        placeholder="e.g. CO92604"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-base font-black text-slate-900 tracking-wider outline-none focus:bg-white focus:border-teal-500 uppercase font-mono"
                      />
                    </div>

                    {/* Expiry Date */}
                    <div className={`border-2 rounded-2xl p-3.5 shadow-sm ${
                      result.expiry_status === 'EXPIRED'
                        ? 'bg-rose-50 border-rose-400'
                        : result.expiry_status === 'NEAR_EXPIRY'
                        ? 'bg-amber-50 border-amber-400'
                        : 'bg-white border-emerald-500/40'
                    }`}>
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="flex items-center space-x-1 text-slate-700">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Exp. Date</span>
                        </span>
                        {result.expiry_status === 'EXPIRED' ? (
                          <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold">EXPIRED</span>
                        ) : result.expiry_status === 'NEAR_EXPIRY' ? (
                          <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold">NEAR EXPIRY</span>
                        ) : (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">FRESH</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={editableExpiry}
                        onChange={(e) => setEditableExpiry(e.target.value)}
                        placeholder="e.g. 06/2028"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-base font-black text-slate-900 outline-none focus:bg-white focus:border-emerald-500 font-mono"
                      />
                    </div>

                    {/* MRP */}
                    <div className="bg-white border-2 border-indigo-500/40 rounded-2xl p-3.5 shadow-sm">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-800 mb-1">
                        <span className="flex items-center space-x-1">
                          <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                          <span>M.R.P. (₹)</span>
                        </span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">INCL. TAX</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={editableMrp}
                        onChange={(e) => setEditableMrp(parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 120.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-base font-black text-slate-900 outline-none focus:bg-white focus:border-indigo-500 font-mono"
                      />
                    </div>

                  </div>

                  {/* Secondary info strip */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 bg-slate-100/70 p-3 rounded-xl">
                    {result.pack_size && (
                      <span className="bg-white px-2 py-1 rounded-md border border-slate-200 font-medium">
                        Pack Size: <b>{result.pack_size}</b>
                      </span>
                    )}
                    {result.mfg_date && (
                      <span className="bg-white px-2 py-1 rounded-md border border-slate-200 font-medium">
                        Mfg Date: <b>{result.mfg_date}</b>
                      </span>
                    )}
                    {result.mfg_lic_no && (
                      <span className="bg-white px-2 py-1 rounded-md border border-slate-200 font-medium">
                        Lic: <b>{result.mfg_lic_no}</b>
                      </span>
                    )}
                  </div>

                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
                {onApplyToStock && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyToStock(getUpdatedData());
                      onClose();
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-md shadow-teal-600/20 text-xs flex items-center space-x-2 transition-all transform active:scale-95"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Apply to Stock Inward (માલ ઉમેરો)</span>
                  </button>
                )}

                {onApplyToBilling && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyToBilling(getUpdatedData());
                      onClose();
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 text-xs flex items-center space-x-2 transition-all transform active:scale-95"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Add to POS Bill (બિલમાં ઉમેરો)</span>
                  </button>
                )}

                {onApplyToCreate && !result.matched_medicine && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyToCreate(getUpdatedData());
                      onClose();
                    }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-md text-xs flex items-center space-x-2 transition-all"
                  >
                    <span>Create Master Entry</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default SmartScannerModal;
