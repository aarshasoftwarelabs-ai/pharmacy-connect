import React, { useState } from 'react';
import WholesaleBillForm from '../components/billing/WholesaleBillForm';
import WholesaleInvoiceHistory from '../components/billing/WholesaleInvoiceHistory';
import { useNavigate } from 'react-router-dom';
import { Plus, History } from 'lucide-react';

export default function WholesaleBilling() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  const handleSuccess = () => {
    setActiveTab('history');
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
            B2B Billing & Invoices
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">Create invoices and manage transaction history for your wholesale clients.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'new' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Plus className="w-4 h-4 mr-2" /> New B2B Bill
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <History className="w-4 h-4 mr-2" /> Invoice History
          </button>
        </div>
      </div>
      
      <div className="flex-1">
        {activeTab === 'new' ? (
          <WholesaleBillForm onSuccess={handleSuccess} />
        ) : (
          <WholesaleInvoiceHistory />
        )}
      </div>
    </div>
  );
}
