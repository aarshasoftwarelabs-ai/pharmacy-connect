export default function StatusBadge({ status }: { status: string }) {
  const getColors = () => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'preparing': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ready': return 'bg-pharmacy-100 text-pharmacy-700 border-pharmacy-200';
      case 'completed': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'low stock': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColors()}`}>
      {status}
    </span>
  );
}
