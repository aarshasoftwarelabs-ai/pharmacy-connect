import React from 'react';
import WholesaleBillForm from '../components/billing/WholesaleBillForm';
import { useNavigate } from 'react-router-dom';

export default function WholesaleBilling() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Optionally navigate to dashboard or just show success
    // The WholesaleBillForm shows its own receipt animation, so doing nothing is fine.
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
            B2B Billing
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">Create invoices and add transactions to Khata for your wholesale clients.</p>
        </div>
      </div>
      <div className="flex-1">
        <WholesaleBillForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
