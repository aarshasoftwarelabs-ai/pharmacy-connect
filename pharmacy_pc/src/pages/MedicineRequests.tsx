import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Inbox, Clock, CheckCircle, Package, XCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import MedicineRequestFilters from '../components/medicineRequests/MedicineRequestFilters';
import MedicineRequestTable from '../components/medicineRequests/MedicineRequestTable';
import MedicineRequestDetails from '../components/medicineRequests/MedicineRequestDetails';
import { MedicineRequest, MedicineRequestStatus } from '../types/medicineRequest';
import { MedicineRequestService } from '../services/medicineRequestService';
import { DEV_PHARMACY_ID } from '../config/development';
import { io } from 'socket.io-client';

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
    return DEV_PHARMACY_ID;
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
        // Just show a small alert or ignore to keep old data visible
        console.error('Background refresh failed:', err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Connect to Socket.io for real-time live orders
    const socket = io('http://localhost:3000');
    
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

  // Derived stats
  const stats = useMemo(() => {
    return {
      newRequests: requests.filter(r => new Date(r.requestedAt).toDateString() === new Date().toDateString()).length,
      waiting: requests.filter(r => r.status === 'WAITING').length,
      available: requests.filter(r => r.status === 'AVAILABLE').length,
      canArrange: requests.filter(r => r.status === 'CAN_ARRANGE').length,
      notAvailable: requests.filter(r => r.status === 'NOT_AVAILABLE').length,
    };
  }, [requests]);

  // Filtered requests
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
      
      // Update UI with response from backend
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
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Medicine Requests</h1>
          <p className="mt-1 text-sm text-slate-500">Review customer medicine requests and respond to availability.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Last updated: {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchRequests(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          label="New Today" 
          value={stats.newRequests.toString()} 
          icon={Inbox} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50" 
        />
        <StatCard 
          label="Waiting" 
          value={stats.waiting.toString()} 
          icon={Clock} 
          colorClass="text-yellow-600" 
          bgClass="bg-yellow-50" 
        />
        <StatCard 
          label="Available" 
          value={stats.available.toString()} 
          icon={CheckCircle} 
          colorClass="text-green-600" 
          bgClass="bg-green-50" 
        />
        <StatCard 
          label="Can Arrange" 
          value={stats.canArrange.toString()} 
          icon={Package} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <StatCard 
          label="Not Available" 
          value={stats.notAvailable.toString()} 
          icon={XCircle} 
          colorClass="text-red-600" 
          bgClass="bg-red-50" 
        />
      </div>

      {/* Filters */}
      <MedicineRequestFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onClear={handleClearFilters}
      />

      {/* Content Area (Loading, Error, Empty, or Table) */}
      <div className="bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 rounded-2xl overflow-hidden min-h-[400px] flex flex-col relative">
        {refreshing && !loading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-100 overflow-hidden z-10">
            <div className="h-full bg-indigo-500 animate-[pulse_1.5s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
          </div>
        )}
        
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Loading requests...</h3>
            <p className="text-sm text-slate-500 text-center mt-1">Connecting to PharmacyConnect backend</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Error Loading Requests</h3>
            <p className="text-sm text-slate-500 text-center mt-1 mb-4">{error}</p>
            <button 
              onClick={() => fetchRequests(false)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <Inbox className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No medicine requests found</h3>
            <p className="text-sm text-slate-500 text-center mt-1 max-w-sm">
              New customer medicine requests will appear here. You currently have no requests from the system.
            </p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <AlertCircle className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No requests match your search</h3>
            <button 
              onClick={handleClearFilters}
              className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors"
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
      </div>

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
