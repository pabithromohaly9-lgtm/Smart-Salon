
import React, { useState, useEffect, useRef } from 'react';
import { User, Salon, AppNotification, Service, Booking } from '../types';
import { getDB, updateUser, deleteUser, createBooking, markNotificationsAsRead, updateBookingStatus, addNotification, checkMonthlyPaymentStatus, compressImage } from '../services/storage';
import SalonDetails from './SalonDetails';
import ServiceSelection from './ServiceSelection';
import DateTimePicker from './DateTimePicker';
import BookingSummary from './BookingSummary';
import BookingSuccess from './BookingSuccess';

interface UserHomeProps {
  user: User;
  onLogout: () => void;
}

type Tab = 'SALONS' | 'BOOKINGS' | 'PROFILE';
type FilterCategory = 'ALL' | 'TOP_RATED' | 'POPULAR' | 'BUDGET';

const UserHome: React.FC<UserHomeProps> = ({ user: initialUser, onLogout }) => {
  const [db, setDb] = useState(getDB());
  const [user, setUser] = useState<User>(initialUser);
  const [activeTab, setActiveTab] = useState<Tab>('SALONS');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAppInfo, setShowAppInfo] = useState(false);
  
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [showServiceSelection, setShowServiceSelection] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [showBookingSummary, setShowBookingSummary] = useState(false);
  const [finalBooking, setFinalBooking] = useState<Booking | null>(null);
  
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editAddress, setEditAddress] = useState(user.address || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshLocalDB();
    const handleUpdate = () => refreshLocalDB();
    window.addEventListener('smart_salon_db_updated', handleUpdate);
    return () => window.removeEventListener('smart_salon_db_updated', handleUpdate);
  }, []);

  const refreshLocalDB = () => {
    const updatedDb = getDB();
    setDb(updatedDb);
    setNotifications(updatedDb.notifications.filter(n => n.userId === user.id));
  };

  const approvedSalons = db.salons
    .filter(s => {
      if (s.status !== 'approved' || !s.isActive) return false;
      const paymentStatus = checkMonthlyPaymentStatus(s.ownerId);
      return !paymentStatus.isSuspended;
    })
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));
  
  const filteredSalons = approvedSalons.filter(s => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      s.name.toLowerCase().includes(searchLower) || 
      s.location.toLowerCase().includes(searchLower) ||
      s.ownerName.toLowerCase().includes(searchLower);
    
    if (activeFilter === 'TOP_RATED') return matchesSearch && s.rating >= 4.8;
    if (activeFilter === 'POPULAR') return matchesSearch && s.rating >= 4.5;
    if (activeFilter === 'BUDGET') {
      const minPrice = s.services.length > 0 ? Math.min(...s.services.map(ser => ser.price)) : 9999;
      return matchesSearch && minPrice <= 200;
    }
    return matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleUpdateProfile = () => {
    const updated = updateUser({ name: editName, phone: editPhone, address: editAddress });
    if (updated) {
      setUser(updated);
      alert('প্রোফাইল আপডেট সফল হয়েছে!');
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 400, 400);
        const updated = updateUser({ avatar: compressed });
        if (updated) setUser(updated);
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = () => {
    deleteUser(user.id);
    onLogout();
  };

  const handleServicesSelected = (services: Service[]) => {
    setSelectedServices(services);
    setShowDateTimePicker(true);
  };

  const handleDateTimeSelected = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setShowBookingSummary(true);
  };

  const handleBookingConfirmed = (userName: string, userPhone: string) => {
    if (!selectedSalon) return;
    if (userName !== user.name || userPhone !== user.phone) {
      const updated = updateUser({ name: userName, phone: userPhone });
      if (updated) setUser(updated);
    }

    const bookingData = {
      userId: user.id,
      salonId: selectedSalon.id,
      serviceIds: selectedServices.map(s => s.id),
      date: selectedDate,
      time: selectedTime,
      totalPrice: selectedServices.reduce((acc, curr) => acc + curr.price, 0)
    };

    try {
      const booking = createBooking(bookingData);
      setFinalBooking(booking);
    } catch (error: any) {
      if (error.message === 'DUPLICATE_BOOKING') {
        alert('দুঃখিত! এই সময়টি ইতিমধ্যে বুক হয়ে গেছে। অন্য সময় পছন্দ করুন।');
        setShowBookingSummary(false);
        setShowDateTimePicker(true);
      } else {
        alert('সমস্যা হয়েছে, আবার চেষ্টা করুন।');
      }
    }
  };

  const closeBookingFlow = () => {
    setFinalBooking(null);
    setShowBookingSummary(false);
    setShowDateTimePicker(false);
    setShowServiceSelection(false);
    setSelectedSalon(null);
    setActiveTab('BOOKINGS');
  };

  const toggleNotifications = () => {
    if (showNotifications) markNotificationsAsRead(user.id);
    setShowNotifications(!showNotifications);
  };

  const handleCancelBooking = (bookingId: string) => {
    const booking = db.bookings.find(b => b.id === bookingId);
    const salon = db.salons.find(s => s.id === booking?.salonId);
    if (confirm('আপনি কি নিশ্চিত যে বুকিংটি বাতিল করতে চান?')) {
      updateBookingStatus(bookingId, 'REJECTED');
      if (salon) addNotification(salon.ownerId, 'বুকিং বাতিল', `কাস্টমার ${user.name} তার বুকিং বাতিল করেছেন।`);
      alert('বাতিল করা হয়েছে।');
    }
  };

  const renderAppInfo = () => (
    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="absolute inset-x-0 bottom-0 top-0 bg-slate-900 border-t border-white/5 rounded-t-[48px] md:top-20 md:inset-x-20 md:rounded-[48px] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-500 overflow-hidden">
        <div className="px-8 pt-10 pb-6 flex justify-between items-center shrink-0 border-b border-white/5">
          <div>
            <h2 className="text-3xl font-black text-white">ইউজার গাইডলাইন</h2>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">Smart Salon ব্যবহারের পূর্ণাঙ্গ নিয়মাবলী</p>
          </div>
          <button onClick={() => setShowAppInfo(false)} className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 active:scale-90 transition-all">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-24">
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-amber-500 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 text-sm font-black">১</div>
              বুকিং করার নিয়ম
            </h3>
            <div className="bg-slate-950/40 p-6 rounded-3xl border border-slate-800 space-y-3 shadow-inner">
              <p className="text-slate-400 text-sm leading-relaxed"><span className="text-white font-bold">ধাপ ১:</span> হোম পেজ থেকে আপনার পছন্দের এলাকা বা সেলুনটি খুঁজে বের করুন।</p>
              <p className="text-slate-400 text-sm leading-relaxed"><span className="text-white font-bold">ধাপ ২:</span> আপনার প্রয়োজনীয় সার্ভিসগুলো সিলেক্ট করে 'পরবর্তী' বাটনে ক্লিক করুন।</p>
              <p className="text-slate-400 text-sm leading-relaxed"><span className="text-white font-bold">ধাপ ৩:</span> তারিখ এবং সময় পছন্দ করে আপনার বুকিংটি কনফার্ম করুন।</p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold text-emerald-500 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-sm font-black">২</div>
              যোগাযোগ ও সহায়তা
            </h3>
            <div className="bg-slate-950/40 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-inner">
              <p className="text-slate-400 text-sm leading-relaxed">
                বুকিং সম্পন্ন হওয়ার পর আপনি সরাসরি সেলুন ওনারের সাথে <span className="text-indigo-400 font-bold">কল</span> বা <span className="text-emerald-500 font-bold">হোয়াটসঅ্যাপের</span> মাধ্যমে যোগাযোগ করতে পারবেন। সেলুন ডিটেইলস পেজে এই অপশনগুলো পাওয়া যাবে।
              </p>
              <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                <p className="text-amber-500/80 text-[11px] font-black uppercase tracking-tight flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  টিপস: পেমেন্ট বা সিরিয়াল নিয়ে কোনো কনফিউশন থাকলে আগে কল দিয়ে নিশ্চিত হয়ে নিন।
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold text-red-500 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 text-sm font-black">৩</div>
              বাতিলকরণ ও সতর্কতা
            </h3>
            <div className="bg-red-500/5 p-6 rounded-3xl border border-red-500/20 space-y-4 shadow-inner">
              <p className="text-slate-300 text-sm font-bold">বুকিং বাতিল করার শর্তাবলী:</p>
              <ul className="space-y-3 text-sm text-slate-400 list-disc pl-5">
                <li>বুকিং করার পর <span className="text-white font-bold">৬০ মিনিটের মধ্যে</span> অ্যাপ থেকে ফ্রিতে বাতিল করা যাবে।</li>
                <li>নির্ধারিত সময়ের কমপক্ষে ১ ঘণ্টা আগে মালিককে ইনফর্ম করা বাধ্যতামূলক।</li>
                <li><span className="text-red-500 font-black">সতর্কবার্তা:</span> পরপর ৩ বার বুকিং দিয়ে উপস্থিত না থাকলে আপনার অ্যাকাউন্টটি সিস্টেম থেকে স্বয়ংক্রিয়ভাবে ব্লক করে দেওয়া হবে।</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4 pb-10">
             <h3 className="text-xl font-bold text-indigo-400 flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-indigo-400/10 flex items-center justify-center text-indigo-400 text-sm font-black">৪</div>
               রেটিং ও রিভিউ
             </h3>
             <p className="text-slate-400 text-sm leading-relaxed bg-slate-950/40 p-6 rounded-3xl border border-slate-800 shadow-inner">
               সার্ভিস নেওয়ার পর অবশ্যই সেলুনটিকে রেটিং দিন। আপনার একটি মূল্যবান রিভিউ অন্য ইউজারদের সঠিক সেলুন খুঁজে পেতে এবং কোয়ালিটি যাচাই করতে সাহায্য করবে।
             </p>
          </section>
        </div>
      </div>
    </div>
  );

  const renderSalonsTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <input 
            type="text"
            placeholder="এলাকা, সেলুন বা মালিকের নাম..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg className="w-6 h-6 absolute left-4 top-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {/* Filter System */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'ALL', label: 'সবগুলো' },
            { id: 'TOP_RATED', label: 'সেরা রেটিং (৪.৮+)' },
            { id: 'POPULAR', label: 'জনপ্রিয়' },
            { id: 'BUDGET', label: 'সাশ্রয়ী (৳২০০-)' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as FilterCategory)}
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                activeFilter === f.id 
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_5px_15px_rgba(245,158,11,0.3)]' 
                : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">আপনার পছন্দের সেলুনসমূহ</h2>
        <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest">ফলাফল: {filteredSalons.length}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 pb-12">
        {filteredSalons.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[40px]">
             <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">এই ফিল্টারে কোনো সেলুন পাওয়া যায়নি</p>
          </div>
        ) : (
          filteredSalons.map(salon => (
            <div 
              key={salon.id} 
              onClick={() => setSelectedSalon(salon)}
              className="bg-slate-900/40 backdrop-blur-sm rounded-[36px] overflow-hidden border border-slate-800 group transition-all hover:border-amber-500/30 hover:shadow-2xl cursor-pointer"
            >
              <div className="h-60 relative overflow-hidden">
                <img src={salon.image} alt={salon.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                <div className="absolute top-4 right-4 bg-slate-950/60 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/10 shadow-xl">
                  <span className="text-amber-400 text-sm">★</span>
                  <span className="text-white text-sm font-black">{salon.rating}</span>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-amber-500 text-slate-950 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">{salon.location}</span>
                </div>
              </div>
              <div className="p-7">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-2xl font-black text-white group-hover:text-amber-400 transition-colors leading-tight">{salon.name}</h3>
                  <div className="flex flex-col items-end">
                    <p className="text-[8px] text-slate-500 uppercase font-bold">মালিক</p>
                    <p className="text-[10px] text-slate-300 font-bold">{salon.ownerName}</p>
                  </div>
                </div>
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 mb-8">
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  প্রিমিয়াম সার্ভিস ও দক্ষ কারিগর
                </p>
                <button className="w-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 py-5 rounded-3xl font-black active:scale-95 uppercase tracking-widest text-[11px] shadow-lg">
                  বুকিং শুরু করুন
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderBookingsTab = () => {
    const userBookings = [...db.bookings].filter(b => b.userId === user.id).reverse();
    const allSalons = db.salons;
    
    if (userBookings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-32 h-32 bg-slate-900 rounded-[48px] flex items-center justify-center mb-8 border border-slate-800 shadow-inner group">
            <svg className="w-14 h-14 text-slate-700 group-hover:text-amber-500/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="text-2xl font-black mb-3 text-slate-100 uppercase tracking-tight">কোনো বুকিং নেই</h2>
          <button onClick={() => setActiveTab('SALONS')} className="mt-10 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black py-4 px-10 rounded-3xl active:scale-95 uppercase tracking-widest text-xs">সেলুন খুঁজুন</button>
        </div>
      );
    }

    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">বুকিং হিস্ট্রি</h2>
          <div className="px-4 py-1.5 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
             <span className="text-[10px] font-black text-amber-500 tracking-widest uppercase">{userBookings.length} টি অ্যাপয়েন্টমেন্ট</span>
          </div>
        </div>

        <div className="space-y-5">
          {userBookings.map(b => {
            const salon = allSalons.find(s => s.id === b.salonId);
            const bookingServices = salon?.services.filter(s => b.serviceIds.includes(s.id)) || [];
            const createdAtTime = new Date(b.createdAt || Date.now()).getTime();
            const timeDiffHours = (new Date().getTime() - createdAtTime) / (1000 * 60 * 60);
            const canCancel = b.status === 'PENDING' && timeDiffHours < 1;

            return (
              <div key={b.id} className="group relative bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 p-6 rounded-[40px] transition-all hover:border-amber-500/30 overflow-hidden shadow-xl">
                <div className="flex justify-between items-start relative z-10 mb-6">
                  <div className="flex gap-5">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-800 shrink-0">
                      <img src={salon?.image} alt={salon?.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-xl leading-tight group-hover:text-amber-400 transition-colors">{salon?.name || 'অজানা সেলুন'}</h3>
                      <p className="text-slate-500 text-xs font-bold flex items-center gap-2 mt-2 uppercase tracking-wide">
                        {new Date(b.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' })} • {b.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest whitespace-nowrap ${
                       b.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                       b.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                       b.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                       'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {b.status === 'PENDING' ? 'পেন্ডিং' : b.status === 'CONFIRMED' ? 'গৃহীত' : b.status === 'REJECTED' ? 'বাতিল' : 'সম্পন্ন'}
                    </span>
                    {canCancel && <button onClick={() => handleCancelBooking(b.id)} className="text-[10px] font-black text-red-500 uppercase tracking-widest px-2 py-1 bg-red-500/10 rounded-lg border border-red-500/20 active:scale-90">বাতিল করুন</button>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {bookingServices.map(s => (
                    <span key={s.id} className="px-3 py-1.5 bg-slate-950/40 rounded-xl text-[10px] font-bold text-slate-400 border border-slate-800/50 uppercase tracking-wider">{s.name}</span>
                  ))}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent w-full mb-6"></div>

                <div className="flex justify-between items-center relative z-10">
                   <div className="text-left">
                      <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em]">বুকিং আইডি</p>
                      <p className="text-slate-500 font-mono text-xs mt-0.5">#{b.id.slice(-8)}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em]">মোট খরচ</p>
                      <p className="text-amber-500 font-black text-2xl mt-0.5 tracking-tight">৳ {b.totalPrice}</p>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderProfileTab = () => (
    <div className="space-y-8 pb-10 flex flex-col items-center">
      <div className="relative group mb-8">
        <div className="w-36 h-36 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 rounded-full p-1.5 shadow-2xl">
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden border-4 border-slate-950">
            {isCompressing ? <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent"></div> : (user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" /> : <svg className="w-16 h-16 text-slate-800" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>)}
          </div>
        </div>
        <button onClick={handleAvatarClick} disabled={isCompressing} className="absolute bottom-1 right-1 w-11 h-11 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 border-4 border-slate-950 shadow-xl active:scale-90 transition-all disabled:opacity-50"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
      </div>
      <div className="bg-slate-900/60 p-8 rounded-[48px] border border-slate-800 space-y-6 shadow-2xl w-full max-w-lg mx-auto">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">আপনার নাম</label>
          <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white outline-none font-bold" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">ফোন নাম্বার</label>
          <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white outline-none font-bold" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">ঠিকানা</label>
          <input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white outline-none font-bold" />
        </div>
        <button onClick={handleUpdateProfile} className="w-full bg-slate-100 text-slate-950 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all">প্রোফাইল সেভ করুন</button>
      </div>

      <div className="w-full max-w-lg mx-auto mt-6 space-y-4 px-6">
        <button 
          onClick={onLogout} 
          className="w-full bg-gradient-to-r from-red-600/20 to-red-600/10 border border-red-500/30 text-red-500 font-black py-5 rounded-[32px] flex items-center justify-center gap-3 active:scale-95 transition-all text-[12px] uppercase tracking-[0.2em] shadow-xl"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          লগআউট করুন
        </button>
        <button onClick={() => setShowDeleteConfirm(true)} className="w-full bg-slate-950 border border-slate-800/40 text-slate-600 font-bold py-3 rounded-2xl text-[9px] uppercase tracking-widest active:scale-95 transition-all">একাউন্ট ডিলিট করুন</button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="bg-slate-900 border border-slate-800 p-10 rounded-[48px] max-w-sm w-full text-center space-y-8">
              <h3 className="text-2xl font-black text-white">আপনি কি নিশ্চিত?</h3>
              <p className="text-slate-400 text-sm">একাউন্ট ডিলিট করলে আপনার সব তথ্য এবং বুকিং হিস্ট্রি চিরতরে মুছে যাবে।</p>
              <div className="flex flex-col gap-3">
                 <button onClick={handleDeleteAccount} className="bg-red-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs">হ্যাঁ, ডিলিট করুন</button>
                 <button onClick={() => setShowDeleteConfirm(false)} className="text-slate-500 font-bold py-2">ফিরে যান</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-['Hind_Siliguri']">
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl px-6 py-4 flex justify-between items-center border-b border-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-slate-950" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm1,14H11V13h2Zm0-5H11V7h2Z"/></svg>
          </div>
          <div><h1 className="text-lg font-black gradient-gold tracking-tighter leading-none">Smart Salon</h1><p className="text-[8px] text-slate-600 uppercase font-black tracking-widest mt-1">প্রিমিয়াম সেলুন বুকিং</p></div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAppInfo(true)} className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center active:scale-90"><svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
          <button onClick={toggleNotifications} className="relative w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center active:scale-90"><svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>{unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-600 rounded-full border border-slate-950 flex items-center justify-center text-[8px] font-black">{unreadCount}</span>}</button>
          <div onClick={() => setActiveTab('PROFILE')} className={`w-10 h-10 rounded-xl border-2 overflow-hidden cursor-pointer active:scale-90 transition-all shadow-lg ${activeTab === 'PROFILE' ? 'border-amber-500' : 'border-slate-800'}`}>{user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500 font-bold">{user.name.charAt(0)}</div>}</div>
        </div>
      </header>

      {showNotifications && (
        <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="absolute inset-x-0 top-0 bg-slate-900/90 border-b border-white/5 rounded-b-[48px] max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-top-full duration-500">
            <div className="px-8 pt-10 pb-6 flex justify-between items-center shrink-0"><div><h2 className="text-3xl font-black text-white">নোটিফিকেশন</h2></div><button onClick={toggleNotifications} className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 active:scale-90 transition-all"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <div className="flex-1 overflow-y-auto px-6 pb-12 space-y-4">
              {notifications.length === 0 ? <div className="py-20 text-center opacity-30"><p className="font-black uppercase tracking-widest text-xs">কোনো নোটিফিকেশন নেই</p></div> : notifications.map(n => (
                  <div key={n.id} className={`p-6 rounded-[32px] border transition-all ${!n.isRead ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-950/40 border-slate-800/50 opacity-60'}`}><h3 className={`font-black text-base ${!n.isRead ? 'text-amber-500' : 'text-slate-200'}`}>{n.title}</h3><p className="text-slate-400 text-sm">{n.message}</p></div>
                ))}
            </div>
          </div>
        </div>
      )}

      {showAppInfo && renderAppInfo()}

      <main className="flex-1 px-6 pt-6 overflow-y-auto">
        {activeTab === 'SALONS' && renderSalonsTab()}
        {activeTab === 'BOOKINGS' && renderBookingsTab()}
        {activeTab === 'PROFILE' && renderProfileTab()}
      </main>

      {selectedSalon && !showServiceSelection && (
        <SalonDetails 
          salon={selectedSalon} 
          onBack={() => setSelectedSalon(null)} 
          onBookNow={() => setShowServiceSelection(true)} 
        />
      )}

      {showServiceSelection && selectedSalon && !showDateTimePicker && (
        <ServiceSelection 
          salon={selectedSalon} 
          onBack={() => setShowServiceSelection(false)} 
          onConfirm={handleServicesSelected} 
        />
      )}

      {showDateTimePicker && selectedSalon && !showBookingSummary && (
        <DateTimePicker 
          salon={selectedSalon} 
          onBack={() => setShowDateTimePicker(false)} 
          onConfirm={handleDateTimeSelected} 
        />
      )}

      {showBookingSummary && selectedSalon && !finalBooking && (
        <BookingSummary 
          salon={selectedSalon} 
          services={selectedServices} 
          date={selectedDate} 
          time={selectedTime} 
          user={user} 
          onBack={() => setShowBookingSummary(false)} 
          onConfirm={handleBookingConfirmed} 
        />
      )}

      {finalBooking && selectedSalon && (
        <BookingSuccess 
          salon={selectedSalon} 
          booking={finalBooking} 
          services={selectedServices} 
          userName={user.name} 
          onDone={closeBookingFlow} 
        />
      )}

      <nav className="fixed bottom-6 left-6 right-6 h-20 bg-slate-900/95 backdrop-blur-2xl border border-white/5 rounded-[32px] flex justify-around items-center px-2 shadow-2xl z-50">
        {[
          { id: 'SALONS', label: 'হোম', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
          { id: 'BOOKINGS', label: 'বুকিং', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
          { id: 'PROFILE', label: 'প্রোফাইল', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> }
        ].map(nav => (
          <button key={nav.id} onClick={() => setActiveTab(nav.id as Tab)} className={`flex flex-col items-center gap-1 transition-all flex-1 ${activeTab === nav.id ? 'text-amber-400' : 'text-slate-600'}`}><div className={`w-12 h-10 rounded-2xl flex items-center justify-center transition-all ${activeTab === nav.id ? 'bg-amber-400/10' : ''}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{nav.icon}</svg></div><span className="text-[9px] font-black uppercase tracking-widest">{nav.label}</span></button>
        ))}
      </nav>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </div>
  );
};

export default UserHome;
