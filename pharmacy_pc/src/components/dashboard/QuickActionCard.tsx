import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickActionProps {
  label: string;
  icon: LucideIcon;
  href: string;
  colorClass: string;
  bgClass: string;
}

export default function QuickActionCard({ label, icon: Icon, href, colorClass, bgClass }: QuickActionProps) {
  return (
    <Link 
      to={href}
      className="flex items-center p-4 bg-white border border-slate-200 rounded-xl hover:border-pharmacy-300 hover:shadow-sm transition-all group"
    >
      <div className={`p-2.5 rounded-lg ${bgClass} group-hover:scale-105 transition-transform`}>
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </div>
      <span className="ml-4 font-medium text-slate-700 group-hover:text-pharmacy-700">{label}</span>
    </Link>
  );
}
