
import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '../types';
import { loginUser, checkUserExists } from '../services/storage';

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
  onAdminTrigger: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onAdminTrigger }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [stage, setStage] = useState<'INFO' | 'PIN'>('INFO');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [tapCount, setTapCount] = useState(0);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoTap = () => {
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount === 5) {
      setShowAdminDialog(true);
      setTapCount(0);
    }
    tapTimeoutRef.current = setTimeout(() => setTapCount(0), 2000);
  };

  const handleAdminAuth = () => {
    if (adminPass === '143') {
      onAdminTrigger();
    } else {
      alert('ভুল পাসওয়ার্ড!');
      setShowAdminDialog(false);
      setAdminPass('');
    }
  };

  const moveToPinStage = async (role: UserRole) => {
    const trimmedName = name.trim();
    const cleanPhone = phone.replace(/\D/g, ''); 

    if (!trimmedName) {
      alert('দয়া করে আপনার পুরো নাম লিখুন');
      return;
    }
    if (cleanPhone.length !== 11) {
      alert('দয়া করে সঠিক ১১ ডিজিটের ফোন নাম্বার দিন');
      return;
    }

    if (cleanPhone === '01940308516') {
      alert('এই ফোন নাম্বারটি সংরক্ষিত। দয়া করে অন্য নাম্বার ব্যবহার করুন।');
      return;
    }

    setIsLoading(true);
    try {
      const exists = await checkUserExists(cleanPhone);
      setSelectedRole(role);
      setIsNewUser(!exists);
      setStage('PIN');
    } catch (e) {
      alert('সার্ভারের সাথে সংযোগ করা যাচ্ছে না।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalAuth = async () => {
    if (pin.length !== 4) {
      alert('দয়া করে ৪ ডিজিটের পিন দিন');
      return;
    }

    setIsLoading(true);
    try {
      await loginUser(name.trim(), phone.replace(/\D/g, ''), selectedRole!, pin);
      onLogin(selectedRole!);
    } catch (error: any) {
      if (error.message === 'INVALID_PIN') {
        alert('ভুল পিন! দয়া করে সঠিক পিন দিন।');
        setPin('');
      } else if (error.message === 'ADMIN_PHONE_RESERVED') {
        alert('এই নাম্বারটি শুধুমাত্র অ্যাডমিনের জন্য।');
      } else {
        alert('সমস্যা হয়েছে, আবার চেষ্টা করুন।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderPinInput = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black text-white tracking-tight">
          {isNewUser ? 'নতুন পিন সেট করুন' : 'পিন ভেরিফাই করুন'}
        </h3>
        <p className="text-slate-400 text-sm">
          {isNewUser 
            ? 'ভবিষ্যতে লগইন করার জন্য ৪ ডিজিটের একটি গোপন পিন দিন' 
            : 'আপনার আইডিতে প্রবেশ করতে পিনটি লিখুন'}
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="relative w-full max-w-[240px]">
          <input 
            type="password" 
            maxLength={4}
            placeholder="••••"
            disabled={isLoading}
            className="w-full bg-slate-900 border-2 border-slate-700 rounded-3xl py-6 text-center text-4xl font-black tracking-[1em] text-amber-500 focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-slate-800 disabled:opacity-50"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            autoFocus
          />
        </div>

        <div className="w-full space-y-4">
          <button 
            onClick={handleFinalAuth}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black py-5 rounded-[24px] shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>}
            {isNewUser ? 'একাউন্ট তৈরি করুন' : 'লগইন নিশ্চিত করুন'}
          </button>
          
          <button 
            onClick={() => { setStage('INFO'); setPin(''); }}
            disabled={isLoading}
            className="w-full text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-300 transition-colors py-2"
          >
            পিছনে যান
          </button>
        </div>
      </div>
    </div>
  );

  const renderInfoInputs = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
      <div className="space-y-6">
        <div className="group space-y-2">
          <label className="text-[13px] font-black text-slate-100 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            আপনার নাম
          </label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="পুরো নাম লিখুন"
              className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl py-5 px-6 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all placeholder:text-slate-600 font-semibold"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="group space-y-2">
          <label className="text-[13px] font-black text-slate-100 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            ফোন নাম্বার
          </label>
          <div className="relative">
            <div className="absolute left-1 top-1 bottom-1 w-20 bg-slate-800/80 rounded-l-2xl border-r border-slate-700 flex items-center justify-center gap-1.5">
              <span className="text-amber-500 font-black text-sm">+880</span>
            </div>
            <input 
              type="tel" 
              placeholder="017XXXXXXXX"
              maxLength={11}
              className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl py-5 pl-24 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all placeholder:text-slate-600 font-semibold"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 pt-4">
        <button 
          onClick={() => moveToPinStage('USER')}
          disabled={isLoading}
          className="group relative bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 hover:border-indigo-500/50 text-white font-bold py-7 rounded-[32px] transition-all duration-500 shadow-2xl active:scale-95 flex flex-col items-center justify-center gap-3 overflow-hidden disabled:opacity-50"
        >
          {isLoading ? <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div> : (
            <>
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <span className="text-[12px] font-black uppercase tracking-[0.1em] text-slate-300">ইউজার লগইন</span>
            </>
          )}
        </button>
        
        <button 
          onClick={() => moveToPinStage('OWNER')}
          disabled={isLoading}
          className="group relative bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black py-7 rounded-[32px] transition-all duration-500 shadow-[0_20px_40px_rgba(217,119,6,0.3)] active:scale-95 flex flex-col items-center justify-center gap-3 overflow-hidden border border-white/30 disabled:opacity-50"
        >
          {isLoading ? <div className="w-6 h-6 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div> : (
            <>
                <div className="w-12 h-12 rounded-full bg-slate-950/20 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <span className="text-[12px] font-black uppercase tracking-[0.1em] text-slate-900">ওনার লগইন</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-premium relative flex flex-col justify-center px-8 py-12 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }}></div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full z-10">
        <div className="flex flex-col items-center mb-16 animate-in fade-in slide-in-from-top-6 duration-1000">
          <div 
            onClick={handleLogoTap}
            className="w-24 h-24 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 rounded-[32px] flex items-center justify-center shadow-[0_25px_50px_-12px_rgba(217,119,6,0.5)] cursor-pointer active:scale-90 transition-all mb-6 border border-white/20"
          >
            <svg className="w-14 h-14 text-slate-900 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm1,14H11V13h2Zm0-5H11V7h2Z"/>
            </svg>
          </div>
          <h2 className="text-5xl font-black gradient-gold tracking-tight mb-3 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">Smart Salon</h2>
          <div className="flex items-center gap-4 opacity-70">
             <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-amber-500/50"></div>
             <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
             <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-amber-500/50"></div>
          </div>
        </div>

        {stage === 'INFO' ? renderInfoInputs() : renderPinInput()}
      </div>

      {showAdminDialog && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-500">
          <div className="bg-slate-900/90 p-10 rounded-[56px] border border-white/10 w-full max-w-sm shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="text-center space-y-3 mb-12">
              <h3 className="text-3xl font-black gradient-gold tracking-tight">অ্যাডমিন এক্সেস</h3>
              <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.4em]">গোপন পাসওয়ার্ড দিন</p>
            </div>
            <input 
              type="password"
              placeholder="•••"
              className="w-full bg-slate-950 border border-slate-800 rounded-[32px] py-10 text-center text-5xl font-black tracking-[0.6em] text-amber-500 focus:outline-none focus:border-amber-500/50 transition-all mb-12 shadow-[inset_0_4px_20px_rgba(0,0,0,0.7)]"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              autoFocus
            />
            <div className="flex flex-col gap-4">
              <button 
                onClick={handleAdminAuth}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black py-6 rounded-3xl active:scale-95 transition-all uppercase tracking-widest text-sm"
              >
                ভেরিফাই করুন
              </button>
              <button 
                onClick={() => { setShowAdminDialog(false); setAdminPass(''); }}
                className="w-full py-4 text-slate-500 font-bold text-xs uppercase tracking-[0.3em]"
              >
                ফিরে যান
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
