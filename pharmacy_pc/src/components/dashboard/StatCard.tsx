import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subText?: string;
  icon: LucideIcon;
  trendUp?: boolean;
  colorClass: string;
  bgClass: string;
}

export default function StatCard({ label, value, subText, icon: Icon, trendUp, colorClass, bgClass }: StatCardProps) {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 group">
      <div className={`absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full opacity-20 transition-transform group-hover:scale-150 duration-500 ease-out ${bgClass}`} />
      
      <div className="relative flex justify-between items-start z-10">
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="mt-3 text-3xl font-black text-slate-800 tracking-tight">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${bgClass} shadow-sm border border-white/50 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`h-6 w-6 ${colorClass}`} />
        </div>
      </div>
      
      {subText && (
        <div className="mt-4 flex items-center text-sm relative z-10">
          <span className={`font-semibold px-2 py-0.5 rounded-md ${trendUp === true ? 'bg-emerald-50 text-emerald-600' : trendUp === false ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}`}>
            {subText}
          </span>
        </div>
      )}
    </div>
  );
}
