
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                            t.category.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      
      // Simple date filtering logic
      let matchesDate = true;
      const tDate = new Date(t.date);
      const now = new Date();
      if (dateRange === 'today') {
        matchesDate = tDate.toDateString() === now.toDateString();
      } else if (dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        matchesDate = tDate >= weekAgo;
      } else if (dateRange === 'month') {
        matchesDate = tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [transactions, search, filterType, dateRange]);

  return (
    <div className="flex flex-col h-full gap-4 text-slate-100">
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="credit">Credits</option>
            <option value="debit">Debits</option>
          </select>
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider focus:outline-none"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-10 opacity-40">
            <p className="text-xs">No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((t) => (
            <div key={t.id} className="group bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 p-3 rounded-xl transition-all cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">{t.description}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                </div>
                <div className={`text-xs font-bold ${t.type === 'credit' ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {t.type === 'credit' ? '+' : '-'}${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default TransactionHistory;
