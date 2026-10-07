import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, MessageSquare, Star, Phone, Mail, FileText, Send, ChevronRight, X, Loader2 } from 'lucide-react';
import { ReviewService, SoftwareReview } from '../services/reviewService';

const HelpSupport = () => {
  const [reviews, setReviews] = useState<SoftwareReview[]>([]);
  const [myReview, setMyReview] = useState<SoftwareReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Form state
  const [uiRating, setUiRating] = useState(0);
  const [featuresRating, setFeaturesRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [all, mine] = await Promise.all([
        ReviewService.getPublicReviews(),
        ReviewService.getMyReview()
      ]);
      setReviews(all);
      if (mine) {
        setMyReview(mine);
        setUiRating(mine.ui_rating);
        setFeaturesRating(mine.features_rating);
        setServiceRating(mine.service_rating);
        setComment(mine.comment || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uiRating || !featuresRating || !serviceRating) return alert('Please provide all ratings');
    
    try {
      setSubmitting(true);
      const updated = await ReviewService.submitReview({
        ui_rating: uiRating,
        features_rating: featuresRating,
        service_rating: serviceRating,
        comment
      });
      setMyReview(updated);
      setShowReviewModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, onChange }: { rating: number, onChange?: (r: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button 
          key={star} 
          type="button"
          onClick={() => onChange && onChange(star)}
          className={`${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-all`}
        >
          <Star className={`w-6 h-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto pb-16 space-y-8 px-1 mt-4">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Help, Support & About</h1>
        <p className="mt-1.5 text-slate-500 font-medium">Get assistance, contact support, and rate our software.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Contact Support Section */}
        <div className="col-span-1 md:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
              <Phone className="w-5 h-5 mr-2 text-indigo-500" /> Contact Support
            </h3>
            <div className="space-y-4">
              <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" className="flex items-center p-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                <MessageSquare className="w-5 h-5 mr-3" />
                <span className="font-semibold">WhatsApp Support</span>
              </a>
              <a href="mailto:support@davasetu.com" className="flex items-center p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                <Mail className="w-5 h-5 mr-3" />
                <span className="font-semibold">Email Us</span>
              </a>
              <div className="flex items-center p-3 rounded-xl bg-slate-50 text-slate-700">
                <FileText className="w-5 h-5 mr-3" />
                <div>
                  <span className="font-semibold block text-sm">Version Info</span>
                  <span className="text-xs text-slate-500">DavaSetu v1.0.0</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-bold mb-2">Love DavaSetu?</h3>
            <p className="text-indigo-100 text-sm mb-4">Your feedback helps us improve and build better features for your pharmacy.</p>
            <button 
              onClick={() => setShowReviewModal(true)}
              className="w-full py-2.5 bg-white text-indigo-600 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-colors"
            >
              {myReview ? 'Edit Your Review' : 'Write a Review'}
            </button>
          </div>
        </div>

        {/* Community Reviews Section */}
        <div className="col-span-1 md:col-span-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-full">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <Star className="w-6 h-6 mr-2 text-yellow-500 fill-yellow-500" /> Community Reviews
            </h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-slate-800">{review.pharmacy_name}</h4>
                      <span className="text-xs text-slate-400">{new Date(review.created_at || '').toLocaleDateString()}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4 bg-white p-3 rounded-xl border border-slate-100">
                      <div className="text-center border-r border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">UI & Experience</p>
                        <div className="flex justify-center"><StarRating rating={review.ui_rating} /></div>
                      </div>
                      <div className="text-center border-r border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Features</p>
                        <div className="flex justify-center"><StarRating rating={review.features_rating} /></div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">Service</p>
                        <div className="flex justify-center"><StarRating rating={review.service_rating} /></div>
                      </div>
                    </div>
                    
                    {review.comment && (
                      <p className="text-slate-600 text-sm italic">"{review.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
              <h2 className="text-xl font-bold text-slate-800">Rate DavaSetu</h2>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">UI & User Experience</p>
                    <p className="text-xs text-slate-500">How easy and beautiful is it?</p>
                  </div>
                  <StarRating rating={uiRating} onChange={setUiRating} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">Features & Tools</p>
                    <p className="text-xs text-slate-500">Are the billing & smart features useful?</p>
                  </div>
                  <StarRating rating={featuresRating} onChange={setFeaturesRating} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">Customer Service</p>
                    <p className="text-xs text-slate-500">How is our support team?</p>
                  </div>
                  <StarRating rating={serviceRating} onChange={setServiceRating} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Any Comments or Suggestions?</label>
                <textarea 
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none h-24"
                  placeholder="Tell us what you love or what we can improve..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center justify-center"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Review'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HelpSupport;
