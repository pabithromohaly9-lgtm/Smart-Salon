
import React, { useState, useEffect, useMemo } from 'react';
import { getDB, adminUpdateSalonStatus, adminConfirmPayment, updateSalonPriority, markNotificationsAsRead, adminToggleSalonActive, deleteUser, adminDeleteSalon, updateSalonInfo } from '../services/storage';
import { User, Salon, Booking, OwnerPayment, AppNotification } from '../types';

interface AdminDashboardProps {
  onLogout: () => void;
}

type Tab = 'DASHBOARD' | 'PAYMENTS' | 'SALONS' | 'BOOKINGS' | 'USERS';
type SalonFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [db, setDb] = useState(getDB());
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [salonSubFilter, setSalonSubFilter] = useState<SalonFilter>('ALL');
  const [showNotifications, setShowNotifications] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  
  // States for Editing Salon
  const [editingSalon, setEditingSalon] = useState<Salon | null>(null);
  const [editName, setEditName] = useState('');
  const [editLoc, setEditLoc] = useState('');
  const [editImg, setEditImg] = useState('');
  const [editPriority, setEditPriority] = useState<number>(99);

  // Admin fixed ID from storage.ts is 'admin1'
  const ADMIN_ID = 'admin1';
  const notifications = db.notifications.filter(n => n.userId === ADMIN_ID);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const refreshData = () => {
    setDb(getDB());
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000); 
    return () => clearInterval(interval);
  }, []);

  const filteredUsers = useMemo(() => {
    return db.users.filter(u => 
      u.role !== 'ADMIN' && 
      (u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
       u.phone.includes(userSearch))
    );
  }, [db.users, userSearch]);

  const handleDeleteSalon = (salonId: string) => {
    if (confirm('আপনি কি নিশ্চিত যে এই সেলুনটি ডিলিট করতে চান?')) {
      adminDeleteSalon(salonId);
      refreshData();
    }
  };

  const handleDeleteUserAction = (userId: string) => {
    if (confirm('আপনি কি নিশ্চিত যে এই ইউজারটি ডিলিট করতে চান?')) {
      deleteUser(userId);
      refreshData();
    }
  };

  const handleToggleActive = (salonId: string, currentStatus: boolean) => {
    adminToggleSalonActive(salonId, !currentStatus);
    refreshData();
  };

  const handleConfirmPayment = (paymentId: string) => {
    adminConfirmPayment(paymentId);
    refreshData();
  };

  const toggleNotifications = () => {
    if (showNotifications) {
      markNotificationsAsRead(ADMIN_ID);
    }
    setShowNotifications(!showNotifications);
  };

  const startEditing = (s: Salon) => {
    setEditingSalon(s);
    setEditName(s.name);
    setEditLoc(s.location);
    setEditImg(s.image);
    setEditPriority(s.priority || 99);
  };

  const saveSalonEdits = () => {
    if (!editingSalon) return;
    updateSalonInfo(editingSalon.id, {
      name: editName,
      location: editLoc,
      image: editImg,
      priority: editPriority
    });
    setEditingSalon(null);
    refreshData();
    alert('সেলুন তথ্য সফলভাবে আপডেট হয়েছে!');
  };

  const handleQuickPriorityUpdate = (id: string, val: string) => {
    const p = parseInt(val);
    if (!isNaN(p)) {
      updateSalonPriority(id, p);
      refreshData();
    }
  };

  const stats = {
    totalCommission: db.ownerPayments.filter(p => p.status === 'CONFIRMED').reduce((acc, curr) => acc + curr.amount, 0),
    pendingPayments: db.ownerPayments.filter(p => p.status === 'PENDING').length,
    totalUsers: db.users.length - 1,
    activeSalons: db.salons.filter(s => s.isActive).length,
    totalBookings: db.bookings.length
  };

  const renderDashboard = () => (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">ওভারভিউ</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Smart Salon বিজনেস স্ট্যাটাস</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 px-6 py-2 rounded-2xl text-amber-500 font-black text-[10px] uppercase tracking-widest">
          লাইভ আপডেট হচ্ছে
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
          <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-1">মোট কমিশন আয়</p>
          <p className="text-4xl font-black text-white">৳{stats.totalCommission.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-xl group hover:border-amber-500/30 transition-all">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-amber-500">মোট ইউজার</p>
          <p className="text-4xl font-black text-white">{stats.totalUsers}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-xl group hover:border-emerald-500/30 transition-all">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-emerald-500">সক্রিয় সেলুন</p>
          <p className="text-4xl font-black text-white">{stats.activeSalons}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-xl group hover:border-blue-500/30 transition-all">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-blue-500">মোট বুকিং</p>
          <p className="text-4xl font-black text-white">{stats.totalBookings}</p>
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-10 rounded-[48px] flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="flex gap-6 items-center">
            <div className="w-16 h-16 bg-amber-500/10 rounded-[24px] flex items-center justify-center border border-amber-500/20">
               <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
               <h3 className="text-xl font-black text-white tracking-tight">পেন্ডিং পেমেন্ট যাচাই</h3>
               <p className="text-slate-500 text-xs font-medium">বর্তমানে {stats.pendingPayments}টি পেমেন্ট রিকোয়েস্ট পেন্ডিং আছে</p>
            </div>
         </div>
         <button onClick={() => setActiveTab('PAYMENTS')} className="bg-amber-500 text-slate-950 font-black px-10 py-5 rounded-3xl active:scale-95 transition-all shadow-xl uppercase tracking-widest text-xs">সবগুলো দেখুন</button>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white">ইউজার লিস্ট</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">সব রেজিস্টার্ড মেম্বার</p>
        </div>
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="নাম বা ফোন নাম্বার দিয়ে খুঁজুন..." 
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 pl-14 pr-6 text-white focus:ring-2 focus:ring-amber-500/40 outline-none transition-all placeholder:text-slate-600 font-bold"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
          <svg className="absolute left-5 top-5 w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <div className="bg-slate-900/40 rounded-[48px] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-900/80 text-slate-500 border-b border-slate-800">
                <th className="p-8 font-black uppercase tracking-widest text-[10px]">ইউজার প্রোফাইল</th>
                <th className="p-8 font-black uppercase tracking-widest text-[10px]">ফোন নাম্বার</th>
                <th className="p-8 font-black uppercase tracking-widest text-[10px]">টাইপ/রোল</th>
                <th className="p-8 font-black uppercase tracking-widest text-[10px]">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="p-24 text-center opacity-30 text-xs font-black uppercase tracking-widest">ইউজার পাওয়া যায়নি</td></tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/20 transition-all group">
                    <td className="p-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-800 shrink-0">
                          {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 font-black">{u.name.charAt(0)}</div>}
                        </div>
                        <span className="font-bold text-white text-base group-hover:text-amber-500 transition-colors">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-8 text-slate-400 font-bold tracking-wider">{u.phone}</td>
                    <td className="p-8">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${u.role === 'OWNER' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                        {u.role === 'OWNER' ? 'ওনার' : 'কাস্টমার'}
                      </span>
                    </td>
                    <td className="p-8">
                      <button onClick={() => handleDeleteUserAction(u.id)} className="w-10 h-10 bg-red-600/10 text-red-500 rounded-xl flex items-center justify-center active:scale-90 transition-all border border-red-500/20"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSalons = () => {
    let filtered = db.salons;
    if (salonSubFilter === 'ACTIVE') filtered = db.salons.filter(s => s.isActive);
    else if (salonSubFilter === 'INACTIVE') filtered = db.salons.filter(s => !s.isActive);
    const sorted = [...filtered].sort((a,b) => (a.priority || 99) - (b.priority || 99));

    return (
      <div className="space-y-10 animate-in slide-in-from-right-4 duration-500 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-white">সেলুন ম্যানেজমেন্ট</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">লিস্টিং ও স্ট্যাটাস কন্ট্রোল</p>
          </div>
          <div className="flex gap-2 bg-slate-900 p-1.5 rounded-3xl border border-slate-800 shadow-inner">
            {['ALL', 'ACTIVE', 'INACTIVE'].map(f => (
              <button key={f} onClick={() => setSalonSubFilter(f as SalonFilter)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${salonSubFilter === f ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}>{f === 'ALL' ? 'সবগুলো' : f === 'ACTIVE' ? 'সক্রিয়' : 'বন্ধ'}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sorted.map(s => (
            <div key={s.id} className="bg-slate-900/60 backdrop-blur-sm rounded-[48px] overflow-hidden border border-slate-800 flex flex-col group hover:border-amber-500/30 transition-all shadow-2xl">
              <div className="h-56 relative overflow-hidden">
                <img src={s.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={s.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                   <button onClick={() => handleToggleActive(s.id, s.isActive)} className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-tighter border shadow-xl transition-all ${s.isActive ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-red-500/10 text-red-500 border-red-500/30 backdrop-blur-md'}`}>{s.isActive ? 'সক্রিয়' : 'বন্ধ'}</button>
                   <div className="flex items-center bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10">
                      <span className="text-[8px] text-amber-500 font-black uppercase mr-2 tracking-tighter">Priority:</span>
                      <input 
                        type="number" 
                        defaultValue={s.priority || 99}
                        onBlur={(e) => handleQuickPriorityUpdate(s.id, e.target.value)}
                        className="w-8 bg-transparent text-white font-black text-xs outline-none focus:text-amber-400"
                      />
                   </div>
                </div>

                <button onClick={() => handleDeleteSalon(s.id)} className="absolute top-6 right-6 w-11 h-11 bg-red-600/20 backdrop-blur-md hover:bg-red-600 text-red-500 hover:text-white rounded-2xl flex items-center justify-center border border-red-600/30 active:scale-90 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-black text-white group-hover:text-amber-500 transition-colors mb-2 truncate">{s.name}</h3>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-800">
                    <img src={s.ownerPhoto} className="w-full h-full object-cover" alt="" />
                  </div>
                  <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">{s.ownerName}</p>
                </div>
                <div className="mt-auto space-y-4">
                  <div className="flex justify-between items-center bg-slate-950/50 p-4 rounded-3xl border border-slate-800">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">রেটিং</p>
                    <p className="text-amber-500 font-black text-lg">★ {s.rating}</p>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => startEditing(s)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg">এডিট</button>
                     <button onClick={() => {
                       const p = prompt('Priority সেট করুন (১ মানে সবার উপরে)', s.priority?.toString() || '99');
                       if (p !== null) {
                         handleQuickPriorityUpdate(s.id, p);
                       }
                     }} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-900/30 transition-all">প্রাধান্য</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Salon Modal */}
        {editingSalon && (
           <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-slate-900 border border-white/10 p-10 rounded-[56px] w-full max-w-lg shadow-2xl space-y-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
                 <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">সেলুন তথ্য এডিট</h3>
                    <button onClick={() => setEditingSalon(null)} className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-500 active:scale-90 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                 </div>
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">নাম</label>
                       <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 text-white outline-none focus:border-amber-500/50 font-bold transition-all" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ঠিকানা</label>
                       <input type="text" value={editLoc} onChange={e => setEditLoc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 text-white outline-none focus:border-amber-500/50 font-bold transition-all" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ইমেজ ইউআরএল</label>
                       <input type="text" value={editImg} onChange={e => setEditImg(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 text-white outline-none focus:border-amber-500/50 font-mono text-xs transition-all" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">প্রাধান্য (Priority - ১ থেকে ৯৯)</label>
                       <input type="number" value={editPriority} onChange={e => setEditPriority(parseInt(e.target.value) || 99)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 text-amber-500 outline-none focus:border-amber-500/50 font-black transition-all" />
                    </div>
                 </div>
                 <button onClick={saveSalonEdits} className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black py-5 rounded-[24px] shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm">সেভ করুন</button>
              </div>
           </div>
        )}
      </div>
    );
  };

  const renderPayments = () => {
    const pending = db.ownerPayments.filter(p => p.status === 'PENDING').reverse();
    return (
      <div className="space-y-10 animate-in slide-in-from-right-4 duration-500 pb-20">
        <div>
          <h2 className="text-3xl font-black text-white">পেমেন্ট যাচাইকরণ</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">পেন্ডিং ট্রানজ্যাকশন ({pending.length})</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {pending.length === 0 ? (
            <div className="py-32 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[64px]">
               <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <p className="text-slate-600 font-black uppercase text-xs tracking-[0.3em]">কোনো পেন্ডিং পেমেন্ট নেই</p>
            </div>
          ) : (
            pending.map(p => {
              const owner = db.users.find(u => u.id === p.ownerId);
              return (
                <div key={p.id} className="bg-slate-900 border border-slate-800 p-8 rounded-[48px] flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-emerald-500/30 transition-all shadow-xl">
                  <div className="flex gap-6 items-center flex-1">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-[28px] flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg">
                       <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">{owner?.name || 'অজানা ওনার'}</h3>
                      <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mt-1">{owner?.phone}</p>
                    </div>
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">পরিমাণ ও TrxID</p>
                    <div className="flex flex-col">
                       <span className="text-3xl font-black text-amber-500">৳{p.amount.toLocaleString()}</span>
                       <span className="text-slate-300 font-mono text-sm uppercase mt-1">ID: {p.trxID}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button onClick={() => handleConfirmPayment(p.id)} className="bg-emerald-500 text-slate-950 font-black px-12 py-5 rounded-3xl active:scale-95 transition-all shadow-xl uppercase tracking-widest text-[11px]">কনফার্ম করুন</button>
                    <button className="bg-red-600/10 text-red-500 font-black px-6 py-5 rounded-3xl active:scale-95 border border-red-500/20 uppercase tracking-widest text-[11px]">বাতিল</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderBookings = () => (
    <div className="space-y-10 animate-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white">সব বুকিং রেকর্ড</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">সিস্টেম হিস্ট্রি</p>
        </div>
        <span className="text-indigo-400 text-[10px] font-black tracking-widest uppercase bg-indigo-400/10 px-4 py-2 rounded-xl border border-indigo-400/20">{db.bookings.length} টি মোট অ্যাপয়েন্টমেন্ট</span>
      </div>

      <div className="bg-slate-900/40 rounded-[48px] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-900/80 text-slate-500 border-b border-slate-800">
                <th className="p-8 font-black uppercase tracking-widest text-[10px]">সেলুন ও কাস্টমার</th>
                <th className="p-8 font-black uppercase tracking-widest text-[10px]">সময় ও তারিখ</th>
                <th className="p-8 font-black uppercase tracking-widest text-[10px]">বিল</th>
                <th className="p-8 font-black uppercase tracking-widest text-[10px]">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {[...db.bookings].reverse().map(b => (
                <tr key={b.id} className="hover:bg-slate-800/20 transition-all group">
                  <td className="p-8">
                    <p className="font-black text-white text-base group-hover:text-amber-500 transition-colors">{db.salons.find(s => s.id === b.salonId)?.name}</p>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-tight mt-1">কাস্টমার: {db.users.find(u => u.id === b.userId)?.name}</p>
                  </td>
                  <td className="p-8">
                    <p className="text-slate-300 font-bold">{b.date}</p>
                    <p className="text-slate-500 text-[11px] font-black uppercase mt-1">{b.time}</p>
                  </td>
                  <td className="p-8 font-black text-lg text-white">৳{b.totalPrice}</td>
                  <td className="p-8">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${b.status === 'PENDING' ? 'text-amber-500 border-amber-500/20' : b.status === 'CONFIRMED' ? 'text-emerald-500 border-emerald-500/20' : 'text-slate-600 border-slate-800'}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-['Hind_Siliguri']">
      <header className="sticky top-0 h-24 bg-slate-950/80 backdrop-blur-3xl border-b border-white/5 flex justify-between items-center px-6 md:px-12 z-[100] shrink-0">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-700 rounded-[18px] flex items-center justify-center shadow-2xl shadow-amber-900/30">
            <svg className="w-7 h-7 text-slate-950" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm1,14H11V13h2Zm0-5H11V7h2Z"/></svg>
          </div>
          <div>
            <h1 className="text-2xl font-black gradient-gold tracking-tight leading-none">Admin Panel</h1>
            <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.4em] mt-1">Control System V1.2</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <button onClick={toggleNotifications} className="relative w-12 h-12 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 active:scale-90 transition-all hover:border-amber-500/30">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
             {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-600 rounded-full border-2 border-slate-950 flex items-center justify-center text-[9px] font-black text-white shadow-lg animate-pulse">{unreadCount}</span>}
           </button>
           <button onClick={onLogout} className="bg-red-600/10 text-red-500 px-6 py-3 rounded-2xl border border-red-500/20 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">লগআউট</button>
        </div>
      </header>

      {showNotifications && (
        <div className="fixed inset-0 z-[150] bg-slate-950/40 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="absolute inset-x-0 top-0 bg-slate-900 border-b border-white/10 rounded-b-[64px] max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-top-full duration-500">
            <div className="px-10 pt-12 pb-8 flex justify-between items-center shrink-0">
               <div>
                 <h2 className="text-4xl font-black text-white">সিস্টেম এলার্ট</h2>
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">অ্যাডমিন নোটিফিকেশনসমূহ</p>
               </div>
               <button onClick={toggleNotifications} className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-[24px] flex items-center justify-center text-slate-400 active:scale-90 transition-all shadow-xl">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            <div className="flex-1 overflow-y-auto px-10 pb-16 space-y-4">
              {notifications.length === 0 ? (
                <div className="py-24 text-center opacity-30 flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                  <p className="font-black uppercase tracking-[0.4em] text-xs">কোনো নোটিফিকেশন নেই</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`p-8 rounded-[36px] border transition-all ${!n.isRead ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-950/40 border-slate-800/50 opacity-60'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <h3 className={`font-black uppercase tracking-tight text-lg ${!n.isRead ? 'text-amber-500' : 'text-slate-300'}`}>{n.title}</h3>
                       <span className="text-slate-600 text-[9px] font-bold">{new Date(n.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-6 md:p-12 pb-32 overflow-y-auto max-w-[1400px] mx-auto w-full">
           {activeTab === 'DASHBOARD' && renderDashboard()}
           {activeTab === 'PAYMENTS' && renderPayments()}
           {activeTab === 'SALONS' && renderSalons()}
           {activeTab === 'BOOKINGS' && renderBookings()}
           {activeTab === 'USERS' && renderUsers()}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 h-24 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-[40px] flex justify-around items-center px-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] z-[100] w-[90%] max-w-[600px]">
        {[
          { id: 'DASHBOARD', label: 'ড্যাশবোর্ড', icon: <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
          { id: 'USERS', label: 'ইউজার', icon: <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
          { id: 'PAYMENTS', label: 'পেমেন্ট', icon: <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /> },
          { id: 'SALONS', label: 'সেলুন', icon: <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> },
          { id: 'BOOKINGS', label: 'বুকিং', icon: <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> }
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id as Tab)} 
            className={`flex flex-col items-center gap-1 transition-all flex-1 relative ${activeTab === item.id ? 'text-amber-400' : 'text-slate-600'}`}
          >
            <div className={`w-14 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === item.id ? 'bg-amber-400/10' : 'hover:bg-slate-800'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
            {item.id === 'PAYMENTS' && stats.pendingPayments > 0 && <span className="absolute top-1 right-2 w-2 h-2 bg-red-600 rounded-full"></span>}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default AdminDashboard;
