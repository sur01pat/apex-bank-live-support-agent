
import React from 'react';

interface Asset {
  id: string;
  url: string;
  type: string;
  mimeType: string;
  timestamp: number;
}

interface AssetVaultProps {
  assets: Asset[];
}

const AssetVault: React.FC<AssetVaultProps> = ({ assets }) => {
  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Generated Asset Vault
        </h3>
        <span className="text-[10px] text-slate-600 bg-slate-800/50 px-2 py-0.5 rounded-full">{assets.length} items</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
        {assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-800 rounded-2xl opacity-40">
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[10px] font-medium">Vault Empty</p>
          </div>
        ) : (
          assets.map((asset) => (
            <div 
              key={asset.id} 
              className="relative group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {asset.mimeType.startsWith('video/') ? (
                <video 
                  src={asset.url} 
                  className="w-full h-auto object-cover" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                />
              ) : (
                <img src={asset.url} alt={asset.type} className="w-full h-auto object-cover" />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{asset.type}</span>
                <span className="text-[8px] text-slate-400">{new Date(asset.timestamp).toLocaleTimeString()}</span>
              </div>
              
              <div className="absolute top-2 right-2 flex gap-1">
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded text-white shadow-lg ${
                  asset.mimeType.startsWith('video/') ? 'bg-purple-600' : 'bg-blue-600'
                }`}>
                  {asset.mimeType.startsWith('video/') ? 'HD_VIDEO' : 'STATIC_ASSET'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssetVault;
