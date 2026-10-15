import React, { useEffect } from 'react';
import { Bell, Volume2, VolumeX, ArrowRight, X, FileText, Pill } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AudioAlert } from '../../utils/audioAlertService';

export interface RingAlertData {
  id?: number | string;
  title: string;
  message: string;
  type: 'REQUEST' | 'PRESCRIPTION' | 'ORDER';
  customerName?: string;
  medicineName?: string;
  timestamp: Date;
}

interface Props {
  alert: RingAlertData | null;
  onDismiss: () => void;
}

export default function NewOrderRingModal({ alert, onDismiss }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (alert) {
      AudioAlert.startOrderRing();
    } else {
      AudioAlert.stopOrderRing();
    }

    return () => {
      AudioAlert.stopOrderRing();
    };
  }, [alert]);

  if (!alert) return null;

  const handleAccept = () => {
    AudioAlert.stopOrderRing();
    onDismiss();
    if (alert.type === 'PRESCRIPTION') {
      navigate('/prescriptions');
    } else {
      navigate('/orders');
    }
  };

  const handleMute = () => {
    AudioAlert.stopOrderRing();
    onDismiss();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-6 px-4">
        {/* Backdrop flash / pulse effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="fixed inset-0 bg-red-600/20 backdrop-blur-[2px] pointer-events-auto"
          onClick={handleMute}
        />

        {/* Floating Ringing Card */}
        <motion.div
          initial={{ scale: 0.85, y: -40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: -20, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="pointer-events-auto relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-red-500 overflow-hidden ring-4 ring-red-500/20"
        >
          {/* Top animated header bar */}
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-600 p-4 text-white flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Bell className="w-6 h-6 animate-bounce text-white" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest font-black text-red-200">
                  🔔 Incoming Mobile Notification
                </span>
                <h3 className="text-lg font-black tracking-tight">{alert.title}</h3>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-white text-red-700 shadow-sm animate-pulse">
                RINGING
              </span>
              <button
                onClick={handleMute}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
                title="Silence Ring"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 bg-gradient-to-b from-red-50/50 to-white">
            <div className="flex items-start space-x-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0 shadow-sm">
                {alert.type === 'PRESCRIPTION' ? (
                  <FileText className="w-6 h-6" />
                ) : (
                  <Pill className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-slate-800 leading-snug">
                  {alert.message}
                </p>
                {alert.customerName && (
                  <p className="text-sm font-semibold text-slate-600 mt-1">
                    Customer: <span className="text-slate-900 font-bold">{alert.customerName}</span>
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-ping"></span>
                  Received just now ({new Date(alert.timestamp).toLocaleTimeString()})
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleMute}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold text-slate-700 transition-colors shadow-sm text-sm"
              >
                <VolumeX className="w-4 h-4 mr-2 text-slate-500" />
                Silence / Stop Bell
              </button>

              <button
                onClick={handleAccept}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 font-bold text-white transition-all shadow-md shadow-red-500/25 hover:shadow-lg text-sm group"
              >
                Open & Review
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
