import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { Bill } from '../../types/billing';

interface Props {
  bills?: Bill[];
}

export default function RecentOrdersTable({ bills = [] }: Props) {
  // Take top 4 most recent bills
  const displayBills = bills.slice(0, 4);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Recent Orders</h3>
        <Link to="/orders" className="text-sm font-medium text-pharmacy-600 hover:text-pharmacy-700">
          View all orders
        </Link>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order ID</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
              <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {displayBills.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{order.billNumber}</td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600 truncate max-w-[150px]">{order.customerName}</td>
                <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-900">₹{Number(order.total).toFixed(2)}</td>
                <td className="px-5 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500">
                  {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link to="/orders" className="text-pharmacy-600 hover:text-pharmacy-900">Review</Link>
                </td>
              </tr>
            ))}
            {displayBills.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">
                  No recent orders. You're all caught up!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
