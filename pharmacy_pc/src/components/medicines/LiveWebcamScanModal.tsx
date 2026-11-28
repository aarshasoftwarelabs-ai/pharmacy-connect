import { useEffect, useRef, useState } from 'react';
import { X, Video, Loader2, CheckCircle2, ScanLine } from 'lucide-react';
import { scanMedicineBox, ScannedMedicineBoxData } from '../../services/medicineService';
import AudioAlert from '../../utils/audioAlertService';

interface LiveWebcamScanModalProps {
  onDetected: (data: ScannedMedicineBoxData) => void;
  onClose: () => void;
}

export default function LiveWebcamScanModal({ onDetected, onClose }: LiveWebcamScanModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isScanningRef = useRef(false);
  const lockedRef = useRef(false);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanningFrame, setIsScanningFrame] = useState(false);
  const [statusText, setStatusText] = useState('Starting live camera...');
  const [detected, setDetected] = useState<ScannedMedicineBoxData | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const mergeScannedData = (
    incoming: ScannedMedicineBoxData,
    existing: ScannedMedicineBoxData | null
  ): ScannedMedicineBoxData => {
    if (!existing) return incoming;
    return {
      medicine_name: incoming.medicine_name || existing.medicine_name,
      generic_name: incoming.generic_name || existing.generic_name,
      strength: incoming.strength || existing.strength,
      manufacturer: incoming.manufacturer || existing.manufacturer,
      pack_size: incoming.pack_size || existing.pack_size,
      batch_number: incoming.batch_number || existing.batch_number,
      mfg_date: incoming.mfg_date || existing.mfg_date,
      expiry_date: incoming.expiry_date || existing.expiry_date,
      raw_expiry: incoming.raw_expiry || existing.raw_expiry,
      mrp: incoming.mrp && incoming.mrp > 0 ? incoming.mrp : existing.mrp,
      matched_medicine: incoming.matched_medicine || existing.matched_medicine,
      confidence: incoming.confidence || existing.confidence,
    };
  };

  const captureAndScanFrame = async () => {
    if (lockedRef.current || isScanningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) return;

    isScanningRef.current = true;
    setIsScanningFrame(true);
    setStatusText('Reading medicine box live...');

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/jpeg', 0.88)
      );
      if (!blob || lockedRef.current) return;

      const frameFile = new File([blob], 'live_frame.jpg', { type: 'image/jpeg' });
      const res = await scanMedicineBox(frameFile);
      if (lockedRef.current) return;

      const hasAny = Boolean(
        res.medicine_name ||
        res.batch_number ||
        res.mfg_date ||
        res.expiry_date ||
        (res.mrp && res.mrp > 0)
      );

      if (hasAny) {
        setDetected(prev => {
          const merged = mergeScannedData(res, prev);
          const completeLock = Boolean(
            (merged.batch_number && (merged.expiry_date || (merged.mrp && merged.mrp > 0))) ||
            (merged.medicine_name && merged.expiry_date && merged.mrp && merged.mrp > 0)
          );
          if (completeLock && !lockedRef.current) {
            lockedRef.current = true;
            AudioAlert.playBarcodeBeep();
            setStatusText('Locked! Filling medicine details...');
            stopCamera();
            setTimeout(() => onDetected(merged), 300);
          } else {
            setStatusText('Detected partial text — keep holding steady or click Use Data');
          }
          return merged;
        });
      } else {
        setStatusText('Point box/strip clearly at camera — auto-scanning...');
      }
    } catch {
      setStatusText('Auto-scanning... keep medicine label steady in frame');
    } finally {
      isScanningRef.current = false;
      setIsScanningFrame(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let intervalId: number | null = null;

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError('Live camera is not supported on this browser/device.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatusText('Point box/strip at camera — live auto-scan active');
        intervalId = window.setInterval(captureAndScanFrame, 2000);
      } catch {
        if (mounted) {
          setCameraError('Could not access camera. Please allow webcam permission in browser/Windows settings.');
        }
      }
    };

    start();

    return () => {
      mounted = false;
      if (intervalId !== null) clearInterval(intervalId);
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Video className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="font-bold text-sm">Live Medicine Box Scanner</h4>
              <p className="text-[11px] text-slate-300">Auto-reads Batch No., Mfg, Expiry &amp; MRP without image upload</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-white space-y-2">
              <p className="text-sm font-semibold text-red-300">{cameraError}</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
              <div className="pointer-events-none absolute inset-6 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-4 space-y-3 bg-slate-50">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-2">
              {isScanningFrame ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <ScanLine className="w-4 h-4 text-emerald-600" />
              )}
              {statusText}
            </span>
          </div>

          {detected && (
            <div className="flex flex-wrap gap-1.5">
              {detected.medicine_name && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  Name: {detected.medicine_name}
                </span>
              )}
              {detected.batch_number && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  Batch: {detected.batch_number}
                </span>
              )}
              {detected.mfg_date && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  Mfg: {detected.mfg_date}
                </span>
              )}
              {(detected.raw_expiry || detected.expiry_date) && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  Exp: {detected.raw_expiry || detected.expiry_date?.split('T')[0]}
                </span>
              )}
              {detected.mrp && detected.mrp > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  MRP: ₹{Number(detected.mrp).toFixed(2)}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            {!cameraError && (
              <button
                type="button"
                disabled={isScanningFrame}
                onClick={captureAndScanFrame}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Scan Frame Now
              </button>
            )}
            {detected && (
              <button
                type="button"
                onClick={() => {
                  lockedRef.current = true;
                  stopCamera();
                  onDetected(detected);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                <CheckCircle2 className="w-4 h-4" />
                Use Scanned Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
