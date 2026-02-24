
import React from 'react';
import { Salon, Booking, Service } from '../types.ts';

interface BookingSuccessProps {
  salon: Salon;
  booking: Booking;
  services: Service[];
  userName: string;
  onDone: () => void;
}

const BookingSuccess: React.FC<BookingSuccessProps> = ({ salon, booking, services, userName, onDone }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
      <div className="mb-8 relative shrink-0">
        <div className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center animate-pulse">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 scale-110">
            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-400 rounded-full border-4 border-slate-950 flex items-center justify-center shadow-lg animate-bounce">
           <span className="text-xl">✨</span>
        </div>
      </div>

      <h1 className="text-3xl font-black text-white mb-2 tracking-tight">বুকিং সফল হয়েছে!</h1>
      <p className="text-slate-400 mb-10 leading-relaxed font-medium">
        আপনার বুকিং রিকোয়েস্টটি "{salon.name}"-এ পাঠানো হয়েছে। ওনার খুব শীঘ্রই আপনার সাথে যোগাযোগ করবেন।
      </p>

      <div className="w-full max-w-xs space-y-4 mb-12">
        <button 
          onClick={onDone}
          className="w-full bg-slate-100 text-slate-950 py-5 rounded-[24px] font-black transition-all active:scale-95 shadow-xl uppercase tracking-widest text-xs"
        >
          ফিরে যান
        </button>
      </div>

      <div className="bg-slate-900/50 p-6 rounded-[32px] border border-slate-800/50 w-full max-w-sm shadow-inner">
         <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] mb-3">বুকিং রেফারেন্স আইডি</p>
         <p className="text-amber-500/80 font-mono text-base bg-slate-950/50 py-3 rounded-xl border border-white/5 uppercase">#{booking.id.slice(-8)}</p>
      </div>
    </div>
  );
};

export default BookingSuccess;
