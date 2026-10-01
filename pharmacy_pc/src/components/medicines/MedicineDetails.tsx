import { Medicine } from '../../types/medicine';
import { X } from 'lucide-react';
import MedicineStatusBadge from './MedicineStatusBadge';

interface MedicineDetailsProps {
  medicine: Medicine | null;
  onClose: () => void;
}

export default function MedicineDetails({ medicine, onClose }: MedicineDetailsProps) {
  if (!medicine) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl leading-6 font-bold text-slate-900" id="modal-title">
                  {medicine.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{medicine.genericName}</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-500 rounded-md p-1 hover:bg-slate-100">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Status</dt>
                  <dd className="mt-1 text-sm text-slate-900"><MedicineStatusBadge status={medicine.status} /></dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Category</dt>
                  <dd className="mt-1 text-sm text-slate-900">{medicine.category}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Strength</dt>
                  <dd className="mt-1 text-sm text-slate-900">{medicine.strength || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Dosage Form</dt>
                  <dd className="mt-1 text-sm text-slate-900">{medicine.dosageForm || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Pack Size</dt>
                  <dd className="mt-1 text-sm text-slate-900">{medicine.packSize}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Prescription Required</dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${medicine.prescriptionRequired ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      {medicine.prescriptionRequired ? 'Yes' : 'No'}
                    </span>
                  </dd>
                </div>
                <div className="sm:col-span-2 border-t border-slate-100 pt-4"></div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">SKU / Barcode</dt>
                  <dd className="mt-1 text-sm text-slate-900 font-mono">{medicine.sku} / {medicine.barcode || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Stock (Current / Min)</dt>
                  <dd className="mt-1 text-sm text-slate-900">{medicine.currentStock} / {medicine.minimumStock}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Pricing</dt>
                  <dd className="mt-1 text-sm text-slate-900">MRP: ₹{medicine.mrp} | Selling: <span className="font-semibold text-pharmacy-700">₹{medicine.sellingPrice}</span></dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Tax Information</dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    HSN/SAC: {medicine.hsnCode || 'N/A'} | GST: {medicine.gstRate || 0}%
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Timestamps</dt>
                  <dd className="mt-1 text-xs text-slate-500">
                    Created: {new Date(medicine.createdAt).toLocaleDateString()}<br/>
                    Updated: {new Date(medicine.updatedAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pharmacy-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
