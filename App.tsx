
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import UserHome from './components/UserHome';
import OwnerHome from './components/OwnerHome';
import AdminDashboard from './components/AdminDashboard';
import { User, UserRole } from './types';
import { getCurrentUser, logout, checkUpcomingBookingsAndNotify } from './services/storage';

declare global {
  interface Window {
    OneSignalDeferred: any[];
  }
}

const LOGO_BASE64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBmaWxsPSIjZmJiZjI0Ij48cGF0aCBkPSJNMzA0LjIgMjQwLjJMMzg2LjEgMTIxLjhjMTEuNy0xNyA3LjEtNDAuMi0xMC4zLTUxLjVjLTE3LjQtMTEuMy00MC42LTYuMS01Mi4zIDEwLjlMMjU2IDE4Mi4ybC02Ny41LTEwMWMtMTEuNy0xNy0zNC45LTIyLjItNTIuMy0xMC45Yy0xNy40IDExLjMtMjIgMzQuNS0xMC4zIDUxLjVsODEuOSAxMTguNEwxMDQuNCAzOTEuOGMtMTAuMiAxNC44LTEzLjYgMzMuMy05LjUgNTFjNC4xIDE3LjcgMTUuMyAzMi41IDMxLjEgNDAuOWMxNS44IDguNCAzNC4xIDkuNSA1MC42IDIuOWMxNi41LTYuNiAyOS41LTIwLjIgMzUuOC0zNy40bDQuNi0xMTguOUwzMDAgNDUwLjJjNi4zIDE3LjIgMTkuMyAzMC44IDM1LjggMzcuNGMxNi41IDYuNiAzNC44IDUuNSA1MC42LTIuOWMxNS44LTguNCAyNy0yMy4yIDMxLjEtNDAuOWM0LjEtMTcuNyAuNy0zNi4yLTkuNS01MWwtMTAzLjgtMTUyLjZ6bS0xNTMuMSAxODcuNWMtOC45IDQuMy0xOS40IDMuNy0yNy43LTEuNGMtOC4zLTUuMS0xMy4yLTE0LTE0LjctMjMuM2MtMS41LTkuMyAxLjItMTguNyA3LjQtMjUuOUwyMTEuNSAyNDFsLTYwLjQgMTg2Ljd6bTI1My4zLTI3LjNjLTEuNSA5LjMtNi40IDE4LjItMTQuNyAyMy4zYy04LjMgNS4xLTE4LjggNS43LTI3LjcgMS40TDMwMS4zIDI0MWw5NS40IDEzNi4xYzYuMiA3LjIgOC45IDE2LjYgNy40IDI1Ljl6Ii8+PC9zdmc+";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'AUTH' | 'DASHBOARD' | 'ADMIN'>('AUTH');
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // OneSignal Tagging Helper
  const tagUserOneSignal = (user: User) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      await OneSignal.login(user.id);
      const roleGroup = user.role === 'OWNER' ? 'owners' : user.role === 'USER' ? 'users' : 'admins';
      await OneSignal.User.addTag("role", roleGroup);
      console.log(`OneSignal: User registered to group - ${roleGroup}`);
    });
  };

  useEffect(() => {
    // 1. OneSignal Initialization
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      await OneSignal.init({
        appId: "152c0a9a-f428-4f83-b749-c394205ae4af",
        notifyButton: { enable: false },
        allowLocalhostAsSecureOrigin: true,
      });
    });

    // 2. PWA Install Logic
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if user is logged in for 3 seconds
      setTimeout(() => setShowInstallModal(true), 3000);
    });

    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setView('DASHBOARD');
      tagUserOneSignal(user);
    }

    const interval = setInterval(() => checkUpcomingBookingsAndNotify(), 60000);

    const handlePush = (e: any) => {
      const { title, message, userId } = e.detail;
      const user = getCurrentUser();
      if (user && user.id === userId) {
        setToast({ title, message });
        setTimeout(() => setToast(null), 5000);
      }
    };

    window.addEventListener('app_push_notification', handlePush);
    return () => {
      clearInterval(interval);
      window.removeEventListener('app_push_notification', handlePush);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallModal(false);
    }
  };

  const handleLogin = (role: UserRole) => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setView('DASHBOARD');
      tagUserOneSignal(user);
    }
  };

  const handleLogout = () => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      await OneSignal.logout();
    });
    logout();
    setCurrentUser(null);
    setView('AUTH');
  };

  return (
    <div className="relative min-h-screen">
      {/* Premium Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowInstallModal(false)}></div>
          <div className="glass w-full max-w-sm p-10 rounded-[48px] shadow-2xl relative animate-in zoom-in duration-500 text-center space-y-8">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-amber-500/10 rounded-[32px] flex items-center justify-center border border-amber-500/20 shadow-lg">
                <img src={LOGO_BASE64} className="w-14 h-14 drop-shadow-lg" alt="Logo" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black gradient-gold tracking-tight mb-3">Smart Salon অ্যাপটি ইন্সটল করুন</h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">সেরা অভিজ্ঞতা এবং রিয়েল-টাইম নোটিফিকেশন পেতে অ্যাপটি আপনার হোম স্ক্রিনে যোগ করুন।</p>
            </div>
            <div className="space-y-4">
              <button 
                onClick={handleInstallClick}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black py-5 rounded-[24px] shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm"
              >
                এখনই ইন্সটল করুন
              </button>
              <button 
                onClick={() => setShowInstallModal(false)}
                className="w-full text-slate-500 font-bold text-xs uppercase tracking-widest py-2"
              >
                পরে করবো
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toast && (
        <div className="fixed top-6 inset-x-6 z-[9999] animate-in slide-in-from-top duration-500">
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-amber-500/30 p-5 rounded-[28px] shadow-2xl flex gap-4 items-center">
             <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                <svg className="w-7 h-7 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
             </div>
             <div className="flex-1">
                <h4 className="font-black text-amber-500 text-sm uppercase tracking-tight">{toast.title}</h4>
                <p className="text-slate-300 text-xs font-medium line-clamp-2">{toast.message}</p>
             </div>
             <button onClick={() => setToast(null)} className="text-slate-500 p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        </div>
      )}

      {view === 'ADMIN' ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : view === 'DASHBOARD' && currentUser ? (
        currentUser.role === 'OWNER' ? <OwnerHome user={currentUser} onLogout={handleLogout} /> : <UserHome user={currentUser} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} onAdminTrigger={() => setView('ADMIN')} />
      )}
    </div>
  );
};

export default App;
