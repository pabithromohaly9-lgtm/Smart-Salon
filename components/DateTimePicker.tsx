
import React, { useState, useEffect } from 'react';
import { Salon } from '../types.ts';
import { getDB } from '../services/storage.ts';

interface DateTimePickerProps {
  salon: Salon;
  onBack: () => void;
  onConfirm: (date: string, time: string) => void;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ salon, onBack, onConfirm }) => {
  const [selectedDateIdx, setSelectedDateIdx] = useState<number>(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    refreshBookedSlots();
  }, [selectedDateIdx]);

  const refreshBookedSlots = () => {
    const db = getDB();
    const targetDate = dates[selectedDateIdx].toISOString().split('T')[0];
    const salonBookings = db.bookings.filter(b => 
      b.salonId === salon.id && 
      b.date === targetDate && 
      b.status !== 'REJECTED'
    );
    setBookedSlots(salonBookings.map(b => b.time));
    if (selectedTime && salonBookings.some(b => b.time === selectedTime)) {
      setSelectedTime(null);
    }
  };

  const timeSegments = [
    { label: 'সকাল', icon: '☀️', range: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'] },
    { label: 'দুপুর', icon: '⛅', range: ['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'] },
    { label: 'রাত', icon: '🌙', range: ['06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM'] }
  ];

  const isSlotDisabled = (timeStr: string) => {
    const isBooked = bookedSlots.includes(timeStr);
    if (isBooked) return true;

    // 1-hour buffer logic for today
    const now = new Date();
    const targetDate = dates[selectedDateIdx];
    const isToday = targetDate.toDateString() === now.toDateString();

    if (isToday) {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const slotDate = new Date(now);
      slotDate.setHours(hours, minutes, 0, 0);

      // Disable if slot is less than 1 hour from now
      const bufferTime = now.getTime() + (60 * 60 * 1000);
      if (slotDate.getTime() < bufferTime) return true;
    }

    return false;
  };

  const formatDateBn = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    return date.toLocaleDateString('bn-BD', options);
  };

  const getDayBn = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short' };
    return date.toLocaleDateString('bn-BD', options);
  };

  const handleNext = () => {
    if (!selectedTime) {
      alert('দয়া করে একটি সময় পছন্দ করুন');
      return;
    }
    onConfirm(dates[selectedDateIdx].toISOString().split('T')[0], selectedTime);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col">
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
          <h1 className="text-xl font-bold text-white">তারিখ ও সময়</h1>
          <p className="text-indigo-200 text-xs">{salon.name}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pt-10 pb-32">
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4 text-slate-100 ml-1">তারিখ পছন্দ করুন</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {dates.map((date, idx) => {
              const isActive = selectedDateIdx === idx;
              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedDateIdx(idx)}
                  className={`min-w-[70px] flex flex-col items-center p-4 rounded-3xl border-2 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-amber-500 border-amber-500 shadow-lg shadow-amber-900/30 text-slate-950' 
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className={`text-xs font-bold mb-1 ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>{getDayBn(date)}</span>
                  <span className="text-xl font-bold">{date.getDate()}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-lg font-bold text-slate-100 ml-1">সময় পছন্দ করুন</h2>
          
          {timeSegments.map((segment) => (
            <div key={segment.label} className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-xl">{segment.icon}</span>
                <span className="font-bold text-sm tracking-widest uppercase">{segment.label}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {segment.range.map(time => {
                  const isActive = selectedTime === time;
                  const disabled = isSlotDisabled(time);
                  const isBooked = bookedSlots.includes(time);
                  
                  return (
                    <button
                      key={time}
                      disabled={disabled}
                      onClick={() => setSelectedTime(time)}
                      className={`py-3 rounded-2xl border-2 font-medium transition-all relative ${
                        disabled
                          ? 'bg-slate-900/20 border-slate-800 text-slate-800 cursor-not-allowed opacity-50'
                          : isActive 
                            ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-900/20' 
                            : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {time}
                      {isBooked && (
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-950/80 backdrop-blur-2xl border-t border-white/5 z-[110]">
        <div className="flex justify-between items-center mb-4 px-2">
           <div className="flex flex-col">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">আপনার পছন্দ</p>
              <p className="text-white font-bold">{formatDateBn(dates[selectedDateIdx])}</p>
           </div>
           <div className="text-right">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">সময়</p>
              <p className="text-amber-500 font-bold">{selectedTime || '--:--'}</p>
           </div>
        </div>
        <button 
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 py-5 rounded-[24px] font-bold text-xl transition shadow-xl shadow-amber-900/20 active:scale-95"
        >
          পরবর্তী
        </button>
      </div>
    </div>
  );
};

export default DateTimePicker;
