import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, MoreVertical, Eye, Archive, Loader2, AlertCircle } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { PrescriptionService, Prescription } from '../services/prescriptionService';

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ACTIVE'); 

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await PrescriptionService.getPharmacyPrescriptions(filter === 'All' ? undefined : filter);
      setPrescriptions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await PrescriptionService.updatePrescriptionStatus(id, 'ARCHIVED');
      await fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    if (!searchTerm) return true;
    return (p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.customer_phone?.includes(searchTerm));
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pharmacy-600 to-blue-600 tracking-tight flex items-center">
            <FileText className="w-8 h-8 mr-3 text-pharmacy-600" />
            Prescriptions
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">View and manage customer uploaded prescriptions.</p>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between"
      >
        <div className="relative flex-1 w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pharmacy-500/20 focus:border-pharmacy-500 transition-shadow focus:bg-white"
            placeholder="Search by customer name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-slate-400" />
          </div>
          <select
            className="block w-full sm:w-48 pl-11 pr-10 py-3 bg-slate-50 text-sm font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pharmacy-500/20 focus:border-pharmacy-500 transition-shadow focus:bg-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm border border-slate-200 rounded-[2rem] overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">File</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Uploaded</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <motion.tbody variants={containerVariants} initial="hidden" animate="show" className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 text-pharmacy-400 animate-spin mx-auto mb-3" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-red-500">{error}</td>
                </tr>
              ) : filteredPrescriptions.length > 0 ? (
                filteredPrescriptions.map((pres) => (
                  <motion.tr variants={itemVariants} key={pres.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">{pres.customer_name}</div>
                      <div className="text-xs text-slate-500">{pres.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{pres.file_name}</div>
                      <div className="text-xs text-slate-500">{pres.mime_type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(pres.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${pres.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                        {pres.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href={pres.file_url} target="_blank" rel="noreferrer" className="text-pharmacy-600 hover:text-pharmacy-700 mr-4">
                        <Eye className="inline w-4 h-4 mr-1" /> View
                      </a>
                      {pres.status === 'ACTIVE' && (
                        <button onClick={() => handleArchive(pres.id)} className="text-slate-500 hover:text-slate-700">
                          <Archive className="inline w-4 h-4 mr-1" /> Archive
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No prescriptions found.</td>
                </tr>
              )}
            </motion.tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
