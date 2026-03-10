
import React, { useState } from 'react';
import { Account } from '../types';

interface TransferModalProps {
  accounts: Account[];
  onClose: () => void;
  onComplete: (sourceId: string, destId: string, amount: number) => void;
  initialSource?: string;
  initialDest?: string;
  initialAmount?: number;
}

const TransferModal: React.FC<TransferModalProps> = ({ 
  accounts, 
  onClose, 
  onComplete,
  initialSource,
  initialDest,
  initialAmount
}) => {
  const [step, setStep] = useState(1);
  const [sourceId, setSourceId] = useState(initialSource || accounts[0]?.id || '');
  const [destId, setDestId] = useState(initialDest || accounts[1]?.id || '');
  const [amount, setAmount] = useState(initialAmount?.toString() || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const sourceAccount = accounts.find(a => a.id === sourceId);
  const destAccount = accounts.find(a => a.id === destId);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    onComplete(sourceId, destId, parseFloat(amount));
    setIsProcessing(false);
    setStep(4);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/10">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Transfer Funds</h3>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-3">From Account</label>
                <div className="grid gap-3">
                  {accounts.map(acc => (
                    <button 
                      key={acc.id}
                      onClick={() => setSourceId(acc.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${sourceId === acc.id ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                      <div className="text-left">
                        <p className="text-sm font-bold">{acc.name}</p>
                        <p className="text-[10px] opacity-60">{acc.type}</p>
                      </div>
                      <p className="text-sm font-mono">${acc.balance.toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-3">To Account</label>
                <select 
                  value={destId}
                  onChange={(e) => setDestId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {accounts.filter(a => a.id !== sourceId).map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toLocaleString()})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <p className="text-slate-400 text-sm mb-2">Available Balance in {sourceAccount?.name}</p>
                <p className="text-3xl font-mono text-white">${sourceAccount?.balance.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-3 text-center">Enter Amount</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-light text-slate-600">$</span>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-3xl px-12 py-8 text-5xl font-light text-white text-center focus:border-blue-500 outline-none transition-all placeholder:text-slate-800"
                    placeholder="0.00"
                  />
                </div>
                {parseFloat(amount) > (sourceAccount?.balance || 0) && (
                  <p className="text-rose-500 text-xs mt-3 text-center">Insufficient funds in source account.</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-slate-800/40 border border-slate-700 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">From</span>
                  <span className="text-white font-bold">{sourceAccount?.name}</span>
                </div>
                <div className="flex justify-center py-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">To</span>
                  <span className="text-white font-bold">{destAccount?.name}</span>
                </div>
                <div className="h-[1px] bg-slate-700 my-4" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Amount</span>
                  <span className="text-3xl font-mono text-blue-400">${parseFloat(amount).toLocaleString()}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest">Instant transfer • No fees apply</p>
            </div>
          )}

          {step === 4 && (
            <div className="py-12 text-center animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-2xl font-bold text-white mb-2">Transfer Successful</h4>
              <p className="text-slate-400 text-sm mb-8">The funds have been moved successfully.</p>
              <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all">
                Close
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 4 && (
          <div className="p-6 bg-slate-950/40 border-t border-slate-800 flex gap-4">
            {step > 1 && (
              <button 
                onClick={handleBack}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all"
              >
                Back
              </button>
            )}
            <button 
              onClick={step === 3 ? handleSubmit : handleNext}
              disabled={
                (step === 1 && (!sourceId || !destId || sourceId === destId)) || 
                (step === 2 && (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > (sourceAccount?.balance || 0))) ||
                isProcessing
              }
              className={`flex-1 font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/10 flex items-center justify-center gap-2 ${isProcessing ? 'bg-blue-800 opacity-50' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
            >
              {isProcessing && (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {step === 3 ? (isProcessing ? 'Processing...' : 'Confirm Transfer') : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferModal;
