import React from 'react';
import { Check } from 'lucide-react';

interface Props {
  status: 'verifying' | 'success';
  otpDigits: string[];
}

export default function OtpVerificationAnimation({ status, otpDigits }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-6 w-full min-h-[220px]">
      {status === 'verifying' && (
        <div className="relative flex flex-col items-center">
          <div className="relative w-24 h-24 flex items-center justify-center mb-6">
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-full border-4 border-pharmacy-100 opacity-50"></div>
            <div className="absolute inset-0 rounded-full border-4 border-pharmacy-500 border-t-transparent animate-spin"></div>
            
            {/* Center pulsing icon or text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-pharmacy-50 rounded-full flex items-center justify-center animate-pulse shadow-inner">
                <span className="text-xl font-bold text-pharmacy-600 tracking-widest">{otpDigits.slice(0, 2).join('')}</span>
              </div>
            </div>
            
            {/* Small floating digits in orbit */}
            {otpDigits.map((digit, i) => (
              <div 
                key={i}
                className="absolute w-6 h-8 bg-white border border-slate-200 rounded shadow-md flex items-center justify-center text-xs font-bold text-slate-700"
                style={{
                  top: '50%', left: '50%',
                  marginTop: '-16px', marginLeft: '-12px',
                  animation: `orbit 3s linear infinite`,
                  animationDelay: `${-(i * 0.5)}s`
                }}
              >
                {digit}
              </div>
            ))}
          </div>
          <span className="text-sm font-bold text-pharmacy-600 animate-pulse tracking-wide uppercase">Verifying OTP</span>
        </div>
      )}

      {status === 'success' && (
        <div className="relative flex flex-col items-center animate-in zoom-in duration-300">
          <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping" style={{ animationDuration: '1.5s' }}></div>
            <div className="relative z-10 w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 transform transition-transform hover:scale-105">
              <Check size={40} className="text-white" strokeWidth={3} />
            </div>
            
            {/* Particles Confetti */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-emerald-400"
                  style={{
                    top: '50%', left: '50%',
                    transform: `translate(-50%, -50%)`,
                    animation: `particle${i} 0.8s ease-out forwards`
                  }}
                />
              ))}
            </div>
          </div>
          <span className="text-sm font-bold text-emerald-600 tracking-wide uppercase">Verification Successful</span>
        </div>
      )}

      <style>{`
        @keyframes orbit {
          0% { transform: rotate(0deg) translateY(-55px) rotate(0deg); }
          100% { transform: rotate(360deg) translateY(-55px) rotate(-360deg); }
        }
        ${[...Array(6)].map((_, i) => `
          @keyframes particle${i} {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            100% { 
              transform: translate(calc(-50% + ${Math.cos(i * Math.PI / 3) * 65}px), calc(-50% + ${Math.sin(i * Math.PI / 3) * 65}px)) scale(0); 
              opacity: 0; 
            }
          }
        `).join('\n')}
      `}</style>
    </div>
  );
}
