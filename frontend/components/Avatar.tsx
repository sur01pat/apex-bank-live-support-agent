
import React, { useEffect, useState, useRef, useMemo } from 'react';

interface AvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  isThinking?: boolean;
  isTyping?: boolean;
  audioLevel?: number; // 0 to 1
  sentiment?: 'neutral' | 'friendly' | 'analytical' | 'urgent';
  status: 'online' | 'offline' | 'connecting' | 'error';
  reaction?: 'none' | 'success' | 'error';
}

const Avatar: React.FC<AvatarProps> = ({ 
  isSpeaking, 
  isListening, 
  isThinking = false, 
  isTyping = false,
  audioLevel = 0,
  sentiment = 'neutral',
  status, 
  reaction = 'none' 
}) => {
  const [currentReaction, setCurrentReaction] = useState<'none' | 'success' | 'error'>('none');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const avatarUrl = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop";

  // Mouse tracking for parallax head-bob
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (status !== 'online') return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - (rect.left + rect.width / 2)) / 35;
        const y = (e.clientY - (rect.top + rect.height / 2)) / 35;
        setMousePos({ x, y });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [status]);

  useEffect(() => {
    if (reaction !== 'none') {
      setCurrentReaction(reaction);
      const timer = setTimeout(() => setCurrentReaction('none'), 1500);
      return () => clearTimeout(timer);
    }
  }, [reaction]);

  const getStatusColor = () => {
    if (currentReaction === 'error' || status === 'error') return 'border-rose-500 shadow-[0_0_60px_rgba(244,63,94,0.4)]';
    if (currentReaction === 'success') return 'border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.4)]';
    if (isThinking) return 'border-indigo-400 shadow-[0_0_50px_rgba(129,140,248,0.3)]';
    if (isSpeaking) return 'border-blue-400 shadow-[0_0_50px_rgba(96,165,250,0.4)]';
    if (isListening) return 'border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.3)]';
    return 'border-slate-800 shadow-[0_0_30px_rgba(0,0,0,0.3)]';
  };

  // Dynamic sentiment styles
  const sentimentStyles = useMemo(() => {
    switch (sentiment) {
      case 'friendly': return { 
        filter: 'saturate(1.2) sepia(0.05) brightness(1.05) contrast(1.05)',
        glow: 'rgba(52, 211, 153, 0.4)',
        displacement: 2 
      };
      case 'analytical': return { 
        filter: 'saturate(0.7) hue-rotate(180deg) brightness(0.95)',
        glow: 'rgba(129, 140, 248, 0.4)',
        displacement: -1 
      };
      case 'urgent': return { 
        filter: 'saturate(1.5) contrast(1.2) brightness(1.1) hue-rotate(-10deg)',
        glow: 'rgba(244, 63, 94, 0.5)',
        displacement: 4 
      };
      default: return { 
        filter: 'saturate(1) brightness(1)',
        glow: 'rgba(96, 165, 250, 0.3)',
        displacement: 0 
      };
    }
  }, [sentiment]);

  return (
    <div ref={containerRef} className="relative flex flex-col items-center justify-center select-none perspective-1000 shrink-0">
      
      {/* Background Pulse Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {isListening && <div className="absolute w-[320px] h-[320px] rounded-full border border-emerald-500/20 animate-sonar-slow" />}
        {isSpeaking && <div className="absolute w-[300px] h-[300px] rounded-full border border-blue-500/20 animate-sonar-fast" />}
        {(isThinking || status === 'online') && <div className="absolute w-[340px] h-[340px] rounded-full border border-white/5 animate-pulse" />}
      </div>

      <div 
        className={`relative w-48 h-48 md:w-56 md:h-56 rounded-full border-[3px] overflow-hidden transition-all duration-700 transform-gpu bg-slate-900 ${getStatusColor()} ${
          currentReaction === 'success' ? 'animate-nod' : 
          currentReaction === 'error' ? 'animate-shake' : 
          'animate-idle-bob'
        }`}
        style={{ 
          transform: `rotateY(${mousePos.x}deg) rotateX(${-mousePos.y}deg)`,
          transition: 'transform 0.2s cubic-bezier(0.33, 1, 0.68, 1), border-color 0.5s ease, box-shadow 0.5s ease'
        }}
      >
        <img 
          src={avatarUrl} 
          alt="AI Concierge" 
          className={`w-full h-full object-cover transition-all duration-1000 animate-digital-blink ${
            status === 'offline' ? 'grayscale opacity-20 scale-110 blur-sm' : 
            isThinking ? 'brightness-75 saturate-150' : ''
          }`}
          style={{ 
            filter: `${status === 'online' ? sentimentStyles.filter : ''} url(#sentiment-warp)`,
            transform: `scale(${1 + (audioLevel * 0.04)})` 
          }}
        />

        {/* Digital Holographic Vocalizer (Lip-Sync Bars) */}
        {isSpeaking && status === 'online' && (
          <div className="absolute bottom-[26%] left-1/2 -translate-x-1/2 flex items-end gap-1 px-4 py-2 pointer-events-none z-30">
            {[0.7, 1.2, 1.8, 1.3, 0.8].map((sensitivity, i) => (
              <div 
                key={i} 
                className="w-1 rounded-full transition-all duration-75 bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]"
                style={{ 
                  height: `${Math.max(2, audioLevel * 25 * sensitivity)}px`,
                  opacity: 0.3 + audioLevel * 0.7,
                  backgroundColor: sentimentStyles.glow.replace('0.4', '0.8').replace('0.3', '0.8')
                }}
              />
            ))}
          </div>
        )}

        {/* Eye Dilation / Digital Iris Overlay */}
        {status === 'online' && (
          <div className="absolute inset-0 pointer-events-none flex justify-center items-start pt-[34%] z-20 gap-[18%] opacity-60">
            {[1, 2].map(i => (
              <div 
                key={i}
                className="w-1.5 h-1.5 rounded-full blur-[1px] transition-all duration-150"
                style={{ 
                  backgroundColor: sentimentStyles.glow,
                  transform: `scale(${1 + audioLevel * 1.5})`,
                  boxShadow: `0 0 ${4 + audioLevel * 10}px ${sentimentStyles.glow}`
                }}
              />
            ))}
          </div>
        )}

        {/* Dynamic Scanning Line for Thinking */}
        {isThinking && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/40 to-transparent h-1/4 w-full animate-scan-y z-20" />
        )}

        {/* HUD Frame Elements */}
        <div className={`absolute inset-0 border-[15px] border-slate-950/30 pointer-events-none transition-opacity duration-700 ${status === 'online' ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute top-6 left-6 w-6 h-6 border-t-2 border-l-2 border-white/20" />
          <div className="absolute top-6 right-6 w-6 h-6 border-t-2 border-r-2 border-white/20" />
          <div className="absolute bottom-6 left-6 w-6 h-6 border-b-2 border-l-2 border-white/20" />
          <div className="absolute bottom-6 right-6 w-6 h-6 border-b-2 border-r-2 border-white/20" />
        </div>

        {isTyping && (
          <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-blue-600/30 to-transparent flex flex-col items-center justify-end pb-6 z-30">
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}

        {/* Reaction Flashes */}
        <div className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${currentReaction === 'success' ? 'opacity-40 bg-emerald-500/20' : 'opacity-0'}`} />
        <div className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${currentReaction === 'error' ? 'opacity-40 bg-rose-500/20' : 'opacity-0'}`} />
      </div>

      {/* Identity Tag */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 px-6 py-2 rounded-2xl flex items-center gap-4 shadow-2xl transition-all duration-1000">
           <div className={`w-2.5 h-2.5 rounded-full ${
             status === 'connecting' ? 'bg-amber-500 animate-pulse' :
             status === 'error' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' :
             status === 'online' ? (isSpeaking ? 'bg-blue-500 animate-ping' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]') : 'bg-slate-700'
           }`} />
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-200">
             {status === 'connecting' ? 'Synching Link...' : 
              status === 'error' ? 'Secure Link Failed' :
              isThinking ? 'Analyzing Data Context' : 
              isSpeaking ? 'Concierge Transmitting' : 
              isListening ? 'Listening via Secure Node' : 'Agent Suspended'}
           </span>
        </div>
      </div>

      {/* SVG Filters for Face Deformation */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="sentiment-warp">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="2" result="noise" />
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="noise" 
              scale={sentimentStyles.displacement * (1 + audioLevel)} 
              xChannelSelector="R" 
              yChannelSelector="G" 
            />
          </filter>
        </defs>
      </svg>

      <style>{`
        @keyframes sonar-slow {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes sonar-fast {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes scan-y {
          0% { transform: translateY(-150%); }
          100% { transform: translateY(300%); }
        }
        @keyframes nod {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(12px) scale(0.99); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        @keyframes idle-bob {
          0%, 100% { transform: translateY(0) rotateZ(0deg) scale(1); }
          33% { transform: translateY(-10px) rotateZ(0.8deg) scale(1.005); }
          66% { transform: translateY(-4px) rotateZ(-0.5deg) scale(0.995); }
        }
        @keyframes digital-blink {
          0%, 45%, 48%, 52%, 55%, 100% { opacity: 1; filter: brightness(1) contrast(1) scaleY(1); }
          46%, 53% { opacity: 0.8; filter: brightness(1.4) contrast(1.2) saturate(2) hue-rotate(10deg) scaleY(0.95); }
          50% { opacity: 0.4; filter: brightness(0.6) contrast(1.5) scaleY(0.1); }
        }
        .animate-sonar-slow { animation: sonar-slow 4s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-sonar-fast { animation: sonar-fast 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-scan-y { animation: scan-y 2.5s ease-in-out infinite; }
        .animate-nod { animation: nod 0.5s ease-in-out; }
        .animate-shake { animation: shake 0.1s linear 5; }
        .animate-idle-bob { animation: idle-bob 8s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
        .animate-digital-blink { animation: digital-blink 12s step-end infinite; }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
};

export default Avatar;
