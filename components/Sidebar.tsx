import React, { useState } from 'react';
import { PixelSize } from '../types';

interface SidebarProps {
  onGenerate: (prompt: string, size: PixelSize) => void;
  isGenerating: boolean;
  selectedSize: PixelSize;
  onSizeChange: (size: PixelSize) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onGenerate, isGenerating, selectedSize, onSizeChange }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt, selectedSize);
    }
  };

  const sizes = [
    { value: PixelSize.XS, label: '32x32', desc: 'Minimalist' },
    { value: PixelSize.S, label: '64x64', desc: 'Retro' },
    { value: PixelSize.M, label: '128x128', desc: 'Detailed' },
    { value: PixelSize.L, label: '256x256', desc: 'HD Sprite' },
  ];

  return (
    <aside className="w-full md:w-80 lg:w-96 bg-surface border-r border-slate-700 flex flex-col h-full overflow-y-auto z-10 shadow-xl">
      <div className="p-6 flex-1 flex flex-col gap-8">
        <div>
          <h1 className="font-pixel text-xl text-primary mb-2 tracking-tighter">
            <span className="text-secondary">Pixel</span>Gen AI
          </h1>
          <p className="text-slate-400 text-sm">
            Gemini destekli metinden pixel-art'a dönüştürücü.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tuval Boyutu
            </label>
            <div className="grid grid-cols-2 gap-3">
              {sizes.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => onSizeChange(s.value)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 ${
                    selectedSize === s.value
                      ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold font-mono text-sm">{s.label}</span>
                  <span className="text-[10px] opacity-70 mt-1">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Örn: Uçan bir ada, üzerinde şelale ve küçük bir kulübe..."
              className="w-full h-32 bg-background border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none placeholder-slate-600 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className={`
              w-full py-4 rounded-lg font-bold text-sm uppercase tracking-widest transition-all
              flex items-center justify-center gap-2
              ${isGenerating 
                ? 'bg-slate-700 cursor-not-allowed text-slate-500' 
                : 'bg-gradient-to-r from-primary to-secondary hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]'
              }
            `}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Oluşturuluyor...
              </>
            ) : (
              'Oluştur'
            )}
          </button>
        </form>

        <div className="mt-auto pt-6 border-t border-slate-700/50">
          <div className="text-xs text-slate-500 text-center">
             Model: <span className="text-slate-300">gemini-2.5-flash-image</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
