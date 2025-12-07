import React from 'react';
import { Palette } from '../types';
import { RoundedBox } from '@react-three/drei';

export const VintageCamera: React.FC<{ position?: [number, number, number]; rotation?: [number, number, number]; scale?: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* --- Body (Leatherette) --- */}
      <RoundedBox args={[1.5, 0.9, 0.5]} radius={0.05} smoothness={4} castShadow receiveShadow position={[0, 0, 0]}>
        <meshStandardMaterial 
          color={Palette.CameraBlack} 
          roughness={0.8} // Leather texture
          metalness={0.1} 
        />
      </RoundedBox>

      {/* --- Top Plate (Silver Magnesium Alloy) --- */}
      <mesh castShadow receiveShadow position={[0, 0.46, 0]}>
        <boxGeometry args={[1.52, 0.35, 0.52]} />
        <meshStandardMaterial 
          color={Palette.CameraSilver} 
          roughness={0.25} 
          metalness={0.8} 
        />
      </mesh>

      {/* --- Lens System --- */}
      <group position={[0.3, 0, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Base Ring */}
        <mesh castShadow position={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.38, 0.38, 0.2, 32]} />
          <meshStandardMaterial color={Palette.CameraSilver} roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Black Barrel */}
        <mesh castShadow position={[0, 0, 0.25]}>
          <cylinderGeometry args={[0.32, 0.32, 0.2, 32]} />
          <meshStandardMaterial color="#111" roughness={0.6} />
        </mesh>
        {/* Front Element Glass */}
        <mesh position={[0, 0, 0.36]}>
            <cylinderGeometry args={[0.25, 0.25, 0.02, 32]} />
            <meshPhysicalMaterial 
                color="#220033" 
                roughness={0.0} 
                metalness={0.9} 
                transmission={0.2}
                clearcoat={1}
            />
        </mesh>
      </group>

      {/* --- Dials & Controls (Fuji Style) --- */}
      {/* Shutter Speed Dial */}
      <mesh castShadow position={[0.4, 0.65, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.15, 16]} />
        <meshStandardMaterial color="#E0E0E0" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Exposure Comp Dial */}
      <mesh castShadow position={[0.7, 0.65, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.12, 16]} />
        <meshStandardMaterial color="#E0E0E0" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Shutter Button (Threaded) */}
      <mesh castShadow position={[0.2, 0.65, 0.1]}>
        <cylinderGeometry args={[0.06, 0.06, 0.1, 16]} />
        <meshStandardMaterial color="#A0A0A0" roughness={0.2} metalness={0.9} />
      </mesh>
       {/* Hot Shoe */}
      <mesh castShadow position={[0, 0.66, 0]}>
        <boxGeometry args={[0.25, 0.05, 0.25]} />
        <meshStandardMaterial color="#333" metalness={0.8} />
      </mesh>

      {/* --- Viewfinder Window (Hybrid style) --- */}
      <mesh position={[-0.55, 0.45, 0.26]}>
        <boxGeometry args={[0.2, 0.15, 0.02]} />
        <meshPhysicalMaterial color="#333" roughness={0.2} metalness={0.8} clearcoat={1} />
      </mesh>

    </group>
  );
};