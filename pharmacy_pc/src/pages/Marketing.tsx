import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Tag, Send, Users, TrendingUp, Plus, Edit2, Trash2, Calendar, Percent, ArrowRight, Gift, MessageSquare, Bot, AlertCircle, CheckCircle2, Share2, Sparkles, ExternalLink } from 'lucide-react';
import { getPharmacyId } from '../config/development';
import { MarketingService, Offer, Campaign } from '../services/marketingService';
import { fetchMedicines } from '../services/medicineService';
import { CustomerService } from '../services/customerService';
import { ModernSelect } from '../components/ui/ModernSelect';

interface AiPromoItem {
  id: string;
  type: 'EXPIRY' | 'HIGH_STOCK' | 'WELLNESS';
  badge: string;
  badgeBg: string;
  badgeText: string;
  title: string;
  message: string;
  targetCount: number;
  medicineName: string;
}

export default function Marketing() {
  const isWholesale = false;
  const [activeTab, setActiveTab] = useState<'offers' | 'campaigns' | 'ai_campaigns'>('offers');
  
  const [offers, setOffers] = useState<Offer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Real AI Live Inventory Promo State
  const [isScanningAI, setIsScanningAI] = useState(false);
  const [aiPromos, setAiPromos] = useState<AiPromoItem[]>([]);
  const [aiScanned, setAiScanned] = useState(false);
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);

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
    return getPharmacyId();
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
      const res = await MarketingService.sendCampaign(getActualPharmacyId(), campaignForm);
      setIsCampaignModalOpen(false);
      
      const broadcastUrl = (res as any)?.waBroadcastUrl || `https://api.whatsapp.com/send?text=${encodeURIComponent(campaignForm.message)}`;
      if (window.confirm(`Campaign "${campaignForm.title}" recorded! Would you like to open WhatsApp Web to broadcast this message to your contacts now?`)) {
        window.open(broadcastUrl, '_blank');
      }
      fetchData();
    } catch (error) {
      alert('Failed to send campaign');
    }
  };

  const runAiInventoryScanner = async () => {
    setIsScanningAI(true);
    setBroadcastNotice(null);
    try {
      const pId = getActualPharmacyId();
      const [medicines, customers] = await Promise.all([
        fetchMedicines(pId).catch(() => []),
        CustomerService.getCustomers().catch(() => [])
      ]);

      const targetCount = customers.length > 0 ? customers.length : 25;
      const promos: AiPromoItem[] = [];

      // 1. Check for near-expiry medicines (within next 90 days)
      const now = new Date();
      const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      const nearExpiryMeds = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const exp = new Date(m.expiryDate);
        return exp > now && exp <= ninetyDaysFromNow;
      });

      if (nearExpiryMeds.length > 0) {
        const topExp = nearExpiryMeds[0];
        promos.push({
          id: 'ai-near-expiry',
          type: 'EXPIRY',
          badge: '⚡ Near Expiry Clearance',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
          badgeText: 'Action Recommended',
          title: `Special Flash Discount on ${topExp.name}`,
          medicineName: topExp.name,
          targetCount,
          message: `🚨 Special Health Offer! Extra 20% OFF on ${topExp.name} at our pharmacy. Grab your essential medicines at discounted rates this week. Reply YES to reserve your order!`
        });
      }

      // 2. Check for high-stock medicines
      const sortedByStock = [...medicines].sort((a, b) => (Number(b.stock) || 0) - (Number(a.stock) || 0));
      const topStockMed = sortedByStock.find(m => (Number(m.stock) || 0) > 10);
      if (topStockMed) {
        promos.push({
          id: 'ai-high-stock',
          type: 'HIGH_STOCK',
          badge: '📦 Bulk Stock Scheme',
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
          badgeText: 'High Inventory',
          title: `Bulk & Family Savings: ${topStockMed.name}`,
          medicineName: topStockMed.name,
          targetCount,
          message: `💊 Great Deals! Buy 2 or more units of ${topStockMed.name} and get an extra 10% instant discount. Available for home delivery or store pickup. Tap here to order!`
        });
      }

      // 3. Chronic & Seasonal Wellness offer
      const wellnessMed = medicines.find(m => 
        m.name.toLowerCase().includes('paracetamol') || 
        m.name.toLowerCase().includes('vitamin') || 
        m.name.toLowerCase().includes('cough') ||
        m.name.toLowerCase().includes('cetirizine') ||
        m.name.toLowerCase().includes('dolo')
      ) || medicines[0];

      if (wellnessMed) {
        promos.push({
          id: 'ai-seasonal-care',
          type: 'WELLNESS',
          badge: '🌿 Health & Wellness Alert',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          badgeText: 'Patient Care',
          title: `Family Healthcare Reminder: ${wellnessMed.name}`,
          medicineName: wellnessMed.name,
          targetCount,
          message: `🩺 Health Tip from your neighborhood pharmacy: Stay ahead with essential family medicines like ${wellnessMed.name}. Free home delivery available on orders above ₹300!`
        });
      }

      // Fallback if inventory is empty
      if (promos.length === 0) {
        promos.push({
          id: 'ai-generic-offer',
          type: 'WELLNESS',
          badge: '⭐ Loyalty Promo',
          badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          badgeText: 'All Patients',
          title: 'Special Monthly Patient Savings',
          medicineName: 'All Healthcare Products',
          targetCount,
          message: `🎉 Exclusive offer for our valued customers! Enjoy 10% discount on your monthly prescription refills this week. Reply with your prescription to order now.`
        });
      }

      setAiPromos(promos);
      setAiScanned(true);
    } catch (err) {
      console.error('AI Scan error:', err);
    } finally {
      setIsScanningAI(false);
    }
  };

  const handleBroadcastPromo = async (promo: AiPromoItem) => {
    try {
      const pId = getActualPharmacyId();
      await MarketingService.sendCampaign(pId, {
        title: promo.title,
        message: promo.message,
        target_audience: 'ALL'
      });
      setBroadcastNotice(`Broadcast recorded for "${promo.title}"! Opening WhatsApp...`);
      fetchData();
      
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(promo.message)}`;
      window.open(waUrl, '_blank');
    } catch (err) {
      alert('Failed to broadcast campaign');
    }
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
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pharmacy-600 to-blue-600 tracking-tight flex items-center w-fit">
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
        <button
          onClick={() => setActiveTab('ai_campaigns')}
          className={`py-4 px-6 font-semibold text-sm transition-colors border-b-2 flex items-center ${activeTab === 'ai_campaigns' ? (isWholesale ? 'border-blue-600 text-blue-600' : 'border-indigo-600 text-indigo-600') : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Sparkles className="w-4 h-4 mr-2 text-indigo-500" /> AI Smart Promos
        </button>
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
      ) : activeTab === 'ai_campaigns' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-8 min-h-[400px] flex flex-col">
          {broadcastNotice && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-sm font-semibold">{broadcastNotice}</span>
              </div>
              <button onClick={() => setBroadcastNotice(null)} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold">Dismiss</button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-indigo-600" />
                AI Smart Inventory Promoter
              </h3>
              <p className="text-slate-500 mt-1">
                Scans your real medicines, near-expiry batches, and stock levels to generate actionable, instant WhatsApp marketing broadcasts.
              </p>
            </div>
            <button 
              onClick={runAiInventoryScanner}
              disabled={isScanningAI}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center shrink-0"
            >
              {isScanningAI ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Scanning Real Stock...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> {aiScanned ? 'Re-scan Live Inventory' : 'Scan Live Inventory'}</>
              )}
            </button>
          </div>

          {aiScanned ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 mr-1 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-indigo-950">Real Inventory Analysis Ready</h4>
                  <p className="text-sm text-indigo-700 mt-0.5">
                    Found {aiPromos.length} targeted promotional opportunities based on your active medicine inventory and registered customers.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {aiPromos.map((promo) => (
                  <div key={promo.id} className="border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col bg-white">
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${promo.badgeBg}`}>
                        {promo.badge}
                      </span>
                      <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {promo.targetCount} Patients
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-base mb-2">{promo.title}</h4>
                    
                    <div className="bg-slate-50 p-3.5 rounded-xl text-sm text-slate-700 mb-4 border border-slate-100 flex-1 whitespace-pre-wrap leading-relaxed font-sans">
                      {promo.message}
                    </div>

                    <div className="space-y-2 mt-auto">
                      <button 
                        onClick={() => handleBroadcastPromo(promo)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-4 h-4" /> Broadcast via WhatsApp
                      </button>
                      <button 
                        onClick={() => {
                          setCampaignForm({
                            title: promo.title,
                            message: promo.message,
                            target_audience: 'ALL'
                          });
                          setIsCampaignModalOpen(true);
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Customize & Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 pt-8 pb-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <Bot className="w-16 h-16 mb-4 text-indigo-300 animate-pulse" />
              <h4 className="text-slate-700 font-bold text-base mb-1">Live Stock & Expiry Opportunity Scanner</h4>
              <p className="text-sm text-slate-500 max-w-md text-center mb-5">
                Click "Scan Live Inventory" to inspect real medicine stock levels, catch nearing-expiry batches, and generate broadcast campaigns.
              </p>
              <button 
                onClick={runAiInventoryScanner}
                disabled={isScanningAI}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition-colors flex items-center gap-2 text-sm"
              >
                <Sparkles className="w-4 h-4" /> Start Live Scan
              </button>
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
                  <ModernSelect 
                    value={campaignForm.target_audience} 
                    onChange={(val) => setCampaignForm({...campaignForm, target_audience: String(val)})}
                    options={isWholesale ? [
                      { value: "ALL", label: "All Retail Clients" },
                      { value: "TOP_BUYERS", label: "Top Buyers (High Volume)" },
                      { value: "OVERDUE_LEDGERS", label: "Clients with Overdue Ledgers" }
                    ] : [
                      { value: "ALL", label: "All Customers" },
                      { value: "ACTIVE_30_DAYS", label: "Active in last 30 days" },
                      { value: "INACTIVE_60_DAYS", label: "Inactive for 60+ days" }
                    ]}
                    theme={isWholesale ? "blue" : "indigo"}
                  />
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
