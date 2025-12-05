import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CanvasPreview from './components/CanvasPreview';
import { PixelSize } from './types';
import { generatePixelArtImage } from './services/geminiService';
import { processImageToGrid } from './utils/pixelProcessor';

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [selectedSize, setSelectedSize] = useState<PixelSize>(PixelSize.S);
  const [gridData, setGridData] = useState<string[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setHasApiKey(true);
      }
    };
    checkApiKey();
  }, []);

  const handleConnectApiKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success after closing dialog per instructions
      setHasApiKey(true);
    }
  };

  const handleGenerate = async (prompt: string, size: PixelSize) => {
    setIsGenerating(true);
    setError(null);
    setGridData(null);

    try {
      // 1. Generate Image with Gemini
      const base64Image = await generatePixelArtImage(prompt, size);
      
      // 2. Process image into grid data (downsample & remove background)
      const grid = await processImageToGrid(base64Image, size);
      
      setGridData(grid);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || JSON.stringify(err);

      // Handle Permission/Auth Errors
      if (msg.includes("403") || msg.includes("permission") || msg.includes("Requested entity was not found")) {
        setHasApiKey(false);
        setError("Yetkilendirme hatası: Lütfen geçerli bir API anahtarı seçin.");
      } else {
        setError("Bir hata oluştu: " + msg);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSizeChange = (size: PixelSize) => {
    setSelectedSize(size);
  };

  // Landing Page if no API Key
  if (!hasApiKey) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#0f172a_100%)]" />
        
        <div className="z-10 flex flex-col items-center text-center max-w-md p-8 border border-slate-700 bg-surface/50 backdrop-blur-md rounded-2xl shadow-2xl">
          <div className="mb-6 text-6xl animate-bounce">👾</div>
          <h1 className="font-pixel text-3xl mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            PixelGen AI
          </h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Gemini 3 Pro Image Preview modelini kullanarak harika pixel art tasarımları oluşturun.
          </p>
          
          <div className="bg-slate-900/50 p-4 rounded-lg mb-8 text-xs text-left text-slate-500 border border-slate-800 w-full">
            <p className="mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <strong className="text-slate-300">API Anahtarı Gerekli</strong>
            </p>
            <p>Bu uygulama <code>gemini-3-pro-image-preview</code> modelini kullanır. Lütfen faturalandırma hesabı olan bir projeden API anahtarı seçin.</p>
          </div>

          <button 
            onClick={handleConnectApiKey}
            className="w-full py-4 bg-gradient-to-r from-primary to-secondary rounded-lg font-bold text-sm uppercase tracking-widest hover:shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-95 text-white"
          >
            API Anahtarı Bağla
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col md:flex-row bg-background text-white overflow-hidden">
      {/* Error Toast */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm border border-red-400 text-sm font-medium animate-bounce flex items-center gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold hover:text-red-200">✕</button>
        </div>
      )}

      <Sidebar 
        onGenerate={handleGenerate} 
        isGenerating={isGenerating}
        selectedSize={selectedSize}
        onSizeChange={handleSizeChange}
      />
      
      <main className="flex-1 h-full relative">
        <CanvasPreview 
          grid={gridData} 
          size={selectedSize} 
          isLoading={isGenerating}
          onGridUpdate={setGridData}
        />
      </main>
    </div>
  );
};

export default App;