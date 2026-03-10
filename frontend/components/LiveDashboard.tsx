import React, { useState, useCallback, useRef, useEffect } from 'react';
import { LiveServerMessage } from '@google/genai';
import { GeminiService } from '../services/GeminiService';
import { decode, decodeAudioData, encode } from '../utils/audioUtils';
import { ConnectionStatus, Message, Transaction, Account } from '../types';
import Avatar from './Avatar';
import Visualizer from './Visualizer';
import CameraPortal from './CameraPortal';
import AssetVault from './AssetVault';
import TransactionHistory from './TransactionHistory';
import TransferModal from './TransferModal';

interface LiveDashboardProps {
  userEmail: string;
  onLogout: () => void;
}

interface Asset {
  id: string;
  url: string;
  type: string;
  mimeType: string;
  timestamp: number;
}

const MOCK_ACCOUNTS: Account[] = [
  { id: 'acc1', name: 'Premium Checking', type: 'Checking', balance: 3210.50, currency: 'USD' },
  { id: 'acc2', name: 'High-Yield Savings', type: 'Savings', balance: 12450.00, currency: 'USD' },
  { id: 'acc3', name: 'Global Investment', type: 'Investment', balance: 45000.00, currency: 'USD' },
];

const SYSTEM_INSTRUCTION = `
Apex Global Bank Concierge. 
Scope: Accounts, Products, Services.
Guidelines: English only. Professional. Stop if user speaks.
Use 'getAccountBalances' for real-time data.
Tools: generateVisualAsset, generateVideoAsset, initiateTransfer, getAccountBalances.
`;

