import React, { Suspense, useState } from 'react';
import { Scene } from './components/Scene';
import { Overlay } from './components/Overlay';
import { Loader } from '@react-three/drei';
import { AppMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('INITIAL');

  return (
    <main className="relative w-full h-screen bg-[#F9F9F7] overflow-hidden">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={null}>
          <Scene mode={mode} />
        </Suspense>
      </div>

      {/* UI Overlay Layer */}
      <Overlay mode={mode} setMode={setMode} />

      {/* Loading Indicator */}
      <Loader 
        containerStyles={{ background: '#F9F9F7' }}
        innerStyles={{ background: '#2E4F2F', height: 4 }}
        barStyles={{ background: '#D4AF37', height: 4 }}
        dataStyles={{ color: '#2E4F2F', fontFamily: 'sans-serif', fontWeight: 'bold' }}
      />
    </main>
  );
};

export default App;
