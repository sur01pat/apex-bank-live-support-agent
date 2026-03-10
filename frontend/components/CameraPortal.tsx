
import React, { useState, useEffect, useCallback } from 'react';

interface CameraPortalProps {
  isActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const CameraPortal: React.FC<CameraPortalProps> = ({ isActive, videoRef }) => {
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [hasStream, setHasStream] = useState(false);

  // Check if we actually have a stream attached to the video element
  useEffect(() => {
    const checkStream = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        setHasStream(true);
      } else {
        setHasStream(false);
      }
    };

    const interval = setInterval(checkStream, 1000);
    return () => clearInterval(interval);
  }, [videoRef, isActive]);

  const toggleCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        const newState = !videoTracks[0].enabled;
        videoTracks.forEach(track => track.enabled = newState);
        setIsCameraEnabled(newState);
      }
    }
  }, [videoRef]);

  return (
    <div className="relative w-full aspect-video rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-inner group">
      {!isActive || !hasStream ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 z-10 bg-slate-950/40 backdrop-blur-sm">
          <svg className="w-12 h-12 mb-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
            {!isActive ? 'Vision Portal Offline' : 'Initializing Vision...'}
          </span>
          {isActive && !hasStream && (
            <p className="text-[8px] mt-2 opacity-50 px-8 text-center">
              Please ensure camera permissions are granted in your browser settings.
            </p>
          )}
        </div>
      ) : null}
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-all duration-700 ${
          isActive && isCameraEnabled ? 'opacity-100' : 'opacity-0 scale-110 blur-sm'
        }`}
      />

      {isActive && hasStream && (
        <>
          {/* Scanning Line Animation */}
          {isCameraEnabled && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
              <div className="w-full h-[2px] bg-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-scan" />
            </div>
          )}
          
          {/* HUD Overlay */}
          <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none z-30">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  <div className="w-1 h-3 bg-blue-500" />
                  <div className="w-3 h-1 bg-blue-500" />
                </div>
                <div className="bg-slate-950/80 px-2 py-0.5 rounded border border-blue-500/30">
                   <span className="text-[9px] font-mono text-blue-400">FPS: 24.0</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-1">
                  <div className="w-3 h-1 bg-blue-500" />
                  <div className="w-1 h-3 bg-blue-500" />
                </div>
                <div className={`px-2 py-0.5 rounded border flex items-center gap-1.5 transition-colors ${
                  isCameraEnabled ? 'bg-blue-900/40 border-blue-500/30' : 'bg-rose-900/40 border-rose-500/30'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isCameraEnabled ? 'bg-blue-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isCameraEnabled ? 'text-blue-400' : 'text-rose-400'}`}>
                    {isCameraEnabled ? 'Vision Active' : 'Vision Muted'}
                  </span>
                </div>
              </div>
            </div>

            {/* Interaction Label */}
            <div className="flex justify-center">
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] bg-slate-950/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700/50 shadow-2xl">
                AI Multimodal Core Processing
              </span>
            </div>
          </div>

          {/* Camera Controls Overlay (appears on hover) */}
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-40">
            <button
              onClick={toggleCamera}
              className={`p-4 rounded-full transition-all transform hover:scale-110 active:scale-95 shadow-2xl pointer-events-auto ${
                isCameraEnabled ? 'bg-slate-100 text-slate-950' : 'bg-rose-600 text-white'
              }`}
              title={isCameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isCameraEnabled ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              )}
            </button>
          </div>
        </>
      )}
      
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-50px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(400px); opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default CameraPortal;
