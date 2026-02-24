
import React, { useState, useEffect } from 'react';
import { Salon, Review, User } from '../types';
import { getDB, addReview, getCurrentUser } from '../services/storage';

interface SalonDetailsProps {
  salon: Salon;
  onBack: () => void;
  onBookNow: () => void;
}

const SalonDetails: React.FC<SalonDetailsProps> = ({ salon: initialSalon, onBack, onBookNow }) => {
  const [salon, setSalon] = useState(initialSalon);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    refreshReviews();
  }, [salon.id]);

  const refreshReviews = () => {
    const db = getDB();
    const salonReviews = db.reviews.filter(r => r.salonId === salon.id);
    setReviews(salonReviews);
    const updatedSalon = db.salons.find(s => s.id === salon.id);
    if (updatedSalon) setSalon(updatedSalon);
  };

  const handleSocialClick = (link: string | undefined) => {
    if (link) {
      const url = link.startsWith('http') ? link : `https://${link}`;
      window.open(url, '_blank');
    }
  };

  const handleWhatsApp = () => {
    const waLink = salon.socialLinks?.whatsapp || `https://wa.me/880${salon.ownerPhone.startsWith('0') ? salon.ownerPhone.substring(1) : salon.ownerPhone}`;
    window.open(waLink, '_blank');
  };

  const handleCall = () => {
    window.open(`tel:${salon.ownerPhone}`, '_self');
  };

  const handleSubmitReview = () => {
    if (!user) return alert('দয়া করে লগইন করুন');
    if (newRating === 0) return alert('দয়া করে একটি রেটিং দিন');
    if (!newComment.trim()) return alert('দয়া করে আপনার মন্তব্য লিখুন');

    setIsSubmitting(true);
    addReview({
      salonId: salon.id,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      rating: newRating,
      comment: newComment
    });

    setNewRating(0);
    setNewComment('');
    setIsSubmitting(false);
    refreshReviews();
  };

  const hasAnySocial = salon.socialLinks?.facebook || salon.socialLinks?.instagram || salon.socialLinks?.whatsapp;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col overflow-y-auto pb-24 animate-in slide-in-from-bottom duration-500">
      {/* Lightbox / Fullscreen Image Viewer */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <button 
            onClick={() => setFullscreenImage(null)}
            className="absolute top-10 right-10 w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white active:scale-90 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src={fullscreenImage} className="max-w-full max-h-[90vh] object-contain rounded-3xl shadow-[0_0_50px_rgba(251,191,36,0.3)] border border-amber-500/20" alt="Full view" />
        </div>
      )}

      <div className="relative h-[350px] w-full shrink-0">
        <img src={salon.image} alt={salon.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/40"></div>
        
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all z-20"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="absolute top-6 right-6 px-4 py-2 bg-amber-500 rounded-2xl flex items-center gap-1.5 shadow-lg shadow-amber-900/20 z-20">
          <span className="text-slate-900 font-black text-sm">★ {salon.rating}</span>
        </div>
      </div>

      <div className="px-6 -mt-16 relative z-10 flex-1">
        <div className="bg-slate-900/90 backdrop-blur-3xl border border-white/10 p-7 rounded-[48px] shadow-2xl space-y-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-2 leading-tight">{salon.name}</h1>
            <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {salon.location}
            </p>
          </div>

          <div className="space-y-6">
             <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-3xl border border-slate-800 group transition-all hover:border-indigo-500/30 shadow-inner">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest">সরাসরি যোগাযোগ</p>
                        <span className="text-slate-200 font-black text-base tracking-wider">{salon.ownerPhone}</span>
                      </div>
                   </div>
                   <button onClick={handleCall} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] uppercase tracking-widest px-6 py-3 rounded-2xl active:scale-95 transition-all shadow-lg shadow-indigo-900/20">কল দিন</button>
                </div>
                
                {hasAnySocial && (
                  <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">সোশ্যাল মিডিয়া</p>
                      <div className="flex gap-4">
                        {salon.socialLinks?.facebook && (
                          <button onClick={() => handleSocialClick(salon.socialLinks?.facebook)} className="group w-14 h-14 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-center transition-all hover:border-[#1877F2]/50 active:scale-90">
                             <svg className="w-8 h-8 text-[#1877F2] drop-shadow-lg group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                          </button>
                        )}
                        {salon.socialLinks?.instagram && (
                          <button onClick={() => handleSocialClick(salon.socialLinks?.instagram)} className="group w-14 h-14 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-center transition-all hover:border-[#ee2a7b]/50 active:scale-90">
                             <svg className="w-8 h-8 text-[#ee2a7b] drop-shadow-lg group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                          </button>
                        )}
                        <button onClick={handleWhatsApp} className="group w-14 h-14 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-center transition-all hover:border-[#25D366]/50 active:scale-90">
                           <svg className="w-8 h-8 text-[#25D366] drop-shadow-lg group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                        </button>
                      </div>
                  </div>
                )}
             </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-[32px] border border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10">
                <img src={salon.ownerPhoto} alt={salon.ownerName} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-0.5">মালিক</p>
                <p className="font-black text-slate-200 text-sm leading-tight">{salon.ownerName}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">আমাদের সম্পর্কে</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              আমরা সেরা সেবার প্রতিশ্রুতি দিই। আধুনিক যন্ত্রপাতি এবং দক্ষ কারিগর দ্বারা আপনাদের সেবায় আমরা নিয়োজিত। 
              {salon.name} আপনাদের পছন্দমতো সব ধরণের গ্রুমিং সার্ভিস প্রদান করে থাকে।
            </p>
          </div>

          {/* Portfolio Lookbook Section */}
          {salon.portfolio && salon.portfolio.length > 0 && (
            <div className="space-y-4">
               <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">লুকবুক (Portfolio)</h3>
               <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {salon.portfolio.map((img, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setFullscreenImage(img)}
                      className="min-w-[140px] h-[180px] rounded-3xl overflow-hidden border-2 border-amber-500/20 shadow-xl active:scale-95 transition-all cursor-pointer bg-slate-800"
                    >
                      <img src={img} className="w-full h-full object-cover" alt={`Work ${idx + 1}`} />
                    </div>
                  ))}
               </div>
            </div>
          )}

          <div className="space-y-8 pt-4">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight">রিভিউ ও রেটিং</h3>
                <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                   <span className="text-amber-500 font-black text-xs">★ {salon.rating}</span>
                   <span className="text-slate-500 text-[10px] font-black tracking-widest">({reviews.length})</span>
                </div>
             </div>

             <div className="bg-slate-950/60 rounded-[40px] p-8 border border-slate-800 shadow-inner space-y-6">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] text-center">আপনার অভিজ্ঞতা জানান</p>
                <div className="flex justify-center gap-3">
                   {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                         key={star} 
                         onClick={() => setNewRating(star)}
                         className={`text-3xl transition-all active:scale-90 ${newRating >= star ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)] scale-110' : 'text-slate-800'}`}
                      >
                         ★
                      </button>
                   ))}
                </div>
                <textarea 
                   rows={3}
                   placeholder="এখানে আপনার মতামত লিখুন..."
                   className="w-full bg-slate-900 border border-slate-800 rounded-3xl py-5 px-6 text-white focus:ring-2 focus:ring-amber-500/40 outline-none transition-all placeholder:text-slate-700 text-sm font-medium resize-none"
                   value={newComment}
                   onChange={(e) => setNewComment(e.target.value)}
                />
                <button 
                   onClick={handleSubmitReview}
                   disabled={isSubmitting}
                   className="w-full bg-slate-100 text-slate-950 font-black py-5 rounded-[28px] active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em]"
                >
                   {isSubmitting ? 'প্রসেসিং...' : 'সাবমিট করুন'}
                </button>
             </div>

             <div className="space-y-4">
                {reviews.length === 0 ? (
                   <div className="py-12 text-center bg-slate-950/30 rounded-[32px] border border-dashed border-slate-800">
                      <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest italic">এখনো কোনো রিভিউ নেই</p>
                   </div>
                ) : (
                   reviews.map(review => (
                      <div key={review.id} className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-[36px] transition-all hover:border-slate-700 group shadow-xl">
                         <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 overflow-hidden shrink-0">
                                  {review.userAvatar ? <img src={review.userAvatar} className="w-full h-full object-cover" /> : <span className="text-xs font-black text-slate-500">{review.userName.charAt(0)}</span>}
                               </div>
                               <div>
                                  <p className="font-black text-slate-200 text-sm leading-tight">{review.userName}</p>
                                  <div className="flex gap-0.5 mt-1">
                                     {[...Array(5)].map((_, i) => (
                                        <span key={i} className={`text-[10px] ${i < review.rating ? 'text-amber-500' : 'text-slate-800'}`}>★</span>
                                     ))}
                                  </div>
                               </div>
                            </div>
                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1">
                               {new Date(review.createdAt).toLocaleDateString('bn-BD')}
                            </span>
                         </div>
                         <p className="text-slate-400 text-sm font-medium leading-relaxed px-1">{review.comment}</p>
                      </div>
                   ))
                )}
             </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-950/80 backdrop-blur-3xl border-t border-white/5 z-[70] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <button 
          onClick={onBookNow}
          className="w-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 py-6 rounded-[32px] font-black text-xl transition-all shadow-[0_15px_30px_-10px_rgba(217,119,6,0.4)] active:scale-95 uppercase tracking-widest"
        >
          বুকিং শুরু করুন
        </button>
      </div>
    </div>
  );
};

export default SalonDetails;
