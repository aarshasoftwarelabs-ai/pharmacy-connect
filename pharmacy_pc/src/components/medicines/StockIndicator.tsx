interface StockIndicatorProps {
  currentStock: number;
  minimumStock: number;
}

export default function StockIndicator({ currentStock, minimumStock }: StockIndicatorProps) {
  let statusStr = '';
  let colorClass = '';

  if (currentStock === 0) {
    statusStr = 'Out of Stock';
    colorClass = 'text-red-600 bg-red-50 border-red-200';
  } else if (currentStock <= minimumStock) {
    statusStr = 'Low Stock';
    colorClass = 'text-orange-600 bg-orange-50 border-orange-200';
  } else {
    statusStr = 'Healthy';
    colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  }

  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-slate-900">{currentStock}</span>
      <span className={`inline-flex items-center justify-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium border w-max ${colorClass}`}>
        {statusStr}
      </span>
    </div>
  );
}
