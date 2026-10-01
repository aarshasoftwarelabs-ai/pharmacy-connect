import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Filter, MoreVertical, Phone, MapPin, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { MedicineRequestService } from '../services/medicineRequestService';
import { PharmacyService } from '../services/pharmacyService';
import { DEV_PHARMACY_ID } from '../config/development';

interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  requests: number;
  joined: string;
  status: 'Active' | 'New' | 'Inactive';
  location: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        // Fetch all requests and pharmacy profile to derive customer database
        const [requests, pharmacy] = await Promise.all([
          MedicineRequestService.getPharmacyRequests(DEV_PHARMACY_ID),
          PharmacyService.getPharmacyProfile(DEV_PHARMACY_ID).catch(() => null)
        ]);
        
        // Try to extract city from pharmacy address (assumes format: Street, Area, City, State Zip)
        const parts = pharmacy?.address?.split(',') || [];
        const pharmacyCity = parts.length > 2 ? parts[2].trim() : (pharmacy?.address || 'Local Area');
        
        // Group by phone number
        const customerMap = new Map<string, CustomerProfile>();
        
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        requests.forEach(req => {
          const phone = req.customerPhone || 'Unknown';
          
          if (!customerMap.has(phone)) {
            customerMap.set(phone, {
              id: phone,
              name: req.customerName,
              phone: phone,
              requests: 1,
              joined: req.requestedAt,
              status: 'Active',
              location: pharmacyCity // Dynamic fallback based on pharmacy location
            });
          } else {
            const cust = customerMap.get(phone)!;
            cust.requests += 1;
            if (new Date(req.requestedAt) < new Date(cust.joined)) {
              cust.joined = req.requestedAt;
            }
          }
        });

        // Determine status
        const profiles = Array.from(customerMap.values()).map(cust => {
          const joinedDate = new Date(cust.joined);
          if (joinedDate >= sevenDaysAgo) {
            cust.status = 'New';
          } else {
            cust.status = 'Active';
          }
          return cust;
        });

        // Sort by most recently joined
        profiles.sort((a, b) => new Date(b.joined).getTime() - new Date(a.joined).getTime());

        setCustomers(profiles);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load customers');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const name = customer.name || '';
      const phone = customer.phone || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            phone.includes(searchTerm);
      const matchesFilter = filter === 'All' || customer.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [customers, searchTerm, filter]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 pb-12 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight flex items-center">
            <Users className="w-8 h-8 mr-3 text-indigo-600" />
            Customers
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">Manage and view your pharmacy's customer base.</p>
        </motion.div>
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/60 px-4 py-2 shadow-sm flex items-center">
            <Users className="h-5 w-5 text-indigo-500 mr-2" />
            <span className="text-sm font-medium text-slate-700">Total: {customers.length}</span>
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white/60 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col sm:flex-row gap-4 justify-between"
      >
        <div className="relative flex-1 w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200/60 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-slate-400" />
          </div>
          <select
            className="block w-full sm:w-40 pl-11 pr-10 py-3 bg-white text-sm font-medium text-slate-700 border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm cursor-pointer appearance-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="New">New</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </motion.div>

      {/* Customer Table */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white shadow-sm border border-slate-200/60 rounded-3xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/60">
            <thead className="bg-slate-50/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total Requests
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Joined
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <motion.tbody 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="bg-white divide-y divide-slate-200/60"
            >
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Loading customers...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">{error}</p>
                  </td>
                </tr>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <motion.tr 
                    variants={itemVariants}
                    key={customer.id} 
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{customer.name}</div>
                          <div className="text-sm text-slate-500">{customer.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-900 mb-1">
                        <Phone className="h-3.5 w-3.5 text-slate-400 mr-2" />
                        {customer.phone}
                      </div>
                      <div className="flex items-center text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 mr-2" />
                        {customer.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{customer.requests}</div>
                      <div className="text-xs text-slate-500">Medicine Requests</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        customer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(customer.joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-slate-100">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <motion.tr variants={itemVariants}>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-slate-900">No customers found</h3>
                    <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters.</p>
                  </td>
                </motion.tr>
              )}
            </motion.tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
