
import React from 'react';
import { User } from '../types';

interface OwnerDashboardProps {
  user: User;
  onLogout: () => void;
}

const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-premium p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold">মালিক ড্যাশবোর্ড</h1>
            <p className="text-slate-300">স্বাগতম, {user.name}!</p>
          </div>
          <button 
            onClick={onLogout}
            className="text-slate-300 hover:text-white underline"
          >
            লগআউট
          </button>
        </header>

        <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-amber-400">আপনার সেলুন স্ট্যাটাস</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-900/40 p-6 rounded-2xl border border-indigo-700/50">
              <p className="text-indigo-200 text-sm mb-1">আজকের বুকিং</p>
              <p className="text-3xl font-bold">০</p>
            </div>
            <div className="bg-emerald-900/40 p-6 rounded-2xl border border-emerald-700/50">
              <p className="text-emerald-200 text-sm mb-1">মোট আয়</p>
              <p className="text-3xl font-bold">৳০</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">বুকিং তালিকা</h2>
          <div className="text-center py-10 text-slate-500">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>এখনো কোনো বুকিং পাওয়া যায়নি।</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
