export default function MedicineStatusBadge({ status }: { status: string }) {
  const isActive = status === 'Active';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
      isActive 
        ? 'bg-green-50 text-green-700 border-green-200' 
        : 'bg-slate-100 text-slate-700 border-slate-200'
    }`}>
      {status}
    </span>
  );
}
