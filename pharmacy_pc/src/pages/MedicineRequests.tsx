import React, { useState, useEffect, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { Inbox, Clock, CheckCircle, Package, XCircle, Loader2, AlertCircle, RefreshCw, ActivitySquare } from 'lucide-react';
import MedicineRequestFilters from '../components/medicineRequests/MedicineRequestFilters';
import MedicineRequestTable from '../components/medicineRequests/MedicineRequestTable';
import MedicineRequestDetails from '../components/medicineRequests/MedicineRequestDetails';
import { MedicineRequest, MedicineRequestStatus } from '../types/medicineRequest';
import { MedicineRequestService } from '../services/medicineRequestService';
import { getPharmacyId } from '../config/development';
import { io } from 'socket.io-client';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  }
};

const AnimatedNumber = ({ value }: { value: number }) => {
  return <span>{value.toLocaleString('en-IN')}</span>;
};

export default function MedicineRequests() {
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState<MedicineRequest | null>(null);

  const getActualPharmacyId = () => {
    try {
      const localData = localStorage.getItem('pharmacy_profile_data');
      if (localData) {
        const profile = JSON.parse(localData);
        if (profile.id) return profile.id;
      }
    } catch (e) {}
    return getPharmacyId();
  };

  const fetchRequests = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) setLoading(true);
      else setRefreshing(true);
      
      const pharmacyId = getActualPharmacyId();
      const data = await MedicineRequestService.getPharmacyRequests(pharmacyId);
      setRequests(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      if (!isBackgroundRefresh) {
        setError(err.message || 'Unable to load medicine requests.');
      } else {
        console.error('Background refresh failed:', err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'https://api.davasetu.com';
    const socket = io(socketUrl);
    
    socket.on('connect', () => {
      console.log('Connected to live orders socket');
      const pharmacyId = getActualPharmacyId();
      socket.emit('join_pharmacy', pharmacyId.toString());
    });

    socket.on('new_request', (newReq: MedicineRequest) => {
      console.log('Received new live order!', newReq);
      setRequests(prev => [newReq, ...prev]);
      setLastUpdated(new Date());
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const stats = useMemo(() => {
    return {
      newRequests: requests.filter(r => new Date(r.requestedAt).toDateString() === new Date().toDateString()).length,
      waiting: requests.filter(r => r.status === 'WAITING').length,
      available: requests.filter(r => r.status === 'AVAILABLE').length,
      canArrange: requests.filter(r => r.status === 'CAN_ARRANGE').length,
      notAvailable: requests.filter(r => r.status === 'NOT_AVAILABLE').length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = 
        (request.medicineName && request.medicineName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        request.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.customerPhone.includes(searchQuery);
      
      const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [requests, searchQuery, statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: MedicineRequestStatus, message?: string) => {
    try {
      const updatedRequest = await MedicineRequestService.updateStatus(id, newStatus, message);
      setRequests(prev => prev.map(req => {
        if (req.id === id) {
          if (selectedRequest?.id === id) {
            setSelectedRequest(updatedRequest);
          }
          return updatedRequest;
        }
        return req;
      }));
    } catch (err: any) {
      alert(err.message || 'Unable to update request. Please try again.');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-16 space-y-6 px-4 xl:px-8 pt-4">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pharmacy-600 to-blue-600 tracking-tight flex items-center w-fit">
            Medicine Requests
            {refreshing && <RefreshCw className="w-4 h-4 ml-3 text-indigo-500 animate-spin" />}
          </h1>
          <p className="text-slate-500 font-medium flex items-center mt-1">
            Review customer medicine requests and respond to availability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Updated: {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchRequests(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm rounded-xl text-sm font-semibold text-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6">
          <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 flex justify-between items-start mb-3">
              <div className="p-2.5 bg-indigo-100/50 text-indigo-600 rounded-2xl">
                <Inbox className="w-5 h-5" />
              </div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">New Today</p>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight"><AnimatedNumber value={stats.newRequests} /></h2>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 flex justify-between items-start mb-3">
              <div className="p-2.5 bg-amber-100/50 text-amber-600 rounded-2xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Waiting</p>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight"><AnimatedNumber value={stats.waiting} /></h2>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 flex justify-between items-start mb-3">
              <div className="p-2.5 bg-emerald-100/50 text-emerald-600 rounded-2xl">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Available</p>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight"><AnimatedNumber value={stats.available} /></h2>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 flex justify-between items-start mb-3">
              <div className="p-2.5 bg-blue-100/50 text-blue-600 rounded-2xl">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Can Arrange</p>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight"><AnimatedNumber value={stats.canArrange} /></h2>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 flex justify-between items-start mb-3">
              <div className="p-2.5 bg-rose-100/50 text-rose-600 rounded-2xl">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Not Available</p>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight"><AnimatedNumber value={stats.notAvailable} /></h2>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <MedicineRequestFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onClear={handleClearFilters}
          />
        </motion.div>

        {/* Content Area */}
        <motion.div variants={itemVariants} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden min-h-[400px] flex flex-col relative transition-all">
          {refreshing && !loading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-100 overflow-hidden z-10">
              <div className="h-full bg-indigo-500 animate-[pulse_1.5s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
            </div>
          )}
          
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-16">
              <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-slate-800">Loading requests...</h3>
              <p className="text-sm font-medium text-slate-500 text-center mt-1">Connecting to PharmacyConnect backend</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-16">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Error Loading Requests</h3>
              <p className="text-sm font-medium text-slate-500 text-center mt-1 mb-6 max-w-sm">{error}</p>
              <button 
                onClick={() => fetchRequests(false)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-colors"
              >
                Retry Connection
              </button>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-16">
              <div className="h-24 w-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center mb-6">
                <Inbox className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">No medicine requests found</h3>
              <p className="text-sm font-medium text-slate-500 text-center mt-2 max-w-sm">
                New customer medicine requests will appear here. You currently have no requests.
              </p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-16">
              <div className="h-24 w-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center mb-6">
                <AlertCircle className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">No requests match your search</h3>
              <button 
                onClick={handleClearFilters}
                className="mt-6 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <MedicineRequestTable 
              requests={filteredRequests}
              onView={setSelectedRequest}
            />
          )}
        </motion.div>
      </motion.div>

      {/* Modal Details */}
      {selectedRequest && (
        <MedicineRequestDetails 
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}

