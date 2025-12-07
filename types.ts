
import * as THREE from 'three';

export enum Palette {
  // Refined "Mosaic" Tree Colors - More Vivid/Saturated
  DeepForest = '#005C35',   // Richer, deeper Emerald (More saturated)
  ForestGreen = '#008F60',  // Strong Teal Green (Vibrant)
  SageGreen = '#4CAF50',    // Bright vibrant Green
  LightFern = '#A5D6A7',    // Clean bright Mint
  
  // Accents
  SoftGold = '#FFC107',     // Richer Gold
  PaperWhite = '#FFFAF0',   // Warm white background
  
  // Camera & Props
  CameraBlack = '#111111',
  CameraSilver = '#E0E0E0',
  
  // Box
  LuxuryGreen = '#2F5233',  // Matte Forest Green (Reference Match)
  
  // Misc
  RibbonRed = '#D50000',    // Vivid Red
  OliveGreen = '#558B2F',   
  WarmLight = '#FFF8E1',

  // New Bulb Colors - Glowing
  LightRed = '#FF0000',     // Pure Red Glow
  LightYellow = '#FFD600',  // Pure Gold/Yellow Glow
}

export type AppMode = 'INITIAL' | 'SCATTERED' | 'TREE';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface VoxelData {
  position: [number, number, number];
  color: string;
}

export interface ConfettiData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  rotationSpeed: THREE.Vector3;
  color: string;
  scale: number;
}
