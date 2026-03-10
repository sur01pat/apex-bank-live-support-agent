
import React, { useState } from 'react';
import Login from './components/Login';
import LiveDashboard from './components/LiveDashboard';
import HomePage from './components/HomePage';
import { Account, Transaction } from './types';

const MOCK_ACCOUNTS: Account[] = [
  { id: 'acc1', name: 'Premium Checking', type: 'Checking', balance: 3210.50, currency: 'USD' },
  { id: 'acc2', name: 'High-Yield Savings', type: 'Savings', balance: 12450.00, currency: 'USD' },
  { id: 'acc3', name: 'Global Investment', type: 'Investment', balance: 45000.00, currency: 'USD' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', date: new Date().toISOString(), description: 'Starbucks Coffee', amount: 5.50, type: 'debit', category: 'Food' },
  { id: '2', date: new Date(Date.now() - 86400000).toISOString(), description: 'Apple Store Online', amount: 1299.00, type: 'debit', category: 'Electronics' },
  { id: '3', date: new Date(Date.now() - 172800000).toISOString(), description: 'Salary Deposit Apex Corp', amount: 5000.00, type: 'credit', category: 'Income' },
  { id: '4', date: new Date(Date.now() - 259200000).toISOString(), description: 'Amazon Prime Video', amount: 14.99, type: 'debit', category: 'Entertainment' },
  { id: '5', date: new Date(Date.now() - 345600000).toISOString(), description: 'Uber Trip', amount: 24.50, type: 'debit', category: 'Transport' },
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    setIsSupportOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <>
          <HomePage 
            userEmail={userEmail} 
            accounts={MOCK_ACCOUNTS}
            transactions={MOCK_TRANSACTIONS}
            onOpenSupport={() => setIsSupportOpen(true)}
            onLogout={handleLogout}
          />

          {/* AI Agent Fullscreen Applet Overlay */}
          {isSupportOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-500 p-0 md:p-8">
              <div className="relative w-full h-full max-h-[100vh] md:max-h-[900px] md:max-w-[1200px] bg-slate-900 md:rounded-[3rem] md:border border-slate-800 shadow-[0_0_100px_rgba(37,99,235,0.15)] overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col">
                
                {/* Close Button / Minimize UI */}
                <div className="absolute top-8 right-8 z-[110] flex items-center gap-4">
                  <div className="hidden md:flex flex-col items-end mr-4">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Secure Session</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase">Uplink: Active</span>
                  </div>
                  <button 
                    onClick={() => setIsSupportOpen(false)}
                    className="group p-4 rounded-2xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/50 border border-slate-700/50 transition-all shadow-2xl backdrop-blur-md"
                  >
                    <svg className="w-6 h-6 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Dashboard rendered as a dedicated fullscreen component */}
                <div className="flex-1 h-full overflow-hidden flex flex-col">
                  <LiveDashboard userEmail={userEmail} onLogout={handleLogout} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
