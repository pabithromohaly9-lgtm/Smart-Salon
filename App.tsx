
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

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'AUTH' | 'DASHBOARD' | 'ADMIN'>('AUTH');
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  const isProduction = window.location.hostname.includes('vercel.app') || window.location.hostname !== 'localhost';

  // OneSignal Tagging Helper
  const tagUserOneSignal = (user: User) => {
    if (!isProduction) return;
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      await OneSignal.login(user.id);
      const roleGroup = user.role === 'OWNER' ? 'owners' : user.role === 'USER' ? 'users' : 'admins';
      await OneSignal.User.addTag("role", roleGroup);
      
      // Request permission immediately upon identifying user
      OneSignal.Notifications.requestPermission();
    });
  };

  useEffect(() => {
    // 1. OneSignal Initialization
    if (isProduction) {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        await OneSignal.init({
          appId: "152c0a9a-f428-4f83-b749-c394205ae4af",
          notifyButton: { enable: false },
          allowLocalhostAsSecureOrigin: true,
        });
      });
    }

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

  const handleLogin = (role: UserRole) => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setView('DASHBOARD');
      tagUserOneSignal(user);
    }
  };

  const handleLogout = () => {
    if (isProduction) {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        await OneSignal.logout();
      });
    }
    logout();
    setCurrentUser(null);
    setView('AUTH');
  };

  return (
    <div className="relative min-h-screen">
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
