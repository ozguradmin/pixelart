import React, { useEffect, useRef, useState } from 'react';
import { PixelSize } from '../types';
import { downloadCanvasAsPng, generateCodeSnippet } from '../utils/pixelProcessor';

interface CanvasPreviewProps {
  grid: string[] | null;
  size: PixelSize;
  isLoading: boolean;
  onGridUpdate: (newGrid: string[]) => void;
}

type ToolType = 'pencil' | 'eraser' | 'magic-eraser' | 'none';

const CanvasPreview: React.FC<CanvasPreviewProps> = ({ grid, size, isLoading, onGridUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // View State
  const [scale, setScale] = useState(1);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Tool State
  const [activeTool, setActiveTool] = useState<ToolType>('none');
  const [brushSize, setBrushSize] = useState(1);
  const [drawColor, setDrawColor] = useState('#ffffff');
  const [isDragging, setIsDragging] = useState(false);

  // Auto-fit canvas to container
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      const maxDim = Math.min(width, height) - 64; 
      const newScale = Math.max(1, Math.floor(maxDim / size));
      setScale(newScale);
    }
  }, [size, containerRef.current?.offsetWidth, containerRef.current?.offsetHeight]);

  // Set default tool when grid loads
  useEffect(() => {
    if (grid) {
      setActiveTool('pencil');
      // Find first non-transparent color for default pencil
      const firstColor = grid.find(c => c !== 'transparent');
      if (firstColor) setDrawColor(firstColor);
    }
  }, [grid]);

  // Draw grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    grid.forEach((color, i) => {
      const x = i % size;
      const y = Math.floor(i / size);
      if (color === 'transparent') {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#1e293b' : '#334155';
      } else {
        ctx.fillStyle = color;
      }
      ctx.fillRect(x, y, 1, 1);
    });
  }, [grid, size]);

  const handleDownload = () => {
    if (grid) downloadCanvasAsPng(grid, size);
  };

  const handleCopyCode = () => {
    if (!grid) return;
    const code = generateCodeSnippet(grid, size);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Drawing Logic ---

  const getPixelCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = Math.floor((clientX - rect.left) / scale);
    const y = Math.floor((clientY - rect.top) / scale);
    return { x, y };
  };

  const applyTool = (x: number, y: number) => {
    if (!grid || x < 0 || x >= size || y < 0 || y >= size) return;

    const index = y * size + x;
    const newGrid = [...grid];
    let hasChanged = false;

    if (activeTool === 'magic-eraser') {
      const targetColor = grid[index];
      if (targetColor !== 'transparent') {
        for (let i = 0; i < newGrid.length; i++) {
          if (newGrid[i] === targetColor) {
            newGrid[i] = 'transparent';
          }
        }
        hasChanged = true;
      }
    } else {
      // Standard Pencil/Eraser with Brush Size
      const halfBrush = Math.floor(brushSize / 2);
      const startX = x - halfBrush;
      const startY = y - halfBrush;
      const endX = startX + brushSize;
      const endY = startY + brushSize;

      for (let py = startY; py < endY; py++) {
        for (let px = startX; px < endX; px++) {
          if (px >= 0 && px < size && py >= 0 && py < size) {
            const idx = py * size + px;
            const newColor = activeTool === 'pencil' ? drawColor : 'transparent';
            if (newGrid[idx] !== newColor) {
              newGrid[idx] = newColor;
              hasChanged = true;
            }
          }
        }
      }
    }

    if (hasChanged) {
      onGridUpdate(newGrid);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const coords = getPixelCoords(e);
    if (coords) applyTool(coords.x, coords.y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || activeTool === 'magic-eraser') return;
    const coords = getPixelCoords(e);
    if (coords) applyTool(coords.x, coords.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex-1 bg-background relative flex flex-col h-full overflow-hidden">
      {/* Top Toolbar */}
      <div className="bg-surface border-b border-slate-700 p-2 flex items-center justify-between gap-4 overflow-x-auto">
        
        {/* Left: Tools */}
        <div className="flex items-center gap-2">
          {grid ? (
            <>
              <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-600">
                <button
                  onClick={() => setActiveTool('pencil')}
                  className={`p-2 rounded transition-all ${activeTool === 'pencil' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  title="Kalem"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button
                  onClick={() => setActiveTool('eraser')}
                  className={`p-2 rounded transition-all ${activeTool === 'eraser' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  title="Silgi"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <button
                  onClick={() => setActiveTool('magic-eraser')}
                  className={`p-2 rounded transition-all ${activeTool === 'magic-eraser' ? 'bg-red-500 text-white shadow' : 'text-slate-400 hover:text-red-400'}`}
                  title="Renk Silici (Tıkla ve Rengi Yok Et)"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </button>
              </div>

              {/* Tool Settings */}
              <div className="flex items-center gap-3 px-3 border-l border-slate-600">
                {activeTool !== 'magic-eraser' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">Boyut: {brushSize}px</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      value={brushSize} 
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-20 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                )}
                
                {activeTool === 'pencil' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold">Renk</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={drawColor}
                        onChange={(e) => setDrawColor(e.target.value)}
                        className="w-6 h-6 rounded overflow-hidden cursor-pointer border border-slate-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <span className="text-slate-500 text-sm font-medium">Araçlar</span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
           <button
            onClick={() => setShowCode(!showCode)}
            disabled={!grid}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            JSON
          </button>
          <button
            onClick={handleDownload}
            disabled={!grid}
            className="bg-primary hover:bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            İndir
          </button>
        </div>
      </div>

      <div 
        ref={containerRef} 
        className="flex-1 flex items-center justify-center p-8 overflow-auto cursor-default"
        style={{ 
          backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', 
          backgroundSize: '20px 20px' 
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {!grid && !isLoading && (
          <div className="text-center text-slate-500 select-none">
            <div className="text-6xl mb-4 opacity-20">🎨</div>
            <p>Başlamak için sol taraftan bir prompt girin.</p>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-32 h-32 bg-slate-800 rounded-lg mb-4"></div>
            <div className="h-2 w-24 bg-slate-800 rounded"></div>
          </div>
        )}

        {showCode && grid && (
          <div className="absolute inset-10 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg p-4 z-50 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
               <span className="text-green-400 font-mono text-xs">RLE Compressed JSON</span>
               <div className="flex gap-2">
                 <button 
                  onClick={handleCopyCode}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded border border-slate-600 transition-colors"
                >
                  {copied ? 'Kopyalandı!' : 'Kopyala'}
                </button>
                <button onClick={() => setShowCode(false)} className="text-slate-400 hover:text-white">✕</button>
               </div>
            </div>
            <div className="flex-1 overflow-auto bg-black p-2 rounded border border-slate-800">
               <pre className="font-mono text-[10px] text-green-500 whitespace-pre-wrap break-all leading-relaxed">
                 {generateCodeSnippet(grid, size)}
               </pre>
            </div>
          </div>
        )}

        <div className={`relative shadow-2xl transition-opacity duration-500 ${isLoading || (!grid && !isLoading) ? 'opacity-0 hidden' : 'opacity-100'}`}>
           {/* The actual canvas is small (e.g. 32px), we scale it with CSS transform */}
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`
              image-pixelated bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgHQAml4DTymw38xHgAAODP7TColl/5bAAAAAElFTkSuQmCC')]
              ${activeTool === 'pencil' ? 'cursor-cell' : ''}
              ${activeTool === 'eraser' ? 'cursor-crosshair' : ''}
              ${activeTool === 'magic-eraser' ? 'cursor-not-allowed' : ''} 
            `}
            style={{
              width: `${size * scale}px`,
              height: `${size * scale}px`,
              imageRendering: 'pixelated', // Critical for pixel art look
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          />
          {activeTool !== 'none' && grid && (
             <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-slate-400 font-mono">
                {activeTool === 'pencil' && 'Çizim Modu'}
                {activeTool === 'eraser' && 'Silgi Modu'}
                {activeTool === 'magic-eraser' && 'Renk Silici (Tıkla)'}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvasPreview;