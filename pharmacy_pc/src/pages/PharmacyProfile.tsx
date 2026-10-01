import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Phone, MapPin, Mail, Clock, Award, Shield, FileText, IndianRupee, Loader2, AlertCircle, Edit, Save, X, CheckCircle2, XCircle } from 'lucide-react';
import { PharmacyService, PharmacyProfile as IPharmacyProfile } from '../services/pharmacyService';
import { MedicineRequestService } from '../services/medicineRequestService';
import { BillingService } from '../services/billingService';
import { DEV_PHARMACY_ID } from '../config/development';

const DayHoursEditor = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => {
  const isClosed = !value || value.toLowerCase() === 'closed';
  let openTime = '09:00 AM';
  let closeTime = '09:00 PM';
  
  if (!isClosed) {
    const parts = value.split(' - ');
    if (parts.length === 2) {
      openTime = parts[0];
      closeTime = parts[1];
    } else if (value === 'Open 24 Hours') {
      openTime = 'Open 24 Hours';
      closeTime = 'Open 24 Hours';
    }
  }

  const times = [
    '05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM',
    '09:00 PM', '10:00 PM', '11:00 PM', '12:00 AM', 'Open 24 Hours'
  ];

  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        <label className="flex items-center text-xs text-slate-500 cursor-pointer">
          <input 
            type="checkbox" 
            checked={isClosed}
            onChange={(e) => {
              if (e.target.checked) onChange('Closed');
              else onChange(openTime === 'Open 24 Hours' ? 'Open 24 Hours' : `${openTime} - ${closeTime}`);
            }}
            className="mr-1.5 rounded text-rose-500 focus:ring-rose-500 border-slate-300"
          />
          Closed
        </label>
      </div>
      
      {!isClosed ? (
        <div className="flex items-center space-x-2">
          {openTime === 'Open 24 Hours' ? (
             <div className="w-full text-center py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded border border-emerald-100 cursor-pointer" onClick={() => onChange('09:00 AM - 09:00 PM')}>
               Open 24 Hours (Click to change)
             </div>
          ) : (
            <>
              <select 
                value={openTime}
                onChange={(e) => {
                  if (e.target.value === 'Open 24 Hours') onChange('Open 24 Hours');
                  else onChange(`${e.target.value} - ${closeTime}`);
                }}
                className="block w-full border border-slate-300 rounded-md shadow-sm py-1.5 px-1 text-xs focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                {times.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="text-slate-400 text-xs">to</span>
              <select 
                value={closeTime}
                onChange={(e) => onChange(`${openTime} - ${e.target.value}`)}
                className="block w-full border border-slate-300 rounded-md shadow-sm py-1.5 px-1 text-xs focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                {times.filter(t => t !== 'Open 24 Hours').map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </>
          )}
        </div>
      ) : (
        <div className="py-1.5 px-2 text-xs text-rose-500 bg-rose-50 rounded text-center border border-rose-100 font-medium">
          Closed All Day
        </div>
      )}
    </div>
  );
};

