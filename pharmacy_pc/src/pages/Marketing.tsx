import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Tag, Send, Users, TrendingUp, Plus, Edit2, Trash2, Calendar, Percent, ArrowRight, Gift, MessageSquare, Bot, AlertCircle } from 'lucide-react';
import { DEV_PHARMACY_ID } from '../config/development';
import { MarketingService, Offer, Campaign } from '../services/marketingService';

export default function Marketing() {
  const location = useLocation();
  const isWholesale = location.pathname.includes('wholesale');
  
  const [activeTab, setActiveTab] = useState<'offers' | 'campaigns' | 'ai_campaigns'>(isWholesale ? 'campaigns' : 'offers');
  
  const [offers, setOffers] = useState<Offer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  
  // AI Simulation state for Wholesale
  const [isSimulatingAI, setIsSimulatingAI] = useState(false);
  const [aiCampaignsGenerated, setAiCampaignsGenerated] = useState(false);

  // Offer Modal State
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  
  // Campaign Modal State
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  const [offerForm, setOfferForm] = useState({
    title: '',
    description: '',
    coupon_code: '',
    discount_percentage: '',
    max_discount_amount: '',
    min_order_value: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_active: true
  });

  const [campaignForm, setCampaignForm] = useState({
    title: '',
    message: '',
    target_audience: 'ALL'
  });

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const pId = getActualPharmacyId();
      const [offersData, campaignsData] = await Promise.all([
        MarketingService.getOffers(pId),
        MarketingService.getCampaigns(pId)
      ]);
      setOffers(offersData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...offerForm,
        discount_percentage: offerForm.discount_percentage ? Number(offerForm.discount_percentage) : undefined,
        max_discount_amount: offerForm.max_discount_amount ? Number(offerForm.max_discount_amount) : undefined,
        min_order_value: offerForm.min_order_value ? Number(offerForm.min_order_value) : undefined,
        valid_from: new Date(offerForm.valid_from).toISOString(),
        valid_until: new Date(offerForm.valid_until).toISOString(),
      };

      if (editingOffer) {
        await MarketingService.updateOffer(editingOffer.id, dataToSave);
      } else {
        await MarketingService.createOffer(getActualPharmacyId(), dataToSave);
      }
      setIsOfferModalOpen(false);
      setEditingOffer(null);
      fetchData();
    } catch (error) {
      alert('Failed to save offer');
    }
  };

  const handleDeleteOffer = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      try {
        await MarketingService.deleteOffer(id);
        fetchData();
      } catch (error) {
        alert('Failed to delete offer');
      }
    }
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await MarketingService.sendCampaign(getActualPharmacyId(), campaignForm);
      setIsCampaignModalOpen(false);
      alert(`Campaign sent successfully! (Simulated ${isWholesale ? 'WhatsApp Broadcast' : 'SMS'})`);
      fetchData();
    } catch (error) {
      alert('Failed to send campaign');
    }
  };

  const simulateAiCampaignGen = () => {
    setIsSimulatingAI(true);
    setTimeout(() => {
      setIsSimulatingAI(false);
      setAiCampaignsGenerated(true);
    }, 2000);
  };

  const openAddOfferModal = () => {
    setOfferForm({
      title: '',
      description: '',
      coupon_code: '',
      discount_percentage: '',
      max_discount_amount: '',
      min_order_value: '',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true
    });
    setEditingOffer(null);
    setIsOfferModalOpen(true);
  };

  const openEditOfferModal = (offer: Offer) => {
    setOfferForm({
      title: offer.title,
      description: offer.description || '',
      coupon_code: offer.coupon_code,
      discount_percentage: offer.discount_percentage?.toString() || '',
      max_discount_amount: offer.max_discount_amount?.toString() || '',
      min_order_value: offer.min_order_value?.toString() || '',
      valid_from: offer.valid_from.split('T')[0],
      valid_until: offer.valid_until.split('T')[0],
      is_active: offer.is_active
    });
    setEditingOffer(offer);
    setIsOfferModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className={`rounded-3xl p-8 text-white shadow-lg relative overflow-hidden ${isWholesale ? 'bg-gradient-to-r from-blue-700 to-indigo-800' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center">
              {isWholesale ? <MessageSquare className="w-8 h-8 mr-3 text-blue-300" /> : <Gift className="w-8 h-8 mr-3 text-pink-300" />}
              {isWholesale ? 'B2B Marketing & Broadcasts' : 'Marketing & Offers'}
            </h1>
            <p className={`mt-2 max-w-xl ${isWholesale ? 'text-blue-100' : 'text-indigo-100'}`}>
              {isWholesale 
                ? 'Grow your wholesale distribution by broadcasting new stock alerts and bulk schemes to your network of retailers via WhatsApp.'
                : 'Grow your pharmacy business by creating attractive discount coupons and sending promotional messages to your customers.'}
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setCampaignForm({ title: '', message: '', target_audience: 'ALL' });
                setIsCampaignModalOpen(true);
              }}
              className={`px-5 py-2.5 bg-white rounded-xl font-bold shadow-md transition-colors flex items-center ${isWholesale ? 'text-blue-700 hover:bg-blue-50' : 'text-indigo-600 hover:bg-indigo-50'}`}
            >
              <Send className="w-4 h-4 mr-2" /> {isWholesale ? 'New Broadcast' : 'Send Campaign'}
            </button>
            {!isWholesale && (
              <button 
                onClick={openAddOfferModal}
                className="px-5 py-2.5 bg-indigo-500 bg-opacity-30 border border-indigo-400 text-white rounded-xl font-bold hover:bg-opacity-40 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" /> Create Offer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {!isWholesale && (
          <button
            onClick={() => setActiveTab('offers')}
            className={`py-4 px-6 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'offers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Discount Coupons
          </button>
        )}
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`py-4 px-6 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'campaigns' ? (isWholesale ? 'border-blue-600 text-blue-600' : 'border-indigo-600 text-indigo-600') : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          {isWholesale ? 'WhatsApp Broadcasts' : 'Promotional Campaigns'}
        </button>
        {isWholesale && (
          <button
            onClick={() => setActiveTab('ai_campaigns')}
            className={`py-4 px-6 font-semibold text-sm transition-colors border-b-2 flex items-center ${activeTab === 'ai_campaigns' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Bot className="w-4 h-4 mr-2" /> AI Smart Promos
          </button>
        )}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64 text-indigo-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : activeTab === 'offers' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <Tag className="w-12 h-12 mb-4 text-slate-300" />
              <h3 className="text-lg font-bold text-slate-700">No Offers Yet</h3>
              <p className="mt-1">Create your first discount coupon to attract customers.</p>
              <button onClick={openAddOfferModal} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">Create Offer</button>
            </div>
          ) : (
            offers.map(offer => {
              const isExpired = new Date(offer.valid_until) < new Date();
              const statusColor = !offer.is_active ? 'bg-slate-100 text-slate-600' : isExpired ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600';
              const statusText = !offer.is_active ? 'Inactive' : isExpired ? 'Expired' : 'Active';

              return (
                <div key={offer.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold ${statusColor}`}>
                    {statusText}
                  </div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <Percent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{offer.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{offer.description}</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-3 flex items-center justify-between mb-4">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Code:</span>
                    <span className="font-mono font-bold text-lg text-indigo-600 tracking-widest">{offer.coupon_code}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-6">
                    <div className="text-slate-600"><span className="text-slate-400">Discount:</span> {offer.discount_percentage}%</div>
                    {offer.max_discount_amount && <div className="text-slate-600"><span className="text-slate-400">Max:</span> ₹{offer.max_discount_amount}</div>}
                    {offer.min_order_value && <div className="text-slate-600"><span className="text-slate-400">Min Order:</span> ₹{offer.min_order_value}</div>}
                    <div className="text-slate-600"><span className="text-slate-400">Valid till:</span> {new Date(offer.valid_until).toLocaleDateString()}</div>
                  </div>

                  <div className="mt-auto flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button onClick={() => openEditOfferModal(offer)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteOffer(offer.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : activeTab === 'campaigns' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {campaigns.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500">
              <Send className="w-12 h-12 mb-4 text-slate-300" />
              <h3 className="text-lg font-bold text-slate-700">No {isWholesale ? 'Broadcasts' : 'Campaigns'} Sent</h3>
              <p className="mt-1">Send {isWholesale ? 'WhatsApp broadcasts to your retail network.' : 'SMS/Push campaigns to re-engage your patients.'}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Campaign Title</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Audience</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {campaigns.map(camp => (
                  <tr key={camp.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{camp.title}</div>
                      <div className="text-xs text-slate-500 mt-1 max-w-md truncate">{camp.message}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {camp.target_audience}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(camp.sent_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : activeTab === 'ai_campaigns' && isWholesale ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-8 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <Bot className="w-6 h-6 mr-2 text-blue-600" />
                AI Dead-Stock Promoter
              </h3>
              <p className="text-slate-500 mt-1">Let AI scan your inventory for slow-moving or near-expiry items and automatically create targeted WhatsApp campaigns.</p>
            </div>
            {!aiCampaignsGenerated && (
              <button 
                onClick={simulateAiCampaignGen}
                disabled={isSimulatingAI}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isSimulatingAI ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Scanning Inventory...</>
                ) : (
                  <><Bot className="w-4 h-4 mr-2" /> Scan Inventory</>
                )}
              </button>
            )}
          </div>

          {aiCampaignsGenerated ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-3 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900">AI Analysis Complete</h4>
                  <p className="text-sm text-blue-700 mt-1">Found 2 categories of slow-moving stock. Generated 2 optimized campaigns ready to send.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded">Near Expiry Alert</span>
                    <span className="text-slate-400 text-xs font-semibold">Target: 45 Clients</span>
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">Cosmetics Clearance Sale</h4>
                  <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 mb-4 border border-slate-100">
                    "🚨 Clearance Sale! Extra 15% OFF on Nivea & Dove products. Stock up now before it runs out. Reply YES to order."
                  </div>
                  <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors">
                    Send to 45 Clients via WhatsApp
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">Overstocked Items</span>
                    <span className="text-slate-400 text-xs font-semibold">Target: 112 Clients</span>
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">Generic Meds Bulk Offer</h4>
                  <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 mb-4 border border-slate-100">
                    "📦 Special Bulk Offer: Buy 50 boxes of Generic Paracetamol, get 5 boxes FREE! Valid only for today. Tap to claim."
                  </div>
                  <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors">
                    Send to 112 Clients via WhatsApp
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 pt-8 pb-16 border-2 border-dashed border-slate-200 rounded-xl">
              <Bot className="w-16 h-16 mb-4 text-slate-200" />
              <p>Click "Scan Inventory" to let AI find promotional opportunities.</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Offer Modal */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-800/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-indigo-600" />
                {editingOffer ? 'Edit Coupon' : 'Create New Coupon'}
              </h3>
              <button onClick={() => setIsOfferModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSaveOffer} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Offer Title *</label>
                  <input required type="text" value={offerForm.title} onChange={e => setOfferForm({...offerForm, title: e.target.value})} placeholder="e.g. Diwali Dhamaka Sale" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                  <textarea value={offerForm.description} onChange={e => setOfferForm({...offerForm, description: e.target.value})} placeholder="Get flat 10% off on all medicines..." className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none h-20" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Coupon Code *</label>
                  <input required type="text" value={offerForm.coupon_code} onChange={e => setOfferForm({...offerForm, coupon_code: e.target.value.toUpperCase()})} placeholder="e.g. DIWALI10" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 font-mono uppercase focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Discount Percentage (%) *</label>
                  <input required type="number" min="0" max="100" value={offerForm.discount_percentage} onChange={e => setOfferForm({...offerForm, discount_percentage: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Max Discount Amount (₹)</label>
                  <input type="number" min="0" value={offerForm.max_discount_amount} onChange={e => setOfferForm({...offerForm, max_discount_amount: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Min Order Value (₹)</label>
                  <input type="number" min="0" value={offerForm.min_order_value} onChange={e => setOfferForm({...offerForm, min_order_value: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Valid From *</label>
                  <input required type="date" value={offerForm.valid_from} onChange={e => setOfferForm({...offerForm, valid_from: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Valid Until *</label>
                  <input required type="date" value={offerForm.valid_until} onChange={e => setOfferForm({...offerForm, valid_until: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                
                <div className="md:col-span-2 flex items-center">
                  <input type="checkbox" id="offerActive" checked={offerForm.is_active} onChange={e => setOfferForm({...offerForm, is_active: e.target.checked})} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 mr-3" />
                  <label htmlFor="offerActive" className="text-sm font-semibold text-slate-700">Make this offer active immediately</label>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsOfferModalOpen(false)} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors">Save Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-800/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ${isWholesale ? 'bg-blue-50 text-blue-900' : 'bg-indigo-50 text-indigo-900'}`}>
              <h3 className="text-lg font-bold flex items-center">
                <Send className="w-5 h-5 mr-2" />
                {isWholesale ? 'Send WhatsApp Broadcast' : 'Send SMS Campaign'}
              </h3>
              <button onClick={() => setIsCampaignModalOpen(false)} className={`hover:text-opacity-80 ${isWholesale ? 'text-blue-400' : 'text-indigo-400'}`}>✕</button>
            </div>
            
            <form onSubmit={handleSendCampaign} className="p-6">
              <div className="space-y-5 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Campaign Title (Internal) *</label>
                  <input required type="text" value={campaignForm.title} onChange={e => setCampaignForm({...campaignForm, title: e.target.value})} placeholder="e.g. Weekend Flash Sale SMS" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Target Audience *</label>
                  <select value={campaignForm.target_audience} onChange={e => setCampaignForm({...campaignForm, target_audience: e.target.value})} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none">
                    {isWholesale ? (
                      <>
                        <option value="ALL">All Retail Clients</option>
                        <option value="TOP_BUYERS">Top Buyers (High Volume)</option>
                        <option value="OVERDUE_LEDGERS">Clients with Overdue Ledgers</option>
                      </>
                    ) : (
                      <>
                        <option value="ALL">All Customers</option>
                        <option value="ACTIVE_30_DAYS">Active in last 30 days</option>
                        <option value="INACTIVE_60_DAYS">Inactive for 60+ days</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-sm font-semibold text-slate-700">Message Content *</label>
                    <span className="text-xs text-slate-400">{campaignForm.message.length}/160 chars</span>
                  </div>
                  <textarea required maxLength={isWholesale ? 1000 : 160} value={campaignForm.message} onChange={e => setCampaignForm({...campaignForm, message: e.target.value})} placeholder={isWholesale ? "Hi [Pharmacy_Name], fresh stock of Cipla products arrived at 22% margin..." : "Hi [Name], get 10% off your next medicine order using code..."} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none h-32" />
                  <p className="text-xs text-slate-500 mt-2">Note: Variables like {isWholesale ? '[Pharmacy_Name]' : '[Name]'} will be replaced automatically. {isWholesale ? 'WhatsApp messages can be up to 1000 characters.' : 'Max 160 characters for 1 SMS credit.'}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsCampaignModalOpen(false)} className="flex-1 px-4 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors border border-slate-200">Cancel</button>
                <button type="submit" className={`flex-1 px-4 py-3 text-white font-bold rounded-xl shadow-md transition-colors flex justify-center items-center ${isWholesale ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
                  <Send className="w-4 h-4 mr-2" /> {isWholesale ? 'Broadcast Now' : 'Send Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
