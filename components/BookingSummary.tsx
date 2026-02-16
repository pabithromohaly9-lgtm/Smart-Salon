
import React, { useState } from 'react';
import { Salon, Service, User } from '../types.ts';

interface BookingSummaryProps {
  salon: Salon;
  services: Service[];
  date: string;
  time: string;
  user: User;
  onBack: () => void;
  onConfirm: (userName: string, userPhone: string) => void;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({ salon, services, date, time, user, onBack, onConfirm }) => {
  const [userName, setUserName] = useState(user.name);
  const [userPhone, setUserPhone] = useState(user.phone);
  const [isCommitted, setIsCommitted] = useState(false);

  const totalPrice = services.reduce((acc, curr) => acc + curr.price, 0);

  const formatDateBn = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleFinalConfirm = () => {
    if (!isCommitted) return;
    
    // Proceed with internal confirmation without WhatsApp trigger
    onConfirm(userName, userPhone);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950 flex flex-col overflow-y-auto">
      {/* Header */}
      <header className="px-6 py-8 flex items-center gap-4 bg-premium rounded-b-[40px] shadow-2xl shrink-0">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">বুকিং সারাংশ</h1>
          <p className="text-indigo-200 text-xs">আপনার তথ্য চেক করে নিন</p>
        </div>
      </header>

      <main className="flex-1 px-6 pt-10 pb-32 space-y-8">
        {/* Salon Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-[32px] flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/5">
            <img src={salon.image} alt={salon.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{salon.name}</h3>
            <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 mt-1">
               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               ভেরিফাইড সেলুন
            </p>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-6 shadow-2xl">
          <div className="space-y-3">
             <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">নির্বাচিত সার্ভিসসমূহ</h4>
             {services.map(s => (
               <div key={s.id} className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border border-slate-800/50">
                 <span className="text-slate-200 font-bold text-sm">{s.name}</span>
                 <span className="text-white font-black">৳ {s.price}</span>
               </div>
             ))}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1.5">তারিখ</p>
              <p className="text-slate-200 font-bold text-sm">{formatDateBn(date)}</p>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1.5">সময়</p>
              <p className="text-slate-200 font-bold text-sm">{time}</p>
            </div>
          </div>

          <div className="flex justify-between items-center px-2">
            <span className="text-amber-500 font-black text-xs uppercase tracking-widest">মোট খরচ</span>
            <span className="text-3xl font-black text-white tracking-tight">৳ {totalPrice}</span>
          </div>
        </div>

        {/* User Info Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-5 shadow-2xl">
           <h4 className="text-slate-100 font-black text-sm uppercase tracking-widest ml-1">আপনার যোগাযোগ তথ্য</h4>
           <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">আপনার নাম</label>
             <input 
               type="text" 
               className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all font-bold"
               value={userName}
               onChange={(e) => setUserName(e.target.value)}
             />
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">ফোন নাম্বার</label>
             <input 
               type="tel" 
               className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all font-bold"
               value={userPhone}
               onChange={(e) => setUserPhone(e.target.value)}
             />
           </div>
        </div>

        {/* Commitment Agreement */}
        <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-[32px] space-y-4 shadow-xl">
           <div className="flex items-start gap-3">
              <button 
                onClick={() => setIsCommitted(!isCommitted)}
                className={`w-7 h-7 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all ${isCommitted ? 'bg-amber-500 border-amber-500 shadow-lg' : 'bg-slate-950 border-slate-700'}`}
              >
                 {isCommitted && <svg className="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
              </button>
              <div>
                 <p className="text-slate-100 font-black text-[13px] leading-tight mb-1">আমি সময়মতো সেলুনে উপস্থিত হওয়ার অঙ্গীকার করছি।</p>
                 <p className="text-slate-500 text-[10px] font-medium italic">সতর্কতা: ৩ বার বুকিং দিয়ে উপস্থিত না হলে একাউন্ট চিরতরে ব্লক হতে পারে।</p>
              </div>
           </div>
        </div>
      </main>

      {/* Footer Confirm */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-950/80 backdrop-blur-2xl border-t border-white/5 z-[130]">
        <button 
          onClick={handleFinalConfirm}
          disabled={!isCommitted}
          className={`w-full py-6 rounded-[32px] font-black text-xl transition shadow-xl uppercase tracking-widest ${
            isCommitted 
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-amber-900/30 active:scale-95' 
            : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
          }`}
        >
          বুকিং কনফার্ম করুন
        </button>
      </div>
    </div>
  );
};

export default BookingSummary;
