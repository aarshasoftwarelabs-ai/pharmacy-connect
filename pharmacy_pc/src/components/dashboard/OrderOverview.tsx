import React from 'react';
import { MedicineRequest } from '../../types/medicineRequest';
import { Bill } from '../../types/billing';
import { Clock, UserCircle, FileCheck, IndianRupee, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  requests?: MedicineRequest[];
  bills?: Bill[];
}

export default function OrderOverview({ requests = [], bills = [] }: Props) {
  // Calculate real metrics from our backend data
  const waitingForResponse = requests.filter(r => r.status === 'WAITING').length;
  const waitingForCustomer = requests.filter(r => r.status === 'AVAILABLE' || r.status === 'CAN_ARRANGE').length;
  const confirmedForBilling = requests.filter(r => r.customerConfirmation === 'CONFIRMED').length;
  const rejectedOrOutOfStock = requests.filter(r => r.customerConfirmation === 'CANCELLED' || r.status === 'NOT_AVAILABLE').length;
  
  const unpaidBills = bills.filter(b => b.paymentStatus === 'UNPAID').length;
  const paidBills = bills.filter(b => b.paymentStatus === 'PAID').length;

  const workflowSteps = [
    { 
      label: 'Waiting Response', 
      count: waitingForResponse, 
      icon: Clock,
      gradient: 'from-amber-400 to-orange-500',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-200'
    },
    { 
      label: 'Awaiting Customer', 
      count: waitingForCustomer, 
      icon: UserCircle,
      gradient: 'from-orange-400 to-rose-400',
      bgLight: 'bg-orange-50',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    },
    { 
      label: 'Bill Preparation', 
      count: confirmedForBilling, 
      icon: FileCheck,
      gradient: 'from-indigo-400 to-purple-500',
      bgLight: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-200'
    },
    { 
      label: 'Unpaid Bills', 
      count: unpaidBills, 
      icon: IndianRupee,
      gradient: 'from-blue-400 to-cyan-500',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    { 
      label: 'Completed', 
      count: paidBills, 
      icon: CheckCircle2,
      gradient: 'from-emerald-400 to-teal-500',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-200'
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full flex flex-col relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Pharmacy Workflow</h3>
      </div>
      
      <div className="flex-1 relative z-10 flex flex-col justify-between space-y-4">
        {workflowSteps.map((step, index) => (
          <div key={step.label} className="relative group cursor-default">
            {/* Connecting Line (skip for last active item) */}
            {index < workflowSteps.length - 1 && (
              <div className="absolute left-6 top-10 bottom-[-24px] w-0.5 bg-gradient-to-b from-slate-200 to-transparent group-hover:from-indigo-200 transition-colors duration-500 z-0"></div>
            )}
            
            <div className="flex items-center relative z-10">
              {/* Icon Container */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${step.gradient} shadow-sm transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:-rotate-3`}>
                <step.icon className="w-5 h-5 text-white" />
              </div>
              
              {/* Label & Description */}
              <div className="ml-4 flex-1">
                <h4 className="text-[15px] font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{step.label}</h4>
              </div>
              
              {/* Count Badge */}
              <div className={`px-4 py-1.5 rounded-lg border ${step.bgLight} ${step.borderColor} ${step.textColor} font-bold text-lg min-w-[3rem] text-center shadow-sm transition-transform duration-300 group-hover:scale-105`}>
                {step.count}
              </div>
            </div>
          </div>
        ))}
        
        {/* Separator for Cancelled */}
        <div className="pt-4 mt-2 border-t border-slate-100 relative z-10">
          <div className="flex items-center justify-between group cursor-default">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 group-hover:bg-slate-200 transition-colors">
                <XCircle className="w-5 h-5" />
              </div>
              <h4 className="ml-4 text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors">Cancelled / Rejected</h4>
            </div>
            <div className="font-bold text-slate-400 text-base group-hover:text-slate-600 transition-colors pr-2">
              {rejectedOrOutOfStock}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
