import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, IndianRupee, Clock, PlusCircle, Search, FileText, Inbox, Eye, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/dashboard/StatCard';
import RecentOrdersTable from '../components/dashboard/RecentOrdersTable';
import QuickActionCard from '../components/dashboard/QuickActionCard';
import OrderOverview from '../components/dashboard/OrderOverview';

import { MedicineRequest } from '../types/medicineRequest';
import { MedicineRequestService } from '../services/medicineRequestService';
import { BillingService } from '../services/billingService';
import { Bill } from '../types/billing';
import { getPharmacyId } from '../config/development';

export default function Dashboard() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardRequests = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) setLoading(true);
      else setRefreshing(true);

      const pharmacyId = getPharmacyId();
      const [reqData, billsData] = await Promise.all([
        MedicineRequestService.getPharmacyRequests(pharmacyId),
        BillingService.getPharmacyBills(pharmacyId)
      ]);
      setRequests(reqData);
      setBills(billsData);
      if (!isBackgroundRefresh) setError(null);
    } catch (err: any) {
      if (!isBackgroundRefresh) {
        setError(err.message || 'Unable to load recent requests');
      } else {
        console.error('Background refresh failed:', err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardRequests();

    const intervalId = setInterval(() => {
      fetchDashboardRequests(true);
    }, 15000);

    return () => clearInterval(intervalId);
  }, []);

  // Compute request stats
  const newRequestsCount = requests.filter(r => new Date(r.requestedAt).toDateString() === new Date().toDateString()).length;
  const waitingRequestsCount = requests.filter(r => r.status === 'WAITING').length;
  const recentRequests = [...requests].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()).slice(0, 5);

  const todaysBills = bills.filter(b => new Date(b.createdAt).toDateString() === new Date().toDateString());
  const todaysSalesValue = todaysBills.reduce((sum, b) => sum + Number(b.total), 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Greeting Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Good morning, Pharmacy Owner</h1>
          <p className="mt-1 text-sm text-slate-500">Here's what's happening at your pharmacy today.</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-600">
            <Clock className="mr-2 h-4 w-4 text-pharmacy-500" />
            {today}
          </div>
          <div
            className="inline-flex items-center px-4 py-1.5 border shadow-sm text-sm font-semibold rounded-full border-emerald-200 text-emerald-700 bg-emerald-50 cursor-default"
          >
            <div className="mr-2 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            Auto-Refresh: ON
            {refreshing && <RefreshCw className="ml-2 h-3.5 w-3.5 animate-spin text-emerald-600" />}
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard 
          label="New Medicine Requests" 
          value={loading ? "..." : newRequestsCount.toString()} 
          subText="Received today" 
          icon={Inbox} 
          trendUp={true}
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50" 
        />
        <StatCard 
          label="Waiting Responses" 
          value={loading ? "..." : waitingRequestsCount.toString()} 
          subText="Needs action" 
          icon={Clock} 
          colorClass="text-yellow-600" 
          bgClass="bg-yellow-50" 
        />
        <StatCard 
          label="Today's Orders" 
          value={loading ? "..." : todaysBills.length.toString()} 
          subText="Bills generated today" 
          icon={ShoppingCart} 
          trendUp={true}
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <StatCard 
          label="Today's Sales" 
          value={loading ? "..." : `₹${todaysSalesValue.toFixed(2)}`} 
          subText="Revenue today" 
          icon={IndianRupee}
          trendUp={true} 
          colorClass="text-pharmacy-600" 
          bgClass="bg-pharmacy-50" 
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Takes up 2/3 space on large screens */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Medicine Requests */}
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden min-h-[300px] flex flex-col relative">
            {refreshing && !loading && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-100 overflow-hidden z-10">
                <div className="h-full bg-indigo-500 animate-[pulse_1.5s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
              </div>
            )}
            
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                <Inbox className="h-5 w-5 text-indigo-500 mr-2" />
                Recent Medicine Requests
              </h2>
              <Link to="/medicine-requests" className="text-sm font-medium text-pharmacy-600 hover:text-pharmacy-800">
                View All Requests &rarr;
              </Link>
            </div>
            
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mb-2" />
                <p className="text-sm text-slate-500">Loading requests...</p>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center px-4">
                <AlertCircle className="h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">{error}</p>
                <button 
                  onClick={() => fetchDashboardRequests(false)}
                  className="mt-4 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-200"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Medicine</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {recentRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                          {req.medicineName || 'Image Request'}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500">
                          {req.customerName}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500">
                          {new Date(req.requestedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            req.status === 'WAITING' ? 'bg-yellow-100 text-yellow-800' :
                            req.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                            req.status === 'CAN_ARRANGE' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <Link to="/medicine-requests" className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end">
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {recentRequests.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          No recent requests.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionCard label="View Requests" icon={Inbox} href="/medicine-requests" colorClass="text-indigo-600" bgClass="bg-indigo-50" />
            <QuickActionCard label="View Orders" icon={Search} href="/orders" colorClass="text-blue-600" bgClass="bg-blue-50" />
            <QuickActionCard label="Create Bill" icon={FileText} href="/billing" colorClass="text-orange-600" bgClass="bg-orange-50" />
            <QuickActionCard label="Dashboard" icon={PlusCircle} href="/dashboard" colorClass="text-green-600" bgClass="bg-green-50" />
          </div>

          {/* Recent Orders Table */}
          <div className="min-h-[300px]">
            <RecentOrdersTable bills={bills} />
          </div>
        </div>
        
        {/* Right Column - Takes up 1/3 space on large screens */}
        <div className="space-y-6 flex flex-col">
          {/* Order Overview Pipeline -> Activity Overview */}
          <div className="min-h-[350px]">
             <OrderOverview requests={requests} bills={bills} />
          </div>

          {/* Quick Info Block to fill white space */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex-1">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-indigo-500" /> Action Items
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">You have {waitingRequestsCount} requests waiting for response.</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">{requests.filter(r => r.customerConfirmation === 'CONFIRMED').length} requests are confirmed and waiting for bills.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
