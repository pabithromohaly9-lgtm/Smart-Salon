
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { User, Salon, Booking, Service, OwnerPayment, AppNotification } from '../types';
import { getDB, getSalonByOwner, logout, updateBookingStatus, addService, updateService, deleteService, addOwnerPayment, updateSalonInfo, markNotificationsAsRead, updateUser, checkMonthlyPaymentStatus, addNotification, compressImage, fetchAll, ensureSalonExists } from '../services/storage';

interface OwnerHomeProps {
  user: User;
  onLogout: () => void;
}

type Tab = 'DASHBOARD' | 'BOOKINGS' | 'SERVICES' | 'PAYMENTS' | 'SETTINGS';

const OwnerHome: React.FC<OwnerHomeProps> = ({ user: initialUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [salon, setSalon] = useState<Salon | undefined>(undefined);
  const [db, setDb] = useState(getDB());
  const [user, setUser] = useState<User>(initialUser);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAppInfo, setShowAppInfo] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [paymentStatus, setPaymentStatus] = useState({ isDue: false, isSuspended: false });
  const [isInitializing, setIsInitializing] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSalon, setIsSavingSalon] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  // Profile States
  const [editOwnerName, setEditOwnerName] = useState(user.name);
  const [editOwnerAvatar, setEditOwnerAvatar] = useState(user.avatar || '');
  const ownerAvatarRef = useRef<HTMLInputElement>(null);

  // Salon States
  const [editSalonName, setEditSalonName] = useState('');
  const [editSalonLocation, setEditSalonLocation] = useState('');
  const [editSalonDescription, setEditSalonDescription] = useState('');
  const [editMapLink, setEditMapLink] = useState('');
  const [editOpeningTime, setEditOpeningTime] = useState('10:00 AM');
  const [editClosingTime, setEditClosingTime] = useState('10:00 PM');
  const [editSalonPhone, setEditSalonPhone] = useState('');
  const [editFB, setEditFB] = useState('');
  const [editInsta, setEditInsta] = useState('');
  const [editWA, setEditWA] = useState('');
  const [salonIsActive, setSalonIsActive] = useState(true);
  const [salonImage, setSalonImage] = useState('');
  const [salonPortfolio, setSalonPortfolio] = useState<string[]>([]);
  
  const salonCoverRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  // Service Form States
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  const [serviceImage, setServiceImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [payAmount, setPayAmount] = useState('');
  const [payTrxID, setPayTrxID] = useState('');

  // Initial Data Sync
  useEffect(() => {
    const init = async () => {
      await fetchAll();
      const currentSalon = getSalonByOwner(user.id);
      if (!currentSalon && retryCount < 2) {
        await ensureSalonExists(user);
        await fetchAll();
        setRetryCount(prev => prev + 1);
      }
      refreshData();
      setIsInitializing(false);
    };
    init();

    const handleGlobalUpdate = () => refreshData();
    window.addEventListener('smart_salon_db_updated', handleGlobalUpdate);
    return () => {
      window.removeEventListener('smart_salon_db_updated', handleGlobalUpdate);
    };
  }, [user.id, retryCount]);

  // Sync state with salon data when salon changes
  useEffect(() => {
    if (salon) {
      setEditSalonName(salon.name || '');
      setEditSalonLocation(salon.location || '');
      setEditSalonDescription(salon.description || '');
      setEditMapLink(salon.mapLink || '');
      setEditOpeningTime(salon.businessHours?.open || '10:00 AM');
      setEditClosingTime(salon.businessHours?.close || '10:00 PM');
      setEditSalonPhone(salon.ownerPhone || '');
      setEditFB(salon.socialLinks?.facebook || '');
      setEditInsta(salon.socialLinks?.instagram || '');
      setEditWA(salon.socialLinks?.whatsapp || '');
      setSalonIsActive(salon.isActive);
      setSalonImage(salon.image || '');
      setSalonPortfolio(salon.portfolio || []);
    }
  }, [salon?.id, activeTab === 'SETTINGS']);

  const refreshData = () => {
    const updatedDb = getDB();
    setDb(updatedDb);
    setNotifications(updatedDb.notifications.filter(n => n.userId === user.id));
    const currentSalon = getSalonByOwner(user.id);
    if (currentSalon) setSalon(currentSalon);
    setPaymentStatus(checkMonthlyPaymentStatus(user.id));
    const storageUser = updatedDb.users.find(u => u.id === user.id);
    if (storageUser) setUser(storageUser);
  };

  const toggleNotifications = () => {
    if (showNotifications) markNotificationsAsRead(user.id);
    setShowNotifications(!showNotifications);
  };

  const handleUpdateStatus = (bookingId: string, status: Booking['status']) => {
    updateBookingStatus(bookingId, status);
  };

  const handleSaveProfile = async () => {
    if (!editOwnerName.trim()) return alert('নাম লিখুন');
    setIsSavingProfile(true);
    try {
      const updated = await updateUser({ name: editOwnerName, avatar: editOwnerAvatar });
      if (updated) {
        setUser(updated);
        alert('প্রোফাইল সেভ হয়েছে!');
      }
    } catch (e) {
      alert('প্রোফাইল সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveSalonSettings = async () => {
    const currentSalon = salon || getSalonByOwner(user.id);
    if (!currentSalon) {
       await ensureSalonExists(user);
       await fetchAll();
       const reFetched = getSalonByOwner(user.id);
       if (!reFetched) return alert("দুঃখিত, আপনার সেলুন রেকর্ড পাওয়া যায়নি। দয়া করে একটু পর আবার চেষ্টা করুন।");
       setSalon(reFetched);
    }
    
    if (!editSalonName.trim()) return alert('সেলুনের নাম লিখুন');
    
    setIsSavingSalon(true);
    try {
      await updateSalonInfo(currentSalon!.id, {
        name: editSalonName,
        location: editSalonLocation,
        description: editSalonDescription,
        mapLink: editMapLink,
        businessHours: { open: editOpeningTime, close: editClosingTime },
        ownerPhone: editSalonPhone,
        isActive: salonIsActive,
        image: salonImage,
        portfolio: salonPortfolio,
        socialLinks: { facebook: editFB, instagram: editInsta, whatsapp: editWA }
      });
      alert('সেলুন তথ্য সফলভাবে সেভ হয়েছে!');
      refreshData();
    } catch (e) {
      console.error(e);
      alert('তথ্য সেভ করতে সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    } finally {
      setIsSavingSalon(false);
    }
  };

  const handleServiceFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentSalon = salon || getSalonByOwner(user.id);
    if (!currentSalon) return alert('সেলুন খুঁজে পাওয়া যায়নি। পেজটি রিফ্রেশ করুন।');
    if (!serviceName.trim() || !servicePrice.trim() || !serviceDuration.trim() || !serviceImage) {
      alert('সবগুলো ঘর পূরণ করুন');
      return;
    }
    const serviceData = { name: serviceName.trim(), price: parseInt(servicePrice), duration: parseInt(serviceDuration), image: serviceImage };
    try {
      if (editingService) {
        await updateService(currentSalon.id, editingService.id, serviceData);
      } else {
        await addService(currentSalon.id, serviceData);
      }
      resetServiceForm();
      alert('সার্ভিস সফলভাবে আপডেট হয়েছে!');
    } catch (e) {
      alert('সার্ভিস আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  const ownerBookings = [...db.bookings].filter(b => b.salonId === salon?.id).reverse();
  const pendingBookingsCount = ownerBookings.filter(b => b.status === 'PENDING').length;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const stats = {
    totalEarnings: ownerBookings.filter(b => b.status === 'COMPLETED').reduce((acc, curr) => acc + curr.totalPrice, 0),
    todayCount: ownerBookings.filter(b => b.date === new Date().toISOString().split('T')[0]).length,
    pendingCount: pendingBookingsCount,
    acceptedCount: ownerBookings.filter(b => b.status === 'CONFIRMED').length,
  };

  const resetServiceForm = () => { 
    setEditingService(null); setServiceName(''); setServicePrice(''); setServiceDuration(''); setServiceImage(''); setShowServiceForm(false);
  };

  const startEditService = (service: Service) => { 
    setEditingService(service); setServiceName(service.name); setServicePrice(service.price.toString()); setServiceDuration(service.duration.toString()); setServiceImage(service.image); setShowServiceForm(true); 
  };

  const handleDeleteService = (id: string) => { 
    const currentSalon = salon || getSalonByOwner(user.id);
    if (!currentSalon) return; 
    if (confirm('আপনি কি এই সার্ভিসটি ডিলিট করতে চান?')) { 
      deleteService(currentSalon.id, id); 
    } 
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (file && file instanceof Blob) { 
      setIsCompressing(true);
      const reader = new FileReader(); 
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setServiceImage(compressed);
        setIsCompressing(false);
      };
      reader.readAsDataURL(file); 
    } 
  };
  
  const handleOwnerAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (file && file instanceof Blob) { 
      setIsCompressing(true);
      const reader = new FileReader(); 
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setEditOwnerAvatar(compressed);
        setIsCompressing(false);
      };
      reader.readAsDataURL(file); 
    } 
  };

  const handleSalonCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (file && file instanceof Blob) { 
      setIsCompressing(true);
      const reader = new FileReader(); 
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 800, 450); 
        setSalonImage(compressed);
        setIsCompressing(false);
      };
      reader.readAsDataURL(file); 
    } 
  };

  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (salonPortfolio.length + files.length > 10) {
        alert('সর্বোচ্চ ১০টি ছবি আপলোড করা যাবে');
        return;
      }
      setIsCompressing(true);
      const newPortfolio = [...salonPortfolio];
      let processed = 0;
      Array.from(files).forEach(file => {
        if (!(file instanceof Blob)) return;
        const reader = new FileReader();
        reader.onloadend = async () => {
          const compressed = await compressImage(reader.result as string, 600, 800);
          newPortfolio.push(compressed);
          processed++;
          if (processed === files.length) {
            setSalonPortfolio(newPortfolio);
            setIsCompressing(false);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePortfolioImage = (idx: number) => {
    setSalonPortfolio(prev => prev.filter((_, i) => i !== idx));
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-8"></div>
        <h2 className="text-2xl font-black text-white text-center">আপনার প্রোফাইল লোড হচ্ছে...</h2>
      </div>
    );
  }

  // If after initialization salon is still not found, show setup UI
  if (!salon) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-12 text-center space-y-8">
        <div className="w-24 h-24 bg-amber-500/10 rounded-[32px] flex items-center justify-center border border-amber-500/20 shadow-lg">
           <svg className="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </div>
        <div>
           <h2 className="text-3xl font-black text-white mb-2">সেলুন সেটআপ করুন</h2>
           <p className="text-slate-500 max-w-xs mx-auto">আপনার সেলুনটি এখনো সিস্টেমে নিবন্ধিত হয়নি। সার্ভিস শুরু করতে নিচের বাটনে ক্লিক করুন।</p>
        </div>
        <button 
          onClick={async () => {
            setIsInitializing(true);
            await ensureSalonExists(user);
            await fetchAll();
            refreshData();
            setIsInitializing(false);
          }}
          className="bg-amber-500 text-slate-950 font-black py-5 px-10 rounded-3xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm"
        >
          সেলুন প্রোফাইল তৈরি করুন
        </button>
        <button onClick={onLogout} className="text-slate-600 font-bold text-xs uppercase tracking-widest">লগআউট</button>
      </div>
    );
  }

  const renderAppInfo = () => (
    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="absolute inset-x-0 bottom-0 top-0 bg-slate-900 border-t border-white/5 rounded-t-[48px] md:top-20 md:inset-x-20 md:rounded-[48px] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-500 overflow-hidden">
        <div className="px-8 pt-10 pb-6 flex justify-between items-center shrink-0 border-b border-white/5">
          <div>
            <h2 className="text-3xl font-black text-white">ওনার গাইডলাইন</h2>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">Smart Salon বিজনেস গাইড</p>
          </div>
          <button onClick={() => setShowAppInfo(false)} className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 active:scale-90 transition-all">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-20">
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-amber-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              কমিশন পলিসি
            </h3>
            <div className="bg-amber-500/5 p-6 rounded-3xl border border-amber-500/20">
              <p className="text-slate-400 text-sm leading-relaxed">
                আপনার মোট আয়ের ওপর <span className="text-amber-500 font-bold">১০% কমিশন</span> প্রতি মাসের ১০ থেকে ১৫ তারিখের মধ্যে পরিশোধ করা বাধ্যতামূলক। ১৫ তারিখ অতিবাহিত হলে আপনার সেলুনটি স্বয়ংক্রিয়ভাবে অ্যাপ থেকে হাইড হয়ে যাবে।
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              পেমেন্ট কনফার্মেশন
            </h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              বিকাশ পেমেন্ট করার পর ট্রানজ্যাকশন আইডি (TrxID) অবশ্যই পেমেন্ট সেকশনে সাবমিট করবেন। অ্যাডমিন প্যানেল থেকে যাচাই করার পর আপনার বকেয়া আপডেট করা হবে।
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              প্রোফাইল ও লিস্টিং
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              আপনার সেলুনের আকর্ষণীয় কভার ফটো এবং নিয়মিত 'লুকবুক (Portfolio)' আপডেট করুন। সুন্দর ছবি কাস্টমারদের বুকিং দিতে উদ্বুদ্ধ করে।
            </p>
          </section>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {paymentStatus.isSuspended && (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[32px] flex items-center gap-5 animate-pulse">
           <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20"><svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>
           <div><h3 className="text-red-500 font-black uppercase tracking-tight text-sm">আপনার সেলুনটি বন্ধ (Suspended) আছে!</h3><p className="text-red-400/70 text-xs font-bold leading-relaxed">১৫ তারিখের মধ্যে কমিশন পরিশোধ না করায় এটি বন্ধ করা হয়েছে।</p></div>
        </div>
      )}
      <div className="flex justify-between items-end">
        <div><h2 className="text-3xl font-bold text-white tracking-tight">ড্যাশবোর্ড</h2><p className="text-slate-500 text-sm">আপনার সেলুনের আপডেট</p></div>
        <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-2xl text-amber-500 font-bold text-xs">{new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' })}</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[32px] shadow-xl"><p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-1">মোট আয়</p><p className="text-2xl font-black text-white">৳ {stats.totalEarnings}</p></div>
        <div className="bg-gradient-to-br from-blue-600 to-cyan-700 p-6 rounded-[32px] shadow-xl"><p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">আজকের বুকিং</p><p className="text-2xl font-black text-white">{stats.todayCount} টি</p></div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[32px] shadow-xl"><p className="text-amber-100 text-[10px] font-black uppercase tracking-widest mb-1">পেন্ডিং</p><p className="text-2xl font-black text-white">{stats.pendingCount} টি</p></div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-[32px] shadow-xl"><p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1">গৃহীত</p><p className="text-2xl font-black text-white">{stats.acceptedCount} টি</p></div>
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-8 pb-32 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white tracking-tight">সার্ভিসসমূহ</h2>
        <button onClick={() => { resetServiceForm(); setShowServiceForm(true); }} className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 active:scale-95 transition-all shadow-xl uppercase tracking-widest"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>সার্ভিস যোগ</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {salon?.services?.map(s => (
          <div key={s.id} className="bg-slate-900 border border-slate-800 p-5 rounded-[32px] flex items-center gap-5 relative group hover:border-amber-500/30 transition-all">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-800 shrink-0"><img src={s.image} alt={s.name} className="w-full h-full object-cover" /></div>
            <div className="flex-1 min-w-0"><h3 className="font-black text-white text-base truncate">{s.name}</h3><p className="text-amber-500 font-black text-lg">৳ {s.price}</p></div>
            <div className="flex flex-col gap-2">
              <button onClick={() => startEditService(s)} className="w-10 h-10 bg-slate-800 hover:text-amber-500 text-slate-400 rounded-xl flex items-center justify-center transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
              <button onClick={() => handleDeleteService(s.id)} className="w-10 h-10 bg-slate-800 hover:text-red-500 text-slate-400 rounded-xl flex items-center justify-center transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>
          </div>
        ))}
        {salon?.services?.length === 0 && (<div className="col-span-full py-12 text-center opacity-30"><p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">এখনো কোনো সার্ভিস যোগ করা হয়নি</p></div>)}
      </div>
      {showServiceForm && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[100] flex flex-col p-8 animate-in fade-in zoom-in duration-300">
           <div className="flex justify-between items-center mb-12"><h2 className="text-3xl font-black text-white tracking-tight">{editingService ? 'সার্ভিস আপডেট' : 'নতুন সার্ভিস'}</h2><button onClick={resetServiceForm} className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 active:scale-90 transition-all"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
           <form onSubmit={handleServiceFormSubmit} className="space-y-8 flex-1 overflow-y-auto pb-10">
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">সার্ভিস এর নাম</label><input type="text" value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="যেমন: হেয়ার কাট" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 px-6 text-white focus:ring-2 focus:ring-amber-500/50 outline-none" /></div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">মূল্য (৳)</label><input type="number" value={servicePrice} onChange={e => setServicePrice(e.target.value)} placeholder="৫০০" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 px-6 text-white outline-none" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">সময় (মিনিট)</label><input type="number" value={serviceDuration} onChange={e => setServiceDuration(e.target.value)} placeholder="৩০" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 px-6 text-white outline-none" /></div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">সার্ভিস ছবি</label>
                <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video bg-slate-900 border-2 border-dashed border-slate-800 rounded-[32px] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">{isCompressing ? <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent"></div> : (serviceImage ? <img src={serviceImage} className="w-full h-full object-cover" alt="Service" /> : <p className="text-slate-700 font-black uppercase text-[10px]">ছবি পছন্দ করুন</p>)}</div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              </div>
              <div className="pt-8"><button type="submit" className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black py-6 rounded-3xl text-lg shadow-2xl uppercase tracking-widest">{editingService ? 'আপডেট করুন' : 'যোগ করুন'}</button></div>
           </form>
        </div>
      )}
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6 pb-24 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-white tracking-tight">বুকিং তালিকা</h2></div>
      {ownerBookings.length === 0 ? <div className="flex flex-col items-center justify-center py-20 text-center opacity-40"><p className="text-slate-500 font-black uppercase text-xs tracking-widest">এখনো কোনো বুকিং নেই</p></div> : (
        <div className="space-y-6">
          {ownerBookings.map(b => {
            const customer = db.users.find(u => u.id === b.userId);
            return (
              <div key={b.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] shadow-xl">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-amber-500 text-xl font-black border border-slate-700/50 overflow-hidden">{customer?.avatar ? <img src={customer.avatar} className="w-full h-full object-cover" alt="User" /> : (customer?.name?.charAt(0) || '?')}</div>
                    <div><h3 className="font-black text-white text-lg leading-tight">{customer?.name}</h3><p className="text-slate-500 text-xs font-bold mt-1 tracking-wider">+880 {customer?.phone}</p></div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-widest ${b.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : b.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : b.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{b.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800/50"><p className="text-[9px] font-black text-slate-600 uppercase mb-1">তারিখ ও সময়</p><p className="text-slate-300 text-xs font-bold">{new Date(b.date).toLocaleDateString('bn-BD')} - {b.time}</p></div>
                  <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800/50"><p className="text-[9px] font-black text-slate-600 uppercase mb-1">বিল</p><p className="text-white text-lg font-black">৳ {b.totalPrice}</p></div>
                </div>
                <div className="pt-2">
                  {b.status === 'PENDING' && (
                    <div className="grid grid-cols-2 gap-4"><button onClick={() => handleUpdateStatus(b.id, 'REJECTED')} className="bg-red-500/10 text-red-500 font-black py-4 rounded-2xl border border-red-500/20 text-[10px] uppercase tracking-widest active:scale-95 transition-all">বাতিল</button><button onClick={() => handleUpdateStatus(b.id, 'CONFIRMED')} className="bg-emerald-500 text-slate-950 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all">গ্রহণ</button></div>
                  )}
                  {b.status === 'CONFIRMED' && <button onClick={() => updateBookingStatus(b.id, 'COMPLETED')} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all">সম্পন্ন</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderPayments = () => {
    const totalEarnings = stats.totalEarnings;
    const adminCommission = Math.floor(totalEarnings * 0.1);
    const confirmedPayments = db.ownerPayments.filter(p => p.ownerId === user.id && p.status === 'CONFIRMED').reduce((acc, curr) => acc + curr.amount, 0);
    const pendingPaymentAmount = Math.max(0, adminCommission - confirmedPayments);
    const paymentHistory = [...db.ownerPayments].filter(p => p.ownerId === user.id).reverse();

    return (
      <div className="space-y-10 pb-32 animate-in fade-in duration-700">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/5 p-10 rounded-[48px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-amber-500/20 transition-colors duration-1000"></div>
            <div className="relative z-10 text-center">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">আপনার বকেয়া কমিশন</p>
              <h3 className="text-7xl font-black text-white tracking-tighter mb-4 drop-shadow-2xl">
                 <span className="text-amber-500">৳</span>{pendingPaymentAmount.toLocaleString()}
              </h3>
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-emerald-400/80 text-[10px] font-bold uppercase tracking-widest">১০% কমিশন পলিসি অনুযায়ী</p>
              </div>
            </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-xl font-black text-white uppercase tracking-tight ml-2">কিভাবে পেমেন্ট করবেন? (নির্দেশনা)</h3>
           <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex gap-5 items-start group hover:border-amber-500/20 transition-all">
                 <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-amber-500 font-black text-lg">১</div>
                 <div>
                    <h4 className="font-bold text-white text-base">বিকাশ নাম্বার কপি করুন</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">নিচের বিকাশ পার্সোনাল নাম্বারটি কপি করে আপনার ফোনে সেভ করুন বা সরাসরি বিকাশে যান।</p>
                    <div className="mt-4 flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-white/5">
                       <span className="text-amber-500 font-mono text-xl font-black">01940308516</span>
                       <button onClick={() => { navigator.clipboard.writeText('01940308516'); alert('বিকাশ নাম্বার কপি হয়েছে!'); }} className="bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase active:scale-90 transition-all">কপি</button>
                    </div>
                 </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex gap-5 items-start group hover:border-amber-500/20 transition-all">
                 <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-amber-500 font-black text-lg">২</div>
                 <div className="flex-1">
                    <h4 className="font-bold text-white text-base">বিকাশ অ্যাপ থেকে টাকা পাঠান</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">বিকাশ অ্যাপে গিয়ে 'Send Money' অপশন ব্যবহার করে বকেয়া টাকা পাঠান। ট্রানজ্যাকশন আইডি (TrxID) টি কপি করে রাখুন।</p>
                    <div className="mt-4 flex items-center gap-3 bg-[#E2136E]/10 p-4 rounded-2xl border border-[#E2136E]/20">
                       <img src="https://searchvectorlogo.com/wp-content/uploads/2020/02/bkash-logo-vector.png" className="h-5 w-auto" alt="bkash" />
                       <span className="text-[#E2136E] text-[10px] font-black uppercase tracking-widest">বিকাশ অ্যাপ ব্যবহার করুন</span>
                    </div>
                 </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex gap-5 items-start group hover:border-amber-500/20 transition-all">
                 <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-amber-500 font-black text-lg">৩</div>
                 <div className="flex-1">
                    <h4 className="font-bold text-white text-base">নিচে তথ্য জমা দিন</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">পেমেন্ট করার পর ট্রানজ্যাকশন আইডি এবং টাকার পরিমাণ লিখে সাবমিট করুন। অ্যাডমিন কিছুক্ষণের মধ্যে ভেরিফাই করবেন।</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[48px] shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-amber-500"></div>
           <h3 className="text-xl font-black text-white mb-8 tracking-tight">পেমেন্ট সাবমিট করুন</h3>
           <form onSubmit={(e) => {
              e.preventDefault();
              if (!payAmount || !payTrxID) return alert('দয়া করে সবগুলো ঘর পূরণ করুন');
              addOwnerPayment({ ownerId: user.id, amount: parseInt(payAmount), date: new Date().toISOString().split('T')[0], trxID: payTrxID });
              alert('পেমেন্ট রিকোয়েস্ট পাঠানো হয়েছে! অ্যাডমিন যাচাই করবেন।');
              setPayAmount(''); setPayTrxID('');
              refreshData();
           }} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">টাকার পরিমাণ (৳)</label>
                 <input 
                   type="number" 
                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 text-white focus:border-amber-500 outline-none font-black text-xl placeholder:text-slate-800" 
                   value={payAmount} 
                   onChange={e => setPayAmount(e.target.value)} 
                   placeholder="যেমন: ৫০০"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ট্রানজ্যাকশন আইডি (TrxID)</label>
                 <input 
                   type="text" 
                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 text-white font-mono text-lg focus:border-amber-500 outline-none placeholder:text-slate-800" 
                   value={payTrxID} 
                   onChange={e => setPayTrxID(e.target.value)} 
                   placeholder="যেমন: BLW9R8YQ..."
                 />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-black py-6 rounded-3xl shadow-2xl active:scale-95 transition-all uppercase tracking-widest text-sm mt-4">
                 পেমেন্ট রিপোর্ট জমা দিন
              </button>
           </form>
        </div>

        <div className="space-y-6">
           <div className="flex justify-between items-center px-2">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">পেমেন্ট হিস্ট্রি</h3>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{paymentHistory.length} টি রেকর্ড</span>
           </div>
           <div className="grid grid-cols-1 gap-4">
              {paymentHistory.length === 0 ? (
                 <div className="py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[40px]">
                    <p className="text-slate-600 font-bold uppercase text-xs tracking-widest">এখনো কোনো পেমেন্ট রেকর্ড নেই</p>
                 </div>
              ) : (
                 paymentHistory.map(p => (
                    <div key={p.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex justify-between items-center group hover:bg-slate-800/50 transition-all">
                       <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${p.status === 'CONFIRMED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {p.status === 'CONFIRMED' ? (
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                ) : (
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                             </svg>
                          </div>
                          <div>
                             <p className="text-white font-black text-xl">৳{p.amount.toLocaleString()}</p>
                             <p className="text-slate-600 text-[10px] font-mono mt-0.5">{p.trxID}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${p.status === 'CONFIRMED' ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                             {p.status === 'CONFIRMED' ? 'গৃহীত' : 'পেন্ডিং'}
                          </span>
                          <p className="text-slate-700 text-[8px] font-black uppercase tracking-widest mt-2">{new Date(p.date).toLocaleDateString('bn-BD')}</p>
                       </div>
                    </div>
                 ))
              )}
           </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-12 pb-32 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-white tracking-tight">সেটিংস ও প্রোফাইল</h2>
      <section className="bg-slate-900/60 p-8 rounded-[48px] border border-slate-800 space-y-8 shadow-2xl">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-slate-800 shadow-2xl relative">
                {isCompressing ? <div className="w-full h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent"></div></div> : (editOwnerAvatar ? <img src={editOwnerAvatar} className="w-full h-full object-cover" alt="Avatar" /> : <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-700 font-black text-3xl">{user.name?.charAt(0) || '?'}</div>)}
                <div onClick={() => ownerAvatarRef.current?.click()} className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm"><span className="text-white font-black text-[10px] uppercase tracking-widest">পরিবর্তন</span></div>
              </div>
              <input type="file" ref={ownerAvatarRef} onChange={handleOwnerAvatarUpload} className="hidden" accept="image/*" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">আপনার নাম</label><input type="text" value={editOwnerName} onChange={e => setEditOwnerName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white outline-none font-bold" /></div>
            <button onClick={handleSaveProfile} disabled={isSavingProfile || isCompressing} className="w-full bg-slate-100 text-slate-950 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50">{isSavingProfile ? (<><div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>সেভ হচ্ছে...</>) : 'প্রোফাইল সেভ করুন'}</button>
          </div>
      </section>

      <section className="bg-slate-900/50 p-8 rounded-[48px] border border-slate-800 space-y-8 shadow-2xl">
          <h3 className="text-white font-black text-sm uppercase tracking-widest ml-1">সেলুন প্রোফাইল এডিট</h3>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">সেলুন কভার ফটো</label>
            <div onClick={() => salonCoverRef.current?.click()} className="w-full aspect-video rounded-[32px] overflow-hidden border-2 border-dashed border-slate-800 flex items-center justify-center bg-slate-950/40 cursor-pointer transition-all">{isCompressing ? <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full"></div> : (salonImage ? <img src={salonImage} className="w-full h-full object-cover" alt="Cover" /> : <p className="text-slate-700 font-black uppercase text-[10px]">কভার ফটো আপলোড</p>)}</div>
            <input type="file" ref={salonCoverRef} onChange={handleSalonCoverUpload} className="hidden" accept="image/*" />
          </div>
          <div className="space-y-2"><label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">সেলুন এর নাম</label><input type="text" value={editSalonName} onChange={e => setEditSalonName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white outline-none font-bold" /></div>
          <div className="space-y-2"><label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">সংক্ষিপ্ত বিবরণ (Bio)</label><textarea value={editSalonDescription} onChange={e => setEditSalonDescription(e.target.value)} placeholder="আপনার সেলুন সম্পর্কে কিছু লিখুন..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white outline-none font-medium text-sm h-32 resize-none" /></div>
          <div className="space-y-2"><label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">ঠিকানা (বিস্তারিত)</label><input type="text" value={editSalonLocation} onChange={e => setEditSalonLocation(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white outline-none font-bold" /></div>
          <div className="space-y-2"><label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">গুগল ম্যাপ লিংক</label><input type="text" value={editMapLink} onChange={e => setEditMapLink(e.target.value)} placeholder="https://maps.app.goo.gl/..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white outline-none font-medium text-xs" /></div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2"><label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">খোলে</label><input type="text" value={editOpeningTime} onChange={e => setEditOpeningTime(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white outline-none font-bold text-center" /></div>
             <div className="space-y-2"><label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">বন্ধ হয়</label><input type="text" value={editClosingTime} onChange={e => setEditClosingTime(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white outline-none font-bold text-center" /></div>
          </div>
      </section>

      <section className="bg-slate-900/50 p-8 rounded-[48px] border border-slate-800 space-y-6">
          <div className="flex justify-between items-center px-1"><h3 className="text-white font-black text-sm uppercase tracking-widest">লুকবুক (Portfolio)</h3><span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{salonPortfolio.length} / ১০</span></div>
          <div className="grid grid-cols-3 gap-3">
             {salonPortfolio.map((img, idx) => (<div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-white/5 group"><img src={img} className="w-full h-full object-cover" alt="Portfolio" /><button onClick={() => removePortfolioImage(idx)} className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-90"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button></div>))}
             {salonPortfolio.length < 10 && (<button onClick={() => portfolioInputRef.current?.click()} className="aspect-square bg-slate-950/40 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-700 hover:text-amber-500 transition-all"><svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg><span className="text-[8px] font-black uppercase">ছবি যোগ</span></button>)}
          </div>
          <input type="file" ref={portfolioInputRef} onChange={handlePortfolioUpload} className="hidden" accept="image/*" multiple />
      </section>

      <section className="px-6"><button onClick={handleSaveSalonSettings} disabled={isSavingSalon || isCompressing || !salon} className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black py-5 rounded-3xl uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">{isSavingSalon ? (<><div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>সেভ হচ্ছে...</>) : 'সমস্ত তথ্য সেভ করুন'}</button></section>
      <div className="px-6"><button onClick={onLogout} className="w-full bg-red-600/10 border border-red-600/20 text-red-500 font-black py-5 rounded-[32px] flex items-center justify-center gap-3 active:scale-95 transition-all text-[10px] uppercase tracking-widest">লগআউট করুন</button></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-['Hind_Siliguri']">
      <header className="sticky top-0 h-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 flex justify-between items-center px-6 md:px-12 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-950" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm1,14H11V13h2Zm0-5H11V7h2Z"/></svg>
          </div>
          <h1 className="text-lg font-bold gradient-gold leading-none">Smart Salon</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowAppInfo(true)} className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 active:scale-90 transition-all">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          <button onClick={toggleNotifications} className="relative w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 active:scale-90 transition-all">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
             {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[8px] flex items-center justify-center text-white">{unreadCount}</span>}
          </button>
          <div onClick={() => setActiveTab('SETTINGS')} className="w-10 h-10 rounded-xl overflow-hidden border-2 border-slate-800 cursor-pointer active:scale-90 transition-all">
            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="User" /> : <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500 font-bold">{user.name?.charAt(0) || '?'}</div>}
          </div>
        </div>
      </header>

      {showNotifications && (
        <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="absolute inset-x-0 top-0 bg-slate-900/90 border-b border-white/5 rounded-b-[48px] max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-top-full duration-500">
            <div className="px-8 pt-10 pb-6 flex justify-between items-center shrink-0">
               <div>
                 <h2 className="text-3xl font-black text-white">নোটিফিকেশন</h2>
                 <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">সিস্টেম আপডেটসমূহ</p>
               </div>
               <button onClick={toggleNotifications} className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 active:scale-90 transition-all">
                 <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-12 space-y-4">
              {notifications.length === 0 ? (
                <div className="py-20 text-center opacity-30">
                  <p className="font-black uppercase tracking-widest text-xs">কোনো নোটিফিকেশন নেই</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`p-6 rounded-[32px] border transition-all ${!n.isRead ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-950/40 border-slate-800/50 opacity-60'}`}>
                    <h3 className={`font-black uppercase tracking-tight text-base ${!n.isRead ? 'text-amber-500' : 'text-slate-200'}`}>{n.title}</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showAppInfo && renderAppInfo()}

      <main className="flex-1 p-6 md:p-12 pb-32 overflow-y-auto">
        {activeTab === 'DASHBOARD' && renderDashboard()}
        {activeTab === 'BOOKINGS' && renderBookings()}
        {activeTab === 'SERVICES' && renderServices()}
        {activeTab === 'PAYMENTS' && renderPayments()}
        {activeTab === 'SETTINGS' && renderSettings()}
      </main>

      <nav className="fixed bottom-6 left-6 right-6 h-20 bg-slate-900/95 backdrop-blur-2xl border border-white/5 rounded-[32px] flex justify-around items-center px-2 shadow-2xl z-50">
        {[
          { id: 'DASHBOARD', label: 'হোম', icon: <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
          { id: 'BOOKINGS', label: 'বুকিং', icon: <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
          { id: 'SERVICES', label: 'সার্ভিস', icon: <path d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758L5 19m0-14l4.121 4.121" /> },
          { id: 'PAYMENTS', label: 'পেমেন্ট', icon: <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /> },
          { id: 'SETTINGS', label: 'সেটিংস', icon: <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> }
        ].map(nav => (
          <button key={nav.id} onClick={() => setActiveTab(nav.id as Tab)} className={`flex flex-col items-center gap-1 transition-all flex-1 relative ${activeTab === nav.id ? 'text-amber-400' : 'text-slate-600'}`}>
            <div className={`w-12 h-10 rounded-2xl flex items-center justify-center ${activeTab === nav.id ? 'bg-amber-400/10' : ''}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{nav.icon}</svg></div>
            <span className="text-[9px] font-black uppercase tracking-widest">{nav.label}</span>
            {nav.id === 'BOOKINGS' && pendingBookingsCount > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 bg-red-600 rounded-full text-[8px] flex items-center justify-center text-white border border-slate-950 font-black animate-in zoom-in duration-300">
                {pendingBookingsCount}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default OwnerHome;
