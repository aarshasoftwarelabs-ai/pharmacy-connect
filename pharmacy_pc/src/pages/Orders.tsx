import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Printer, 
  AlertCircle, 
  Loader2, 
  MessageCircle, 
  Receipt,
  Store,
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  ShoppingBag
} from 'lucide-react';
import { BillingService } from '../services/billingService';
import { Bill } from '../types/billing';
import { getPharmacyId } from '../config/development';
import { printBill } from '../utils/printUtils';
import { sendWhatsAppBill } from '../utils/whatsappUtils';

type FilterTab = 'ALL' | 'PICKUP' | 'PAID' | 'PENDING';

export default function Orders() {
  const [orders, setOrders] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await BillingService.getPharmacyBills(getPharmacyId());
      setOrders(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Stats
  const stats = useMemo(() => {
    let paidCount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;

    orders.forEach(o => {
      if (o.paymentStatus === 'PAID') {
        paidCount++;
      } else {
        pendingCount++;
        pendingAmount += Number(o.total || 0);
      }
    });

    return {
      total: orders.length,
      pickupCount: orders.length,
      paidCount,
      pendingCount,
      pendingAmount
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Tab filter
      if (activeTab === 'PAID' && order.paymentStatus !== 'PAID') {
        return false;
      }
      if (activeTab === 'PENDING' && order.paymentStatus === 'PAID') {
        return false;
      }

      // Search filter
      const matchesSearch = 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        order.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerPhone && order.customerPhone.includes(searchTerm));

      return matchesSearch;
    });
  }, [orders, searchTerm, activeTab]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pharmacy-600 to-blue-600 tracking-tight flex items-center w-fit">
            <Package className="w-8 h-8 mr-3 text-pharmacy-600" />
            Orders Management (Pickup at Medical Shop)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View, search, and manage all customer orders and bills for direct pickup at the medical store.
          </p>
        </div>
      </div>

      {/* Insight Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
            <h3 className="text-xl font-black text-slate-800">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pickup at Medical Shop</p>
            <h3 className="text-xl font-black text-indigo-600">{stats.pickupCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Paid Bills</p>
            <h3 className="text-xl font-black text-emerald-600">{stats.paidCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Due</p>
            <h3 className="text-xl font-black text-amber-600">
              ₹{stats.pendingAmount.toFixed(0)} <span className="text-xs font-semibold text-slate-400">({stats.pendingCount})</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Tabs & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Filter Pills */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {[
            { key: 'ALL', label: 'All Orders' },
            { key: 'PICKUP', label: 'Pickup at Medical Shop 🏪' },
            { key: 'PAID', label: 'Paid Bills' },
            { key: 'PENDING', label: 'Payment Due' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as FilterTab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search Order ID, Customer Name, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mb-4" />
            <p className="text-slate-500 font-medium text-xs">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Failed to load orders</h3>
            <p className="text-xs text-slate-500">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
            <Package className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-base font-bold text-slate-900 mb-1">No orders found</h3>
            <p className="text-xs text-slate-500">
              {searchTerm ? "No orders match your search criteria." : "No orders found in this view."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Order ID</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Fulfillment</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Payment Status</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th scope="col" className="px-5 py-3.5 text-right text-[11px] font-black text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Order ID */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-xs font-black text-indigo-600 block">{order.billNumber}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{order.billType || 'RETAIL'}</span>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-900">{order.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">📞 {order.customerPhone || 'N/A'}</div>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-xs font-black text-slate-900">₹{order.total}</div>
                    </td>

                    {/* Fulfillment: Pickup at Medical Shop */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex items-center text-[11px] font-black rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Store className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                        Pickup at Medical Shop
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-[10px] font-black rounded-full ${
                        order.paymentStatus === 'PAID' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right text-xs font-medium">
                      <div className="flex justify-end items-center space-x-1.5">
                        {/* Print Thermal POS Receipt */}
                        <button 
                          onClick={() => printBill(order, 'THERMAL')}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
                          title="Thermal POS Receipt (58mm/80mm)"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>

                        {/* Print A4 Invoice */}
                        <button 
                          onClick={() => printBill(order, 'A4')}
                          className="p-1.5 text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                          title="Print A4 Tax Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* WhatsApp Bill Share */}
                        <button 
                          onClick={() => sendWhatsAppBill(order, order.customerPhone)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
                          title="Share Bill via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
