import React, { useState } from 'react';
import { Salon, Service } from '../types.ts';

interface ServiceSelectionProps {
  salon: Salon;
  onBack: () => void;
  onConfirm: (services: Service[]) => void;
}

const ServiceSelection: React.FC<ServiceSelectionProps> = ({ salon, onBack, onConfirm }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleService = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const totalAmount = salon.services
    .filter(s => selectedIds.includes(s.id))
    .reduce((acc, curr) => acc + curr.price, 0);

  const handleConfirm = () => {
    if (selectedIds.length === 0) {
      alert('দয়া করে অন্তত একটি সার্ভিস পছন্দ করুন');
      return;
    }
    const selectedServices = salon.services.filter(s => selectedIds.includes(s.id));
    onConfirm(selectedServices);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950 flex flex-col">
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
          <h1 className="text-xl font-bold text-white">সার্ভিস পছন্দ করুন</h1>
          <p className="text-indigo-200 text-xs">{salon.name}</p>
        </div>
      </header>

      {/* Service List */}
      <div className="flex-1 overflow-y-auto px-6 pt-10 pb-32">
        <div className="space-y-4">
          {salon.services.map(service => {
            const isSelected = selectedIds.includes(service.id);
            return (
              <div 
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={`p-4 rounded-[28px] border-2 transition-all cursor-pointer flex items-center gap-4 ${
                  isSelected 
                    ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-900/5' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/5">
                  <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1">
                  <h3 className={`font-bold text-lg leading-tight transition-colors ${isSelected ? 'text-amber-500' : 'text-slate-200'}`}>
                    {service.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-amber-400 font-bold">৳ {service.price}</p>
                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                    <p className="text-slate-500 text-sm">{service.duration} মিনিট</p>
                  </div>
                </div>

                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                  isSelected ? 'bg-amber-500 border-amber-500' : 'border-slate-700'
                }`}>
                  {isSelected && (
                    <svg className="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary & Confirm */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-950/80 backdrop-blur-2xl border-t border-white/5 z-[90]">
        <div className="flex justify-between items-center mb-4 px-2">
           <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">মোট খরচ</p>
              <p className="text-2xl font-bold text-white">৳ {totalAmount}</p>
           </div>
           <div className="text-right">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">সার্ভিস</p>
              <p className="text-lg font-bold text-amber-500">{selectedIds.length} টি</p>
           </div>
        </div>
        <button 
          onClick={handleConfirm}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 py-5 rounded-[24px] font-bold text-xl transition shadow-xl shadow-amber-900/20 active:scale-95"
        >
          পরবর্তী
        </button>
      </div>
    </div>
  );
};

export default ServiceSelection;