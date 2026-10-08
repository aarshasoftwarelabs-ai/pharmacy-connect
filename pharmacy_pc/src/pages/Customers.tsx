import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Filter, MoreVertical, Phone, AlertCircle, Loader2, Calendar, DollarSign, Activity } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { CustomerService, CustomerProfile } from '../services/customerService';
import { RefillService, RefillReminder } from '../services/refillService';

export default function Customers() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [reminders, setReminders] = useState<RefillReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculatingRefills, setCalculatingRefills] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All'); // All, Active, Inactive, RefillDue

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const custFilter = filter === 'RefillDue' ? 'All' : filter;
      const [fetchedCustomers, fetchedReminders] = await Promise.all([
        CustomerService.getCustomers(searchTerm, custFilter),
        RefillService.getPharmacyReminders('PENDING').catch(() => [])
      ]);
      setCustomers(fetchedCustomers);
      setReminders(fetchedReminders);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateRefills = async () => {
    try {
      setCalculatingRefills(true);
      await RefillService.calculateRefills();
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setCalculatingRefills(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    let result = customers;
    if (searchTerm) {
      result = result.filter(c => 
        (c.display_name?.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (c.phone?.includes(searchTerm))
      );
    }
    if (filter === 'RefillDue') {
      const refillCustomerIds = new Set(reminders.map(r => r.customer_id));
      result = result.filter(c => refillCustomerIds.has(c.id));
    }
    return result;
  }, [customers, searchTerm, filter, reminders]);

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
      className="space-y-6 pb-12 max-w-[1600px] mx-auto px-4 xl:px-8 pt-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pharmacy-600 to-blue-600 tracking-tight flex items-center w-fit">
            <Users className="w-8 h-8 mr-3 text-pharmacy-600" />
            Customers & CRM
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Manage pharmacy customers, history, and smart refills.</p>
        </motion.div>
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <button 
            onClick={handleCalculateRefills}
            disabled={calculatingRefills}
            className="px-4 py-2 bg-pharmacy-50 text-pharmacy-600 rounded-xl font-medium text-sm hover:bg-pharmacy-100 transition-colors flex items-center shadow-sm disabled:opacity-50"
          >
            {calculatingRefills ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
            Calculate Refills
          </button>
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2 shadow-sm flex items-center">
            <Users className="h-5 w-5 text-pharmacy-500 mr-2" />
            <span className="text-sm font-medium text-slate-700">Total: {customers.length}</span>
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between"
      >
        <div className="relative flex-1 w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pharmacy-500/20 focus:border-pharmacy-500 transition-all focus:bg-white"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
          />
        </div>
        
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-slate-400" />
          </div>
          <select
            className="block w-full sm:w-48 pl-11 pr-10 py-3 bg-slate-50 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pharmacy-500/20 focus:border-pharmacy-500 transition-all focus:bg-white cursor-pointer"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Customers</option>
            <option value="Active">Active Customers</option>
            <option value="Inactive">Inactive Customers</option>
            <option value="RefillDue">Refill Due</option>
          </select>
        </div>
      </motion.div>

      {/* Customer Table */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white shadow-sm border border-slate-200 rounded-[2rem] overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stats</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Purchase</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Refills</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
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
                    <Loader2 className="h-8 w-8 text-pharmacy-400 animate-spin mx-auto mb-3" />
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
                filteredCustomers.map((customer) => {
                  const customerReminders = reminders.filter(r => r.customer_id === customer.id);
                  return (
                    <motion.tr 
                      variants={itemVariants}
                      key={customer.id} 
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-pharmacy-50 flex items-center justify-center text-pharmacy-700 font-bold border border-pharmacy-100">
                            {customer.display_name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-900">{customer.display_name}</div>
                            <div className="flex items-center text-xs text-slate-500 mt-0.5">
                              <Phone className="h-3 w-3 mr-1" />
                              {customer.phone || 'No phone'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-sm font-medium text-slate-700">
                            <Activity className="h-4 w-4 text-slate-400 mr-2" />
                            {customer.total_bills || 0} Bills
                          </div>
                          <div className="flex items-center text-xs text-slate-500">
                            <DollarSign className="h-3.5 w-3.5 text-slate-400 mr-2" />
                            ₹{Number(customer.total_spend || 0).toFixed(2)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {customer.last_purchase_date ? (
                          <div className="flex items-center text-sm text-slate-700">
                            <Calendar className="h-4 w-4 text-slate-400 mr-2" />
                            {new Date(customer.last_purchase_date).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">No purchases</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {customerReminders.length > 0 ? (
                          <div className="flex flex-col space-y-1">
                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                              {customerReminders.length} Refill(s) Due
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          customer.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {customer.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-slate-400 hover:text-pharmacy-600 transition-colors p-1.5 rounded-full hover:bg-slate-100">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </td>
                    </motion.tr>
                  )
                })
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
