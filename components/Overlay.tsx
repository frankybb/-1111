
import React from 'react';
import { AppMode } from '../types';

interface OverlayProps {
    mode: AppMode;
    setMode: (mode: AppMode) => void;
}

export const Overlay: React.FC<OverlayProps> = ({ mode, setMode }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-6 md:p-12 z-10">
      
      {/* Header */}
      <header className="flex flex-col items-start gap-2 transition-opacity duration-500" style={{ opacity: mode === 'INITIAL' ? 0 : 1 }}>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-gray-900 leading-none">
          Christmas <br/>
          <span className="text-green-900">Voxel Collection</span>
        </h1>
        <p className="text-sm md:text-base font-medium text-gray-500 uppercase tracking-widest mt-2">
          Limited Edition • 2024
        </p>
      </header>

      {/* Decorative Corner Text */}
      <div className="absolute top-12 right-12 text-right hidden md:block transition-opacity duration-500" style={{ opacity: mode === 'INITIAL' ? 0 : 1 }}>
        <div className="text-xs font-bold text-gray-400">MATERIAL</div>
        <div className="text-sm font-semibold text-gray-800">Deep Forest & Gold</div>
        <div className="h-8"></div>
        <div className="text-xs font-bold text-gray-400">CAMERA MODEL</div>
        <div className="text-sm font-semibold text-gray-800">Fujifilm X-Series Inspired</div>
      </div>

      {/* Bottom CTA / Controls */}
      <div className="pointer-events-auto flex flex-col items-center md:items-start w-full md:w-auto mb-10 md:mb-0">
        
        {mode === 'INITIAL' && (
             <button 
                onClick={() => setMode('SCATTERED')}
                className="group relative px-10 py-5 bg-green-900 text-white font-bold rounded-full overflow-hidden shadow-2xl hover:scale-105 transition-all duration-300"
             >
                <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-yellow-500 rounded-full group-hover:w-80 group-hover:h-80 opacity-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></span>
                <span className="relative text-xl tracking-wider">OPEN GIFT</span>
             </button>
        )}

        {mode !== 'INITIAL' && (
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex flex-wrap gap-2 md:gap-4 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-xl">
                    <button 
                        onClick={() => setMode('SCATTERED')}
                        className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${mode === 'SCATTERED' ? 'bg-green-900 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        SCATTER
                    </button>
                    <button 
                        onClick={() => setMode('TREE')}
                        className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${mode === 'TREE' ? 'bg-green-900 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        ASSEMBLE TREE
                    </button>
                </div>
                
                {/* Back Button */}
                <button 
                    onClick={() => setMode('INITIAL')}
                    className="px-6 py-2 rounded-full font-bold text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all shadow-md"
                >
                    RE-WRAP GIFT
                </button>
            </div>
        )}

      </div>
    </div>
  );
};