export default function PharmacyProfile() {
  const [profile, setProfile] = useState<IPharmacyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<IPharmacyProfile>>({});
  
  const validateGstin = (gstin?: string) => {
    if (!gstin) return null;
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
    return regex.test(gstin);
  };

  const validateRegNo = (regNo?: string) => {
    if (!regNo) return null;
    const regex = /^[A-Z0-9-]{5,25}$/i;
    return regex.test(regNo);
  };
  
  // Stats
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalBills, setTotalBills] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        let actualPharmacyId = DEV_PHARMACY_ID;
        let cachedProfile = null;
        
        const localData = localStorage.getItem('pharmacy_profile_data');
        if (localData) {
            cachedProfile = JSON.parse(localData);
            if (cachedProfile.id) {
               actualPharmacyId = cachedProfile.id;
            }
        }

        const [profData, reqData, billsData] = await Promise.all([
          PharmacyService.getPharmacyProfile(actualPharmacyId).catch(() => null),
          MedicineRequestService.getPharmacyRequests(actualPharmacyId),
          BillingService.getPharmacyBills(actualPharmacyId)
        ]);
        
        // Merge server data with local cache (server takes precedence)
        let mergedProfile: IPharmacyProfile = { ...(cachedProfile || {}), ...(profData || {}) } as IPharmacyProfile;

        // Fallback for required fields if still missing
        if (!mergedProfile.id) mergedProfile.id = actualPharmacyId;
        if (!mergedProfile.name) mergedProfile.name = "Your Pharmacy";
        if (!mergedProfile.address) mergedProfile.address = "Address not provided";
        if (!mergedProfile.phone) mergedProfile.phone = "Phone not provided";
        if (!mergedProfile.createdAt) mergedProfile.createdAt = new Date().toISOString();
        if (!mergedProfile.updatedAt) mergedProfile.updatedAt = new Date().toISOString();
        
        setProfile(mergedProfile);

        setTotalRequests(reqData.length);
        setTotalBills(billsData.length);
        setTotalRevenue(billsData.reduce((sum, b) => sum + Number(b.total), 0));
        
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading pharmacy profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Error Loading Profile</h2>
        <p className="text-slate-500 mt-2">{error}</p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!profile) return;
    
    // Prevent save if invalid
    if (validateGstin(editForm.gstin) === false || validateRegNo(editForm.regNo) === false) {
       return;
    }

    try {
      setLoading(true);
      const updatedFromServer = await PharmacyService.updatePharmacyProfile(profile.id, editForm);
      const merged = { ...profile, ...updatedFromServer } as IPharmacyProfile;
      setProfile(merged);
      localStorage.setItem('pharmacy_profile_data', JSON.stringify(merged));
      setIsEditing(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-10 animate-fade-in space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pharmacy Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your business settings and view overall performance.</p>
        </div>
        <button 
          onClick={() => {
            setEditForm({
              name: profile.name,
              phone: profile.phone,
              email: profile.email,
              address: profile.address,
              ownerName: profile.ownerName,
              regNo: profile.regNo,
              gstin: profile.gstin,
              gstRegistered: profile.gstRegistered || false,
              state: profile.state || '',
              operationalHours: profile.operationalHours || {
                mondayToFriday: '09:00 AM - 10:00 PM',
                saturday: '09:00 AM - 11:00 PM',
                sunday: 'Closed'
              }
            });
            setIsEditing(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg shadow-sm font-medium transition-colors border border-indigo-200"
        >
          <Edit className="w-4 h-4 mr-2" /> Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Cover Photo Area */}
            <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
              <div className="absolute inset-0 bg-black/10"></div>
            </div>
            
            <div className="px-6 pb-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-2xl bg-white shadow-md relative -mt-12 mb-4 border border-slate-100">
                <div className="absolute inset-1.5 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center border border-indigo-100 text-indigo-600 font-bold text-4xl leading-none">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 mt-2">
                  <Shield className="w-3 h-3 mr-1" /> Verified Partner
                </span>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5 mr-3 shrink-0" />
                  <p className="text-sm text-slate-600 leading-relaxed">{profile.address}</p>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                  <p className="text-sm text-slate-600 font-medium">{profile.phone}</p>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                  <p className="text-sm text-slate-600">{profile.email || `contact@${profile.name.toLowerCase().replace(/\s+/g, '')}.com`}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-indigo-500" /> Operational Hours
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Monday - Friday</span>
                <span className="text-slate-900 font-semibold">{profile.operationalHours?.mondayToFriday || '09:00 AM - 10:00 PM'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Saturday</span>
                <span className="text-slate-900 font-semibold">{profile.operationalHours?.saturday || '09:00 AM - 11:00 PM'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Sunday</span>
                <span className={`${profile.operationalHours?.sunday?.toLowerCase() === 'closed' ? 'text-rose-600' : 'text-slate-900'} font-semibold`}>{profile.operationalHours?.sunday || 'Closed'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Metrics & About */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-110 transition-transform duration-500 z-0"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="text-3xl font-semibold text-slate-900">{totalRequests}</h4>
                <p className="text-sm font-medium text-slate-500 mt-1">Total Requests Handled</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform duration-500 z-0"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-3xl font-semibold text-slate-900">{totalBills}</h4>
                <p className="text-sm font-medium text-slate-500 mt-1">Bills Generated</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform duration-500 z-0"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <h4 className="text-3xl font-semibold text-slate-900">₹{(totalRevenue / 1000).toFixed(1)}k</h4>
                <p className="text-sm font-medium text-slate-500 mt-1">Lifetime Revenue</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center">
              <Building2 className="w-5 h-5 text-indigo-500 mr-2" />
              <h3 className="text-lg font-bold text-slate-800">About Pharmacy</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 leading-relaxed text-sm">
                {profile.name} has been serving the local community with authentic medicines and health products. We specialize in fast, reliable prescription fulfillment and over-the-counter wellness solutions. Our partnership with PharmacyConnect ensures we reach our patients quickly and provide seamless digital billing.
              </p>
              
              <div className="mt-8 grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Registration No.</span>
                  <span className="text-sm font-medium text-slate-900">{profile.regNo || 'Not Provided'}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">GSTIN</span>
                  <span className="text-sm font-medium text-slate-900">{profile.gstRegistered ? (profile.gstin || 'Not Provided') : 'Not Registered'}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">State</span>
                  <span className="text-sm font-medium text-slate-900">{profile.state || 'Not Provided'}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Joined Date</span>
                  <span className="text-sm font-medium text-slate-900">{new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric'})}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Owner / Pharmacist</span>
                  <span className="text-sm font-medium text-slate-900">{profile.ownerName || 'Not Provided'}</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Edit Pharmacy Profile</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Pharmacy Name</label>
                  <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Owner Name</label>
                  <input type="text" value={editForm.ownerName || ''} onChange={e => setEditForm({...editForm, ownerName: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input type="email" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Phone</label>
                  <input type="tel" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Registration No.</label>
                  <div className="relative">
                    <input type="text" value={editForm.regNo || ''} onChange={e => setEditForm({...editForm, regNo: e.target.value})} className={`mt-1 block w-full border ${validateRegNo(editForm.regNo) === false ? 'border-red-300' : 'border-slate-300'} rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
                    {validateRegNo(editForm.regNo) === true && <CheckCircle2 className="absolute right-3 top-3 w-4 h-4 text-emerald-500" />}
                    {validateRegNo(editForm.regNo) === false && <XCircle className="absolute right-3 top-3 w-4 h-4 text-red-500" />}
                  </div>
                  {validateRegNo(editForm.regNo) === false && <p className="mt-1 text-xs text-red-500">Invalid Registration No. format</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
                    <input type="checkbox" checked={editForm.gstRegistered} onChange={e => setEditForm({...editForm, gstRegistered: e.target.checked})} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span>GST Registered</span>
                  </label>
                </div>
                {editForm.gstRegistered && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">GSTIN</label>
                    <div className="relative">
                      <input type="text" value={editForm.gstin || ''} onChange={e => setEditForm({...editForm, gstin: e.target.value.toUpperCase()})} className={`mt-1 block w-full border ${validateGstin(editForm.gstin) === false ? 'border-red-300' : 'border-slate-300'} rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
                      {validateGstin(editForm.gstin) === true && <CheckCircle2 className="absolute right-3 top-3 w-4 h-4 text-emerald-500" />}
                      {validateGstin(editForm.gstin) === false && <XCircle className="absolute right-3 top-3 w-4 h-4 text-red-500" />}
                    </div>
                    {validateGstin(editForm.gstin) === false && <p className="mt-1 text-xs text-red-500">Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)</p>}
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">State (Required for GST calculation)</label>
                  <input type="text" value={editForm.state || ''} onChange={e => setEditForm({...editForm, state: e.target.value})} placeholder="e.g. Gujarat" className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Address</label>
                  <textarea rows={3} value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div className="md:col-span-2 pt-4 border-t border-slate-100 mt-2">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-indigo-500" /> Edit Operational Hours
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DayHoursEditor
                      label="Monday - Friday"
                      value={editForm.operationalHours?.mondayToFriday || '09:00 AM - 10:00 PM'}
                      onChange={val => setEditForm({...editForm, operationalHours: {...(editForm.operationalHours || {mondayToFriday:'', saturday:'', sunday:''}), mondayToFriday: val}})}
                    />
                    <DayHoursEditor
                      label="Saturday"
                      value={editForm.operationalHours?.saturday || '09:00 AM - 11:00 PM'}
                      onChange={val => setEditForm({...editForm, operationalHours: {...(editForm.operationalHours || {mondayToFriday:'', saturday:'', sunday:''}), saturday: val}})}
                    />
                    <DayHoursEditor
                      label="Sunday"
                      value={editForm.operationalHours?.sunday || 'Closed'}
                      onChange={val => setEditForm({...editForm, operationalHours: {...(editForm.operationalHours || {mondayToFriday:'', saturday:'', sunday:''}), sunday: val}})}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleSave} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