const LiveDashboard: React.FC<LiveDashboardProps> = ({ userEmail, onLogout }) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [agentAudioLevel, setAgentAudioLevel] = useState(0);
  const [agentSentiment, setAgentSentiment] = useState<'neutral' | 'friendly' | 'analytical' | 'urgent'>('neutral');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'vision' | 'assets'>('vision');
  const [textInput, setTextInput] = useState('');
  const [avatarReaction, setAvatarReaction] = useState<'none' | 'success' | 'error'>('none');
  const [volume, setVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoGenProgress, setVideoGenProgress] = useState<string | null>(null);
  
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const accountsRef = useRef<Account[]>(MOCK_ACCOUNTS);
  
  useEffect(() => {
    accountsRef.current = accounts;
  }, [accounts]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [prefilledTransfer, setPrefilledTransfer] = useState<{source?: string, dest?: string, amount?: number} | null>(null);

  const geminiRef = useRef<GeminiService | null>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const analyserOutRef = useRef<AnalyserNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const frameIntervalRef = useRef<number | null>(null);
  const inputTransRef = useRef('');
  const outputTransRef = useRef('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const playbackRateRef = useRef(playbackRate);
  useEffect(() => { playbackRateRef.current = playbackRate; }, [playbackRate]);

  useEffect(() => {
    if (outputNodeRef.current) {
      const targetVolume = isMuted ? 0 : volume;
      outputNodeRef.current.gain.setTargetAtTime(targetVolume, audioContextOutRef.current?.currentTime || 0, 0.1);
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const ctx = audioContextOutRef.current;
    if (ctx && ctx.state !== 'closed') isAudioPaused ? ctx.suspend() : ctx.resume();
  }, [isAudioPaused]);

  // Real-time output audio analysis
  useEffect(() => {
    if (!isSpeaking || !analyserOutRef.current) {
      setAgentAudioLevel(0);
      return;
    }

    const analyser = analyserOutRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let rafId: number;

    const analyze = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      setAgentAudioLevel(Math.min(1, avg / 128)); // Normalize roughly
      rafId = requestAnimationFrame(analyze);
    };

    analyze();
    return () => cancelAnimationFrame(rafId);
  }, [isSpeaking]);

  const isSpeakingRef = useRef(false);
  const lastInterruptionRef = useRef(0);
  
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  const stopAudio = useCallback(() => {
    lastInterruptionRef.current = Date.now();
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e){} });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsSpeaking(false);
  }, []);

  const cleanup = useCallback(() => {
    if (geminiRef.current) geminiRef.current.close();
    if (frameIntervalRef.current) window.clearInterval(frameIntervalRef.current);
    if (audioContextInRef.current) audioContextInRef.current.close().catch(() => {});
    if (audioContextOutRef.current) audioContextOutRef.current.close().catch(() => {});
    stopAudio();
    setStatus(ConnectionStatus.DISCONNECTED);
    setIsListening(false);
    setIsThinking(false);
    setIsTyping(false);
  }, [stopAudio]);

  const analyzeSentiment = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes("pleasure") || t.includes("welcome") || t.includes("happy")) return 'friendly';
    if (t.includes("secure") || t.includes("analyzed") || t.includes("verified")) return 'analytical';
    if (t.includes("urgent") || t.includes("warning") || t.includes("attention")) return 'urgent';
    return 'neutral';
  };

  const connect = async () => {
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        text: "Security Alert: Voice and Camera features require a Secure Context (HTTPS). Since you are on an insecure origin, please enable 'Insecure origins treated as secure' in your browser flags or use a tunnel like ngrok.", 
        timestamp: Date.now() 
      }]);
      setStatus(ConnectionStatus.ERROR);
      setAvatarReaction('error');
      return;
    }

    try {
      setStatus(ConnectionStatus.CONNECTING);
      geminiRef.current = new GeminiService();
      
      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      await audioContextInRef.current.resume();
      await audioContextOutRef.current.resume();
      
      outputNodeRef.current = audioContextOutRef.current.createGain();
      analyserOutRef.current = audioContextOutRef.current.createAnalyser();
      analyserOutRef.current.fftSize = 256;
      
      outputNodeRef.current.connect(analyserOutRef.current);
      analyserOutRef.current.connect(audioContextOutRef.current.destination);

      let stream: MediaStream;
      if (!navigator.mediaDevices) {
        console.error("[LiveDashboard] navigator.mediaDevices is undefined. This usually happens in insecure (non-HTTPS) contexts.");
        setMessages(prev => [...prev, { 
          role: 'agent', 
          text: "Security Error: Your browser has blocked microphone access because this site is not using HTTPS. Please use a secure connection or enable 'Insecure origins treated as secure' in Chrome flags.", 
          timestamp: Date.now() 
        }]);
        setStatus(ConnectionStatus.ERROR);
        setAvatarReaction('error');
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (err) {
        console.warn("[LiveDashboard] Failed to get video, falling back to audio only:", err);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (audioErr) {
          console.error("[LiveDashboard] Microphone access denied or unavailable:", audioErr);
          setMessages(prev => [...prev, { 
            role: 'agent', 
            text: "Error: Microphone access is required for voice interaction. Please ensure you have granted permission and your microphone is connected.", 
            timestamp: Date.now() 
          }]);
          setStatus(ConnectionStatus.ERROR);
          setAvatarReaction('error');
          return;
        }
      }
      
      if (videoRef.current) videoRef.current.srcObject = stream;

      await geminiRef.current.connect({ 
        systemInstruction: SYSTEM_INSTRUCTION,
        inputAudioTranscription: {},
        outputAudioTranscription: {}
      }, {
        onopen: () => {
          setStatus(ConnectionStatus.CONNECTED);
          setIsListening(true);
          setAvatarReaction('success');

          const source = audioContextInRef.current!.createMediaStreamSource(stream);
          const processor = audioContextInRef.current!.createScriptProcessor(1024, 1, 1);
          processor.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0);
            
            // Local VAD: If user speaks while agent is speaking, stop agent audio immediately
            let sum = 0;
            for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
            const rms = Math.sqrt(sum / input.length);
            // Increased threshold to 0.04 to prevent false positives from background noise/echo
            if (rms > 0.04 && isSpeakingRef.current) {
              console.log("[LiveDashboard] Local interruption detected (RMS:", rms.toFixed(4), ")");
              stopAudio();
            }

            const int16 = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) int16[i] = input[i] * 32768;
            geminiRef.current?.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
          };
          source.connect(processor);
          processor.connect(audioContextInRef.current!.destination);

          frameIntervalRef.current = window.setInterval(() => {
            if (videoRef.current?.readyState === 4) {
              const canvas = canvasRef.current;
              canvas.width = 480; canvas.height = 270;
              canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, 480, 270);
              canvas.toBlob(b => b?.arrayBuffer().then(buf => {
                geminiRef.current?.sendRealtimeInput({ media: { data: encode(new Uint8Array(buf)), mimeType: 'image/jpeg' } });
              }), 'image/jpeg', 0.3); // Optimized for recognition vs bandwidth
            }
          }, 1500); // Optimized frequency for VM environments
        },
        onmessage: async (msg: any) => {
          console.log("[LiveDashboard] Received message:", msg);
          if (msg.type === 'error') {
            console.error("[LiveDashboard] Backend reported error:", msg.data);
            setMessages(prev => [...prev, { role: 'agent', text: `System Error: ${msg.data}`, timestamp: Date.now() }]);
            setStatus(ConnectionStatus.ERROR);
            setAvatarReaction('error');
            return;
          }

          if (msg.toolCall) {
            console.log("[LiveDashboard] Handling tool call:", msg.toolCall);
            setIsThinking(true);
            for (const fc of msg.toolCall.functionCalls) {
              if (fc.name === 'generateVisualAsset') {
                try {
                  console.log("[LiveDashboard] Calling generateImage with prompt:", fc.args.prompt);
                  const res = await geminiRef.current?.generateImage(fc.args.prompt as string, fc.args.type as string);
                  console.log("[LiveDashboard] generateImage response:", res);
                  const part = res?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
                  if (part) {
                    console.log("[LiveDashboard] Image generated successfully, adding to vault");
                    setAssets(prev => [{ id: Math.random().toString(36).slice(2), url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`, type: fc.args.type as string, mimeType: part.inlineData.mimeType, timestamp: Date.now() }, ...prev]);
                    setAvatarReaction('success');
                    setSidebarTab('assets');
                  } else {
                    console.warn("[LiveDashboard] No image part found in response");
                    setAvatarReaction('error');
                  }
                } catch (err) {
                  console.error("[LiveDashboard] Failed to generate visual asset:", err);
                  setAvatarReaction('error');
                }
                geminiRef.current?.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: "Success" } } });
                setIsThinking(false);
              }
              if (fc.name === 'generateVideoAsset') {
                try {
                  console.log("[LiveDashboard] Calling generateVideo with prompt:", fc.args.prompt);
                  const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                  if (!hasKey) {
                    console.log("[LiveDashboard] No API key selected, opening dialog");
                    await (window as any).aistudio.openSelectKey();
                  }
                  const url = await geminiRef.current?.generateVideo(fc.args.prompt as string, fc.args.aspectRatio as any, (p) => {
                    console.log("[LiveDashboard] Video gen progress:", p);
                    setVideoGenProgress(p);
                  });
                  if (url) {
                    console.log("[LiveDashboard] Video generated successfully, adding to vault:", url);
                    setAssets(prev => [{ id: Math.random().toString(36).slice(2), url, type: 'Cinematic Journey', mimeType: 'video/mp4', timestamp: Date.now() }, ...prev]);
                    setAvatarReaction('success');
                    setSidebarTab('assets');
                  } else {
                    console.warn("[LiveDashboard] No video URL returned");
                    setAvatarReaction('error');
                  }
                  setVideoGenProgress(null);
                  geminiRef.current?.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: "Success" } } });
                } catch (err) {
                  console.error("[LiveDashboard] Failed to generate video asset:", err);
                  setAvatarReaction('error'); setVideoGenProgress(null);
                  geminiRef.current?.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: "Failed to generate video." } } });
                }
                setIsThinking(false);
              }
              if (fc.name === 'initiateTransfer') {
                const { sourceAccount, destinationAccount, amount } = fc.args as any;
                // Use a ref-based or latest state access if possible, but for now we use the closure's accounts
                // which is fine for finding IDs as they don't change.
                const findAccount = (search: string) => accounts.find(a => a.id === search || a.name.toLowerCase().includes(search.toLowerCase()))?.id;
                const sId = findAccount(sourceAccount);
                const dId = findAccount(destinationAccount);
                
                console.log("[LiveDashboard] Initiating transfer pre-fill:", { sId, dId, amount });
                setPrefilledTransfer({ source: sId, dest: dId, amount: amount });
                setIsTransferModalOpen(true);
                geminiRef.current?.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: "Opening transfer interface for user confirmation." } } });
                setIsThinking(false);
              }
              if (fc.name === 'getAccountBalances') {
                // We need the LATEST accounts here. Since onmessage is a closure, 
                // we should ideally use a ref for accounts or a state update that has access to latest.
                // However, for this demo, we'll use a functional update trick or just accept the closure for now
                // but wait, I can't use functional update to GET the value.
                // I'll add a ref for accounts.
                console.log("[LiveDashboard] Tool Call: getAccountBalances");
                geminiRef.current?.sendToolResponse({ 
                  functionResponses: { 
                    id: fc.id, 
                    name: fc.name, 
                    response: { accounts: accountsRef.current } 
                  } 
                });
                setIsThinking(false);
              }
            }
          }
          const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audio) {
            const arrivalTime = Date.now();
            setIsSpeaking(true); setIsThinking(false);
            const ctx = audioContextOutRef.current!;
            const rate = playbackRateRef.current;
            
            const buf = await decodeAudioData(decode(audio), ctx, 24000, 1);
            
            // If an interruption happened while we were decoding, discard this chunk
            if (arrivalTime < lastInterruptionRef.current) {
              console.log("[LiveDashboard] Discarding audio chunk due to interruption");
              return;
            }

            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            console.log(`[LiveDashboard] Scheduling audio chunk: ${buf.duration.toFixed(3)}s`);
            const source = ctx.createBufferSource();
            source.buffer = buf;
            source.playbackRate.value = rate;
            source.connect(outputNodeRef.current!);
            source.onended = () => { sourcesRef.current.delete(source); if (!sourcesRef.current.size) setIsSpeaking(false); };
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buf.duration / rate;
            sourcesRef.current.add(source);
          }
          if (msg.serverContent?.interrupted) stopAudio();
          if (msg.serverContent?.inputTranscription) inputTransRef.current += msg.serverContent.inputTranscription.text;
          if (msg.serverContent?.outputTranscription) { 
            setIsTyping(true); 
            const newText = msg.serverContent.outputTranscription.text;
            outputTransRef.current += newText; 
            setAgentSentiment(analyzeSentiment(outputTransRef.current));
          }
          if (msg.serverContent?.turnComplete) {
            setMessages(prev => [...prev, { role: 'user' as const, text: inputTransRef.current || 'Voice Input', timestamp: Date.now() }, { role: 'agent' as const, text: outputTransRef.current || 'Response Received', timestamp: Date.now() }].slice(-20));
            inputTransRef.current = ''; outputTransRef.current = ''; setIsTyping(false); setIsThinking(false);
          }
        },
        onerror: () => { setStatus(ConnectionStatus.ERROR); setAvatarReaction('error'); cleanup(); },
        onclose: () => cleanup()
      });
    } catch (err) { setStatus(ConnectionStatus.ERROR); setAvatarReaction('error'); }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    geminiRef.current?.sendRealtimeInput({ text: textInput.trim() });
    setMessages(prev => [...prev, { role: 'user' as const, text: textInput.trim(), timestamp: Date.now() }].slice(-20));
    setTextInput('');
  };

  const handleTransferComplete = (sourceId: string, destId: string, amount: number) => {
    console.log("[LiveDashboard] Transfer complete, updating balances:", { sourceId, destId, amount });
    setAccounts(prev => {
      const newAccounts = prev.map(acc => {
        let newBalance = acc.balance;
        if (acc.id === sourceId) newBalance -= amount;
        if (acc.id === destId) newBalance += amount;
        return { ...acc, balance: newBalance };
      });
      console.log("[LiveDashboard] New balances:", newAccounts.map(a => `${a.name}: ${a.balance}`));
      return newAccounts;
    });
    setAvatarReaction('success');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-900 overflow-hidden relative h-full">
      
      {/* Sidebar - Left: Context & Control */}
      <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col bg-slate-950/40 p-6 gap-8 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.268 0 2.39.234 3.41.659m-4.74 15.111L12.45 21m3.65-4.111L15.5 19.5M8 11h.01M12 11h.01M16 11h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Apex Concierge</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{status === ConnectionStatus.CONNECTED ? 'Secure Link Established' : 'System Standby'}</p>
          </div>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
          {/* Account Snapshot */}
          <div className="space-y-4">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50 pb-2">Active Accounts</h3>
            <div className="space-y-2">
              {accounts.map(acc => (
                <div key={acc.id} className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/40 hover:border-blue-500/30 transition-all group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-400 font-bold">{acc.name}</span>
                    <span className="text-[8px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 group-hover:text-blue-400 transition-colors">VERIFIED</span>
                  </div>
                  <p className="text-sm font-mono font-bold text-white tracking-tighter">${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats / Environment */}
          <div className="space-y-4">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50 pb-2">Identity Hub</h3>
            <CameraPortal isActive={status === ConnectionStatus.CONNECTED} videoRef={videoRef} />
          </div>
        </div>

        {/* Global Controls */}
        <div className="pt-6 border-t border-slate-800/50 space-y-4">
           <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
             <button onClick={() => setSidebarTab('vision')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'vision' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Insights</button>
             <button onClick={() => setSidebarTab('assets')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'assets' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Vault ({assets.length})</button>
           </div>
           {status !== ConnectionStatus.CONNECTED ? (
             <button onClick={connect} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-blue-600/20 active:scale-95 transition-all">Connect Private Uplink</button>
           ) : (
             <button onClick={cleanup} className="w-full bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-slate-700/50 transition-all">Terminate Link</button>
           )}
        </div>
      </aside>

      {/* Main Interaction Hub */}
      <main className="flex-1 flex flex-col p-6 md:p-10 gap-8 overflow-hidden bg-slate-900 relative">
        {/* Centered Interaction View */}
        <div className="flex-1 flex flex-col items-center justify-between max-w-4xl mx-auto w-full overflow-hidden">
          
          {/* Avatar & Dynamic Feedback Area */}
          <div className="flex flex-col items-center justify-center gap-8 py-8 shrink-0">
            <div className="relative group">
              <Avatar 
                isSpeaking={isSpeaking} 
                isListening={isListening} 
                isThinking={isThinking} 
                isTyping={isTyping} 
                audioLevel={agentAudioLevel}
                sentiment={agentSentiment}
                status={status === ConnectionStatus.CONNECTED ? 'online' : status === ConnectionStatus.CONNECTING ? 'connecting' : status === ConnectionStatus.ERROR ? 'error' : 'offline'} 
                reaction={avatarReaction} 
              />
              
              {videoGenProgress && (
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-64 bg-slate-950/80 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-4 shadow-2xl animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{videoGenProgress}</span>
                  </div>
                  <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-[shimmer_2s_infinite]" style={{ width: '100%' }} />
                  </div>
                </div>
              )}
              
              {/* Variable Controls Overlay (Floating) */}
              {status === ConnectionStatus.CONNECTED && (
                <div className="absolute -right-24 top-1/2 -translate-y-1/2 flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500">
                   <div className="bg-slate-950/80 backdrop-blur-xl p-3 rounded-2xl border border-slate-800 flex flex-col gap-3 shadow-2xl">
                     <button onClick={() => setIsAudioPaused(!isAudioPaused)} className={`p-2 rounded-lg transition-colors ${isAudioPaused ? 'bg-rose-500/20 text-rose-500' : 'text-blue-500 hover:bg-blue-500/10'}`} title={isAudioPaused ? "Resume Audio" : "Pause Audio"}>
                        {isAudioPaused ? <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> : <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>}
                     </button>
                     <button onClick={() => setIsMuted(!isMuted)} className={`p-2 rounded-lg transition-colors ${isMuted ? 'bg-rose-500/20 text-rose-500' : 'text-blue-500 hover:bg-blue-500/10'}`} title={isMuted ? "Unmute Agent" : "Mute Agent"}>
                       {isMuted ? (
                         <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                       ) : (
                         <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                       )}
                     </button>
                     <div className="h-[1px] bg-slate-800" />
                     {[1.0, 1.5, 2.0].map(rate => (
                        <button key={rate} onClick={() => setPlaybackRate(rate)} className={`text-[9px] font-black p-2 rounded-lg transition-all ${playbackRate === rate ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}>{rate}x</button>
                      ))}
                   </div>
                </div>
              )}
            </div>

            <div className="h-12 flex flex-col items-center justify-center w-full">
               {videoGenProgress ? (
                 <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-1.5">
                       {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: `${i * 0.2}s`}} />)}
                    </div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] animate-pulse">{videoGenProgress}</p>
                 </div>
               ) : (
                 <Visualizer active={(isSpeaking || isListening) && !isAudioPaused} color={isSpeaking ? "#3b82f6" : "#10b981"} />
               )}
            </div>
          </div>

          {/* Conversation Transcript Feed */}
          <div className="flex-1 w-full bg-slate-950/20 rounded-[2.5rem] border border-slate-800/40 p-8 overflow-hidden mb-8 relative">
            {messages.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 gap-6 animate-in fade-in zoom-in-95 duration-1000">
                <div className="w-24 h-24 rounded-full bg-blue-600/20 border-2 border-blue-500/30 flex items-center justify-center text-white shadow-[0_0_50px_rgba(37,99,235,0.2)] mb-2">
                  <svg className="w-12 h-12 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="max-w-xs">
                  <h3 className="text-lg font-bold text-white tracking-tight uppercase tracking-[0.1em]">System Optimized for Private Interaction</h3>
                  <p className="text-sm text-slate-400 font-medium mt-4 leading-relaxed">Initialize secure conversation via voice command or encrypted text entry below.</p>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto custom-scrollbar scroll-smooth pr-2">
                <div className="space-y-8 pb-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                      <div className="flex items-center gap-3 mb-2 px-4">
                         <span className={`text-[9px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-slate-500' : 'text-blue-500'}`}>{msg.role}</span>
                         <span className="text-[8px] text-slate-700 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`max-w-[75%] px-6 py-4 rounded-[1.5rem] text-sm leading-relaxed shadow-xl ${
                        msg.role === 'agent' 
                        ? 'bg-blue-600/10 border border-blue-500/20 text-blue-50' 
                        : 'bg-slate-800/60 border border-slate-700/50 text-slate-200'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Secure Entry Footer */}
          <div className="w-full shrink-0">
            <form onSubmit={handleTextSubmit} className="relative group">
              <div className="absolute inset-0 bg-blue-600/5 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <input 
                type="text" 
                value={textInput} 
                onChange={(e) => setTextInput(e.target.value)} 
                disabled={status !== ConnectionStatus.CONNECTED}
                placeholder="Send a secure message to your concierge..."
                className="w-full bg-slate-950/60 backdrop-blur-3xl border border-slate-800 rounded-3xl px-10 py-6 text-base focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-slate-700 pr-24 shadow-2xl"
              />
              <button type="submit" disabled={status !== ConnectionStatus.CONNECTED || !textInput.trim()} className="absolute right-6 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-2xl shadow-xl shadow-blue-600/20 disabled:opacity-10 transition-all active:scale-90">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Conditional Sidebar Overlay (Vault/Transactions) */}
      {sidebarTab === 'assets' && (
        <aside className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-slate-900/95 backdrop-blur-3xl border-l border-slate-800 z-[120] animate-in slide-in-from-right duration-500 shadow-[-50px_0_100px_rgba(0,0,0,0.5)] flex flex-col">
          <div className="p-10 flex items-center justify-between border-b border-slate-800 shrink-0">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-amber-500" />
               Asset Vault
            </h3>
            <button onClick={() => setSidebarTab('vision')} className="text-slate-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
            <AssetVault assets={assets} />
          </div>
        </aside>
      )}

      {isTransferModalOpen && <TransferModal accounts={accounts} onClose={() => setIsTransferModalOpen(false)} onComplete={handleTransferComplete} initialSource={prefilledTransfer?.source} initialDest={prefilledTransfer?.dest} initialAmount={prefilledTransfer?.amount} />}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
};

export default LiveDashboard;