import { useState, useEffect } from 'react';
import { Medicine } from '../../types/medicine';
import { MEDICINE_CATEGORIES } from '../../constants/medicine';
import { X, Save, Sparkles, Wand2, Loader2, Image as ImageIcon, ChevronDown } from 'lucide-react';
import ModernDatePicker from '../ui/ModernDatePicker';

interface MedicineFormProps {
  medicine?: Medicine | null;
  existingMedicines?: Medicine[];
  onClose: () => void;
  onSave: (med: Partial<Medicine>) => void;
}

export default function MedicineForm({ medicine, existingMedicines = [], onClose, onSave }: MedicineFormProps) {
  const [formData, setFormData] = useState<Partial<Medicine>>({
    name: '',
    genericName: '',
    category: MEDICINE_CATEGORIES[0],
    strength: '',
    dosageForm: '',
    packSize: '',
    sku: '',
    barcode: '',
    mrp: 0,
    sellingPrice: 0,
    minimumStock: 0,
    currentStock: 0,
    prescriptionRequired: false,
    status: 'Active',
    hsnCode: '',
    gstRate: 0,
  });

  const [isSmartLoading, setIsSmartLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'category' | 'gstRate' | null>(null);

  useEffect(() => {
    if (medicine) {
      setFormData(medicine);
    }
  }, [medicine]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert numeric fields from string to number on submit
    const submissionData = {
      ...formData,
      mrp: Number(formData.mrp || 0),
      sellingPrice: Number(formData.sellingPrice || 0),
      minimumStock: Number(formData.minimumStock || 0),
      currentStock: Number(formData.currentStock || 0),
      gstRate: Number(formData.gstRate || 0)
    };
    
    onSave(submissionData);
  };

  const handleSmartAutofill = async () => {
    if (!formData.name) {
      alert("Please enter a medicine name first to auto-fill details.");
      return;
    }
    
    setIsSmartLoading(true);
    // Simulate API call to a medicines database
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const nameLower = formData.name.toLowerCase();
    let smartData: Partial<Medicine> | null = null;

    // 1. First, try to find a match from the existing database!
    const dbMatch = existingMedicines.find(m => 
      m.name.toLowerCase().includes(nameLower) || nameLower.includes(m.name.toLowerCase())
    );

    if (dbMatch) {
      // Auto-fill from database!
      smartData = {
        genericName: dbMatch.genericName,
        category: dbMatch.category,
        strength: dbMatch.strength,
        dosageForm: dbMatch.dosageForm,
        packSize: dbMatch.packSize,
        hsnCode: dbMatch.hsnCode,
        gstRate: dbMatch.gstRate,
        prescriptionRequired: dbMatch.prescriptionRequired,
        manufacturer: dbMatch.manufacturer,
        // We might not want to copy exact stock or SKU from another medicine
      };
    }

    // 2. If no DB match, fall back to our smart hardcoded rules
    if (!smartData) {
      if (nameLower.includes('para') || nameLower.includes('dolo') || nameLower.includes('crocin')) {
      smartData = {
        genericName: 'Paracetamol',
        category: 'Tablets',
        strength: '500 mg',
        dosageForm: 'Tablet',
        packSize: '15 tablets',
        hsnCode: '30049099',
        gstRate: 12,
        prescriptionRequired: false,
        mrp: 30,
        sellingPrice: 28,
        minimumStock: 50,
        manufacturer: 'Micro Labs Ltd'
      };
    } else if (nameLower.includes('amox') || nameLower.includes('augmentin')) {
      smartData = {
        genericName: 'Amoxicillin & Potassium Clavulanate',
        category: 'Tablets',
        strength: '625 mg',
        dosageForm: 'Tablet',
        packSize: '10 tablets',
        hsnCode: '30041010',
        gstRate: 12,
        prescriptionRequired: true,
        mrp: 180,
        sellingPrice: 165,
        minimumStock: 20,
        manufacturer: 'GlaxoSmithKline'
      };
    } else if (nameLower.includes('cuff') || nameLower.includes('syrup')) {
      smartData = {
        genericName: 'Dextromethorphan, Chlorpheniramine',
        category: 'Syrups',
        strength: '100 ml',
        dosageForm: 'Syrup',
        packSize: '1 bottle',
        hsnCode: '30049011',
        gstRate: 12,
        prescriptionRequired: false,
        mrp: 120,
        sellingPrice: 110,
        minimumStock: 15,
        manufacturer: 'Cipla Ltd'
      };
    } else if (nameLower.includes('azithro') || nameLower.includes('azee') || nameLower.includes('az')) {
      smartData = {
        genericName: 'Azithromycin',
        category: 'Tablets',
        strength: '250 mg',
        dosageForm: 'Tablet',
        packSize: '10 tablets',
        hsnCode: '3004',
        gstRate: 12,
        prescriptionRequired: true,
        manufacturer: 'Generic Company'
      };
    } else if (nameLower.includes('cef') || nameLower.includes('taxim')) {
      smartData = {
        genericName: 'Cefixime',
        category: 'Tablets',
        strength: '200 mg',
        dosageForm: 'Tablet',
        packSize: '10 tablets',
        hsnCode: '3004',
        gstRate: 12,
        prescriptionRequired: true
      };
    } else if (nameLower.includes('pan') || nameLower.includes('pant')) {
      smartData = {
        genericName: 'Pantoprazole',
        category: 'Tablets',
        strength: '40 mg',
        dosageForm: 'Tablet',
        packSize: '15 tablets',
        hsnCode: '3004',
        gstRate: 12,
        prescriptionRequired: false
      };
    } else if (nameLower.includes('rab') || nameLower.includes('rablet')) {
      smartData = {
        genericName: 'Rabeprazole',
        category: 'Tablets',
        strength: '20 mg',
        dosageForm: 'Tablet',
        packSize: '10 tablets',
        hsnCode: '3004',
        gstRate: 12,
        prescriptionRequired: false
      };
    } else if (nameLower.includes('diclo') || nameLower.includes('voveran')) {
      smartData = {
        genericName: 'Diclofenac Sodium',
        category: 'Tablets',
        strength: '50 mg',
        dosageForm: 'Tablet',
        packSize: '10 tablets',
        hsnCode: '3004',
        gstRate: 12,
        prescriptionRequired: true
      };
    } else if (nameLower.includes('aceclo') || nameLower.includes('zerodol')) {
      smartData = {
        genericName: 'Aceclofenac',
        category: 'Tablets',
        strength: '100 mg',
        dosageForm: 'Tablet',
        packSize: '10 tablets',
        hsnCode: '3004',
        gstRate: 12,
        prescriptionRequired: false
      };
    } else if (nameLower.includes('nim') || nameLower.includes('nise')) {
      smartData = {
        genericName: 'Nimesulide',
        category: 'Tablets',
        strength: '100 mg',
        dosageForm: 'Tablet',
        packSize: '10 tablets',
        hsnCode: '3004',
        gstRate: 12,
        prescriptionRequired: false
      };
    } else if (nameLower.includes('cet') || nameLower.includes('alerid')) {
      smartData = {
        genericName: 'Cetirizine',
        category: 'Tablets',
        strength: '10 mg',
        dosageForm: 'Tablet',
        packSize: '10 tablets',
        hsnCode: '3004',
        gstRate: 12,
        prescriptionRequired: false
      };
    } else if (nameLower.includes('metform') || nameLower.includes('gly')) {
      smartData = {
        genericName: 'Metformin',
        category: 'Tablets',
        strength: '500 mg',
        dosageForm: 'Tablet',
        packSize: '10 tablets',
        hsnCode: '3004',
        gstRate: 12,
        prescriptionRequired: true
      };
    } else {
      smartData = {
        category: 'Tablets',
        dosageForm: 'Tablet',
        gstRate: 12
      };
      };
    }

    if (smartData) {
      setFormData(prev => ({ ...prev, ...smartData }));
    }
    setIsSmartLoading(false);
  };

  const isEdit = !!medicine;

  const inputClass = "mt-1.5 block w-full bg-slate-50 border border-slate-200 rounded-xl shadow-sm py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-pharmacy-500/10 focus:border-pharmacy-500 transition-all focus:bg-white placeholder-slate-400";
  const labelClass = "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-[2rem] text-left shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full border border-slate-100">
          <form onSubmit={handleSubmit}>
            <div className="bg-gradient-to-r from-slate-50 to-white px-6 pt-6 pb-5 border-b border-slate-100 flex justify-between items-start text-slate-900 rounded-t-[2rem]">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2" id="modal-title">
                  {isEdit ? 'Edit Medicine' : 'Add New Medicine'}
                  {!isEdit && <span className="bg-pharmacy-100 text-pharmacy-700 text-[10px] uppercase px-2.5 py-1 rounded-full font-bold ml-2 tracking-wider">New</span>}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Fill in the details below or use Smart Auto-fill to fetch data automatically.</p>
              </div>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-red-500 bg-white shadow-sm border border-slate-200 rounded-full p-2 transition-all hover:rotate-90">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-white px-6 pt-6 pb-8">
              <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
                
                {/* Smart Auto-fill Section */}
                <div className="sm:col-span-6 bg-gradient-to-br from-pharmacy-50 via-white to-blue-50 p-5 rounded-2xl border border-pharmacy-100/60 relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity group-hover:scale-110 group-hover:rotate-12 duration-500"><Wand2 className="w-32 h-32" /></div>
                  <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                      <label htmlFor="name" className={labelClass}>Medicine Name <span className="text-red-500">*</span></label>
                      <input type="text" name="name" id="name" required value={formData.name || ''} onChange={handleChange} placeholder="e.g. Dolo 650" className={inputClass} />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleSmartAutofill}
                      disabled={isSmartLoading}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pharmacy-600 to-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                      {isSmartLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {isSmartLoading ? 'Fetching Data...' : 'Smart Auto-fill'}
                    </button>
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="sm:col-span-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 p-5 bg-slate-50/50 rounded-2xl border border-slate-100/80">
                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white shadow-sm flex items-center justify-center relative group transition-all hover:border-pharmacy-400">
                    {formData.imageUrl ? (
                      <>
                        <img src={formData.imageUrl} alt="Medicine" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))} className="text-white text-xs font-bold px-3 py-1.5 bg-red-500 rounded-lg shadow-sm hover:bg-red-600 transition-colors">Remove</button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="mx-auto flex justify-center text-slate-300 mb-1"><ImageIcon className="h-8 w-8" /></div>
                        <span className="text-xs font-semibold text-slate-400">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2 text-center sm:text-left mt-2 sm:mt-0">
                    <h4 className="text-sm font-bold text-slate-800">Medicine Image</h4>
                    <p className="text-[13px] text-slate-500 max-w-xs">Upload a clear picture of the medicine packaging. This helps in quick visual identification during billing.</p>
                    <div className="pt-2">
                      <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
                        <span>Choose File</span>
                        <input type="file" className="sr-only" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              alert('Image is too large. Please select an image under 2MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </label>
                      <span className="ml-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">PNG, JPG (MAX 2MB)</span>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="genericName" className={labelClass}>Generic Name <span className="text-red-500">*</span></label>
                  <input type="text" name="genericName" id="genericName" required value={formData.genericName || ''} onChange={handleChange} className={inputClass} placeholder="e.g. Paracetamol" />
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="manufacturer" className={labelClass}>Manufacturer / Company</label>
                  <input type="text" name="manufacturer" id="manufacturer" value={formData.manufacturer || ''} onChange={handleChange} className={inputClass} placeholder="e.g. Cipla, Sun Pharma, Mankind" />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="category" className={labelClass}>Category <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div 
                      className={`${inputClass} cursor-pointer flex justify-between items-center pr-3`}
                      onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
                    >
                      <span className={formData.category ? 'text-slate-800' : 'text-slate-400'}>{formData.category || 'Select Category'}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                    {openDropdown === 'category' && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}></div>
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1">
                          {MEDICINE_CATEGORIES.map(c => (
                            <div 
                              key={c}
                              className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-pharmacy-50 hover:text-pharmacy-700 transition-colors ${formData.category === c ? 'bg-pharmacy-50 text-pharmacy-700 font-bold' : 'text-slate-700'}`}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, category: c }));
                                setOpenDropdown(null);
                              }}
                            >
                              {c}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="strength" className={labelClass}>Strength</label>
                  <input type="text" name="strength" id="strength" placeholder="e.g. 500 mg" value={formData.strength || ''} onChange={handleChange} className={inputClass} />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="dosageForm" className={labelClass}>Dosage Form</label>
                  <input type="text" name="dosageForm" id="dosageForm" placeholder="e.g. Tablet, Syrup" value={formData.dosageForm || ''} onChange={handleChange} className={inputClass} />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="packSize" className={labelClass}>Pack Size</label>
                  <input type="text" name="packSize" id="packSize" placeholder="e.g. 10 tablets" value={formData.packSize || ''} onChange={handleChange} className={inputClass} />
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="sku" className={labelClass}>SKU / Batch No.</label>
                  <input type="text" name="sku" id="sku" placeholder="Optional" value={formData.sku || ''} onChange={handleChange} className={inputClass} />
                </div>


                <div className="sm:col-span-2">
                  <label htmlFor="hsnCode" className={labelClass}>HSN/SAC Code</label>
                  <input type="text" name="hsnCode" id="hsnCode" placeholder="Optional" value={formData.hsnCode || ''} onChange={handleChange} className={inputClass} />
                </div>

                <div className="sm:col-span-2">
                  <ModernDatePicker 
                    label="Expiry Date" 
                    value={formData.expiryDate ? formData.expiryDate.split('T')[0] : ''} 
                    onChange={(date) => setFormData(prev => ({ ...prev, expiryDate: date }))} 
                  />
                </div>

                <div className="sm:col-span-6 border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">₹</span>
                    Pricing & Stock
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <div className="sm:col-span-1">
                      <label htmlFor="mrp" className={labelClass}>MRP (₹)</label>
                      <input type="number" name="mrp" id="mrp" min="0" step="0.01" value={formData.mrp ?? ''} onChange={handleChange} className={inputClass} />
                    </div>

                    <div className="sm:col-span-1">
                      <label htmlFor="sellingPrice" className={labelClass}>Selling Price (₹) <span className="text-red-500">*</span></label>
                      <input type="number" name="sellingPrice" id="sellingPrice" min="0" step="0.01" required value={formData.sellingPrice ?? ''} onChange={handleChange} className={`${inputClass} border-emerald-200 bg-emerald-50/30 focus:border-emerald-500 focus:ring-emerald-500/20 font-semibold text-emerald-700`} />
                    </div>

                    <div className="sm:col-span-1">
                      <label htmlFor="gstRate" className={labelClass}>GST Rate (%)</label>
                      <div className="relative">
                        <div 
                          className={`${inputClass} cursor-pointer flex justify-between items-center pr-3`}
                          onClick={() => setOpenDropdown(openDropdown === 'gstRate' ? null : 'gstRate')}
                        >
                          <span className="text-slate-800">{formData.gstRate}%</span>
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        </div>
                        {openDropdown === 'gstRate' && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}></div>
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1">
                              {[0, 5, 12, 18, 28].map(rate => (
                                <div 
                                  key={rate}
                                  className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-pharmacy-50 hover:text-pharmacy-700 transition-colors ${formData.gstRate === rate ? 'bg-pharmacy-50 text-pharmacy-700 font-bold' : 'text-slate-700'}`}
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, gstRate: rate }));
                                    setOpenDropdown(null);
                                  }}
                                >
                                  {rate}%
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-1">
                      <label htmlFor="currentStock" className={labelClass}>Stock <span className="text-red-500">*</span></label>
                      <input type="number" name="currentStock" id="currentStock" min="0" required value={formData.currentStock ?? ''} onChange={handleChange} className={`${inputClass} font-bold`} />
                    </div>

                    <div className="sm:col-span-1">
                      <label htmlFor="minimumStock" className={labelClass}>Min Stock</label>
                      <input type="number" name="minimumStock" id="minimumStock" min="0" value={formData.minimumStock ?? ''} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <fieldset>
                      <legend className={labelClass}>Prescription Required <span className="text-red-500">*</span></legend>
                      <div className="flex items-center space-x-6 mt-2">
                        <label className="flex items-center cursor-pointer">
                          <input id="rx-yes" name="prescriptionRequired" type="radio" checked={formData.prescriptionRequired === true} onChange={() => setFormData(prev => ({ ...prev, prescriptionRequired: true }))} className="focus:ring-pharmacy-500 h-4 w-4 text-pharmacy-600 border-slate-300 cursor-pointer" />
                          <span className="ml-2 block text-sm font-medium text-slate-700">Yes (Rx)</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input id="rx-no" name="prescriptionRequired" type="radio" checked={formData.prescriptionRequired === false} onChange={() => setFormData(prev => ({ ...prev, prescriptionRequired: false }))} className="focus:ring-pharmacy-500 h-4 w-4 text-pharmacy-600 border-slate-300 cursor-pointer" />
                          <span className="ml-2 block text-sm font-medium text-slate-700">No (OTC)</span>
                        </label>
                      </div>
                    </fieldset>
                  </div>

                  <div>
                    <fieldset>
                      <legend className={labelClass}>Status <span className="text-red-500">*</span></legend>
                      <div className="flex items-center space-x-6 mt-2">
                        <label className="flex items-center cursor-pointer">
                          <input id="status-active" name="status" type="radio" checked={formData.status === 'Active'} onChange={() => setFormData(prev => ({ ...prev, status: 'Active' }))} className="focus:ring-emerald-500 h-4 w-4 text-emerald-600 border-slate-300 cursor-pointer" />
                          <span className="ml-2 block text-sm font-medium text-slate-700">Active</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input id="status-inactive" name="status" type="radio" checked={formData.status === 'Inactive'} onChange={() => setFormData(prev => ({ ...prev, status: 'Inactive' }))} className="focus:ring-slate-500 h-4 w-4 text-slate-600 border-slate-300 cursor-pointer" />
                          <span className="ml-2 block text-sm font-medium text-slate-700">Inactive</span>
                        </label>
                      </div>
                    </fieldset>
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 sm:flex sm:flex-row-reverse border-t border-slate-200 rounded-b-[2rem]">
              <button
                type="submit"
                className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-md shadow-pharmacy-500/20 px-6 py-2.5 bg-pharmacy-600 text-sm font-bold text-white hover:bg-pharmacy-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pharmacy-500 sm:ml-3 sm:w-auto transition-all hover:-translate-y-0.5"
              >
                <Save className="mr-2 h-4 w-4" />
                {isEdit ? 'Save Changes' : 'Save Medicine'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center items-center rounded-xl border border-slate-300 shadow-sm px-6 py-2.5 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 sm:mt-0 sm:ml-3 sm:w-auto transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
