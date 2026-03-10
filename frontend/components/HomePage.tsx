
import React from 'react';
import { Account, Transaction } from '../types';

interface HomePageProps {
  userEmail: string;
  accounts: Account[];
  transactions: Transaction[];
  onOpenSupport: () => void;
  onLogout: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ userEmail, accounts, transactions, onOpenSupport, onLogout }) => {
  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      {/* Top Navigation Bar */}
      <nav className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">APEX GLOBAL</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            {['Dashboard', 'Accounts', 'Payments', 'Investments', 'Cards'].map(item => (
              <button key={item} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-xs font-medium text-slate-300">{userEmail}</span>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Priority Member</span>
          </div>
          
          {/* 3D-ish Avatar Trigger Button in Top Right */}
          <button 
            onClick={onOpenSupport}
            className="group relative flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 p-1.5 pr-4 rounded-full border border-slate-700 transition-all hover:border-blue-500/50 shadow-lg"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500 ring-2 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100&auto=format&fit=crop" 
                alt="AI Concierge" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-transparent transition-colors" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Concierge</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Click to Chat</span>
            </div>
          </button>

          <button onClick={onLogout} className="p-2 text-slate-500 hover:text-rose-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
            </svg>
          </button>
        </div>
      </nav>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {/* Welcome Header */}
        <header className="mb-12">
          <h1 className="text-3xl font-light mb-2">Welcome back, <span className="font-bold">Member</span></h1>
          <p className="text-slate-500 text-sm">Last login: Today, 10:42 AM from San Francisco, CA</p>
        </header>

        {/* Account Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] hover:border-slate-700 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
              </div>
              <div className="flex flex-col gap-6 relative z-10">
                <div>
                  <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">{acc.type}</h3>
                  <p className="text-lg font-bold text-slate-200">{acc.name}</p>
                </div>
                <div>
                  <p className="text-4xl font-light tracking-tight text-white">
                    <span className="text-slate-600 mr-1">$</span>
                    {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-emerald-500 font-bold mt-2 uppercase tracking-widest flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    +2.4% this month
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-800/50 flex justify-between items-center">
                  <span className="text-[10px] text-slate-600 font-mono tracking-tighter">**** **** **** 4291</span>
                  <button className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:text-blue-400">View Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Two Column Layout: Activity & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">Recent Activity</h2>
              <button className="text-sm text-blue-500 font-medium">View All Transactions</button>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden">
              <div className="divide-y divide-slate-800/50">
                {transactions.map(t => (
                  <div key={t.id} className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.type === 'debit' ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {t.type === 'debit' ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 group-hover:text-white transition-colors">{t.description}</p>
                        <p className="text-xs text-slate-500">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-bold ${t.type === 'debit' ? 'text-slate-300' : 'text-emerald-500'}`}>
                        {t.type === 'debit' ? '-' : '+'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-slate-600 uppercase tracking-widest">Completed</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <h2 className="text-xl font-bold mb-2">Market Insights</h2>
             <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-2xl shadow-blue-500/20 text-white flex flex-col gap-8">
               <div>
                 <p className="text-blue-100/60 text-xs font-black uppercase tracking-widest mb-2">Portfolio Value</p>
                 <p className="text-3xl font-bold">$184,290.42</p>
               </div>
               <div className="h-24 flex items-end gap-1">
                 {[40, 70, 45, 90, 65, 80, 55, 95].map((h, i) => (
                   <div key={i} className="flex-1 bg-white/20 rounded-t-sm" style={{ height: `${h}%` }} />
                 ))}
               </div>
               <button className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Investment Summary</button>
             </div>

             <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl">
               <h3 className="text-sm font-bold mb-4">Upcoming Payments</h3>
               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Mortgage Autopay</span>
                    <span className="text-xs font-bold">$2,450.00</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Gym Membership</span>
                    <span className="text-xs font-bold">$45.00</span>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
