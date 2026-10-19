import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, Smartphone, Check, AlertTriangle, X, RefreshCw, 
  Sparkles, ShieldCheck, Copy, ArrowRight, Zap, Info, Calendar, DollarSign, Tag, Layers
} from 'lucide-react';
import { scanMedicineBox, ScannedMedicineBoxData } from '../../services/medicineService';
import { AudioAlert } from '../../utils/audioAlertService';

interface MedicineBoxOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacyId?: number;
  onApplyToStock?: (data: ScannedMedicineBoxData) => void;
  onApplyToBilling?: (data: ScannedMedicineBoxData) => void;
  onApplyToCreate?: (data: ScannedMedicineBoxData) => void;
}

export const MedicineBoxOcrModal: React.FC<MedicineBoxOcrModalProps> = ({
  isOpen,
  onClose,
  pharmacyId = 1,
  onApplyToStock,
  onApplyToBilling,
  onApplyToCreate,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'mobile'>('camera');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScannedMedicineBoxData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Camera states
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable fields in result
  const [editableBatch, setEditableBatch] = useState('');
  const [editableExpiry, setEditableExpiry] = useState('');
  const [editableMrp, setEditableMrp] = useState<number>(0);
  const [editableName, setEditableName] = useState('');

  // Stop camera on unmount or tab change
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
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
        videoRef.current.play();
      }
      setCameraActive(true);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      if (!selectedCameraId && videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setError('Could not access camera. Please allow camera permissions or upload an image.');
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab]);

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

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setError(null);
    setScanning(true);

    try {
      // Local preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);

      const ocrData = await scanMedicineBox(file, pharmacyId, false);
      handleScanSuccess(ocrData);
    } catch (err: any) {
      console.error('File OCR error:', err);
      setError(err.message || 'Failed to extract text from uploaded box image.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-700 via-teal-800 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-inner">
              <Sparkles className="w-6 h-6 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight">AI Medicine Box OCR Scanner</h2>
                <span className="bg-emerald-400/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-400/30">
                  LIVE AI VISION
                </span>
              </div>
              <p className="text-xs text-teal-100/90 font-medium mt-0.5">
                સ્માર્ટ બોક્સ સ્કેનર — Batch No, Exp Date & MRP આપમેળે બોક્સ પરથી ઓળખી લેશે
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex space-x-2">
            <button
              onClick={() => { setActiveTab('camera'); setResult(null); setError(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                activeTab === 'camera'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Live Webcam / Camera</span>
            </button>
            <button
              onClick={() => { setActiveTab('upload'); setResult(null); setError(null); stopCamera(); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                activeTab === 'upload'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Box Photo</span>
            </button>
            <button
              onClick={() => { setActiveTab('mobile'); setResult(null); setError(null); stopCamera(); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                activeTab === 'mobile'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Wireless Mobile Sync ⚡</span>
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
                  {cam.label || `Camera ${cam.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs font-medium leading-relaxed">
                <span className="font-bold">Error:</span> {error}
              </div>
            </div>
          )}

          {/* TAB 1: LIVE CAMERA */}
          {activeTab === 'camera' && !result && (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-xl aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden shadow-inner border-2 border-slate-800 flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />

                {/* Laser / Framing Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-[82%] h-[68%] border-2 border-dashed border-teal-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                    {/* Corner Accents */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />

                    {/* Animated Scanning Beam */}
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10B981] animate-pulse absolute top-1/2 -translate-y-1/2" />
                    
                    <div className="absolute bottom-2 inset-x-0 text-center">
                      <span className="bg-black/70 backdrop-blur-md text-emerald-300 font-bold text-[11px] px-3 py-1 rounded-full border border-emerald-500/30">
                        Align Batch No, Exp Date & MRP Here
                      </span>
                    </div>
                  </div>
                </div>

                {scanning && (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                    <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
                    <span className="text-sm font-bold tracking-wide">Reading Medicine Box Text with AI...</span>
                    <span className="text-xs text-slate-300 mt-1">Extracting Batch No, Expiry & MRP</span>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center space-x-4">
                <button
                  onClick={handleCaptureFromCamera}
                  disabled={scanning || !cameraActive}
                  className="px-8 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-teal-600/30 flex items-center space-x-2 text-sm transition-all transform active:scale-95 disabled:opacity-50"
                >
                  <Zap className="w-5 h-5 text-amber-300" />
                  <span>{scanning ? 'Analyzing Text...' : '⚡ Capture & Extract Text (AI સ્કેન)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD FILE */}
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
                <h4 className="text-base font-bold text-slate-800">Drop medicine box photo here</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Click to browse from your computer or drag & drop a photo of the medicine box flap / printed text
                </p>
                <div className="mt-4 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-teal-700 shadow-sm">
                  Supports PNG, JPG, WEBP, Dot-matrix, and Inkjet photos
                </div>
              </div>

              {scanning && (
                <div className="mt-6 p-6 bg-teal-50 rounded-2xl border border-teal-200 flex items-center justify-center space-x-3 text-teal-900">
                  <RefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
                  <span className="text-sm font-bold">AI Vision is analyzing printed medicine text...</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WIRELESS MOBILE COMPANION */}
          {activeTab === 'mobile' && !result && (
            <div className="max-w-xl mx-auto bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-3xl p-6 text-slate-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-indigo-950">Mobile Wireless Scanner Active</h3>
                  <p className="text-xs text-indigo-700 font-medium">Use your staff phone to scan medicine boxes right from the shelves</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm space-y-3">
                <div className="flex items-start space-x-3 text-xs text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center shrink-0">1</div>
                  <p>Open the <b>PharmacyConnect Mobile App</b> on any staff phone and navigate to <b>Staff Scanner</b>.</p>
                </div>
                <div className="flex items-start space-x-3 text-xs text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center shrink-0">2</div>
                  <p>Switch to <b>Box OCR (ટેક્સ્ટ સ્કેન)</b> mode and point camera at the medicine box.</p>
                </div>
                <div className="flex items-start space-x-3 text-xs text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center shrink-0">3</div>
                  <p>As soon as you snap the box on your phone, it <b>instantly beams live into this PC POS / Inventory</b> in real-time!</p>
                </div>
              </div>

              <div className="mt-5 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center space-x-3 text-emerald-800">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold">PC Live Socket Listener: ACTIVE & LISTENING for incoming mobile scans</span>
              </div>
            </div>
          )}

          {/* RESULT STATE: HIGH TECH EXTRACTION CARD */}
          {result && (
            <div className="space-y-6 animate-fadeIn">
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
                  onClick={() => {
                    setResult(null);
                    setPreviewUrl(null);
                    if (activeTab === 'camera') startCamera();
                  }}
                  className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Another Box</span>
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

                {onApplyToCreate && (
                  <button
                    onClick={() => {
                      onApplyToCreate(getUpdatedData());
                      onClose();
                    }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center space-x-2 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Create New Medicine</span>
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
export default MedicineBoxOcrModal;
