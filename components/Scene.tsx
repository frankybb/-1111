
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, SoftShadows, ContactShadows, Float } from '@react-three/drei';
import { VoxelTree } from './VoxelTree';
import { VintageCamera } from './VintageCamera';
import { GiftBox, StarOrnament, Snowman, TreeTopper, IntroGiftBox, ConfettiExplosion, FairyLights, SnowflakeOrnament, GoldTreeOrnament, BulbOrnament } from './Ornaments';
import { Palette, AppMode } from '../types';
import * as THREE from 'three';

const Lights = () => (
    <>
        {/* Stronger Ambient for general visibility + Saturation */}
        <ambientLight intensity={1.5} color="#ffffff" /> 
        
        {/* Main Key Light (Sun) - Increased Intensity */}
        <directionalLight 
            position={[10, 20, 10]} 
            intensity={6} 
            castShadow 
            shadow-mapSize={[2048, 2048]} 
            shadow-bias={-0.0001}
        >
            <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20, 1, 60]} />
        </directionalLight>
        
        {/* Warm Rim/Side Light - Increased */}
        <spotLight position={[-15, 15, 5]} intensity={5} angle={0.6} penumbra={0.5} color="#FFF5E0" />
        
        {/* Front Fill Light to brighten up the tree faces */}
        <pointLight position={[0, 5, 20]} intensity={3} color="#ffffff" decay={2} distance={50} />

        {/* Top fill for overall brightness */}
        <rectAreaLight width={20} height={20} intensity={3} color="#ffffff" position={[0, 20, 0]} rotation={[-Math.PI / 2, 0, 0]} />

        {/* Top Down Spot Light (Strong overhead spotlight effect) */}
        <spotLight 
            position={[0, 30, 0]} 
            angle={0.4} 
            penumbra={0.2} 
            intensity={10} 
            color="#FFF0DD" 
            castShadow
            distance={60}
            target-position={[0, 0, 0]}
        />
    </>
);

interface OrnamentConfig {
    id: number;
    type: 'camera' | 'gift' | 'star' | 'snowman' | 'topper' | 'snowflake' | 'goldTree' | 'redBulb' | 'yellowBulb';
    treePos: THREE.Vector3;
    treeRot: THREE.Euler;
    scatterPos: THREE.Vector3;
    scatterRot: THREE.Euler;
    initialPos: THREE.Vector3;
    scale: number;
}

// Wrapper for individual animated ornaments
const AnimatedOrnament: React.FC<{ 
    mode: AppMode;
    config: OrnamentConfig; 
    children: React.ReactNode 
}> = ({ mode, config, children }) => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        
        // Slightly slower interpolation for ornaments to give weight
        const step = Math.min(1, delta * 3);

        let targetPos = config.treePos;
        let targetRot = config.treeRot;
        let targetScale = config.scale;

        if (mode === 'INITIAL') {
            targetPos = config.initialPos;
            targetScale = 0.2; // Small but visible inside box
            targetRot = config.scatterRot; // Jumbled orientation inside box
        } else if (mode === 'SCATTERED') {
            targetPos = config.scatterPos;
            targetRot = config.scatterRot; 
            targetScale = config.scale;
        }

        // --- Fountain Effect Logic for Ornaments ---
        // If we are exploding out (SCATTERED) and currently deep in the box,
        // suppress horizontal movement to avoid clipping walls.
        if (mode === 'SCATTERED' && groupRef.current.position.y < -1) {
             // Let lerp handle Y (which goes up), but damp X/Z
             const currentX = groupRef.current.position.x;
             const currentZ = groupRef.current.position.z;
             
             // Manually interpolate X/Z slower towards 0 (center) while Y shoots up
             groupRef.current.position.x = THREE.MathUtils.lerp(currentX, 0, step * 0.5);
             groupRef.current.position.z = THREE.MathUtils.lerp(currentZ, 0, step * 0.5);
             
             // Only lerp Y normally
             groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetPos.y, step);
        } else {
             // Normal interpolation
             groupRef.current.position.lerp(targetPos, step);
        }

        const curQ = groupRef.current.quaternion;
        const targetQ = new THREE.Quaternion().setFromEuler(targetRot);
        curQ.slerp(targetQ, step);

        const currentScale = groupRef.current.scale.x;
        const newScale = THREE.MathUtils.lerp(currentScale, targetScale, step);
        groupRef.current.scale.setScalar(newScale);
    });

    // Disable floating rotation when scattered to meet "no self-rotation" requirement
    const floatRotation = mode === 'SCATTERED' ? 0 : 0.5;
    const floatSpeed = mode === 'SCATTERED' ? 0 : 2; 

    return (
        <group ref={groupRef}>
            <Float 
                speed={floatSpeed} 
                rotationIntensity={floatRotation} 
                floatIntensity={mode === 'SCATTERED' ? 1 : 0.5} 
                floatingRange={mode === 'SCATTERED' ? [-0.5, 0.5] : [-0.1, 0.1]}
            >
                {children}
            </Float>
        </group>
    )
}

export const Scene: React.FC<{ mode: AppMode }> = ({ mode }) => {
  
  // Orchestration State
  // internalMode: Controls the movement of voxels and ornaments
  // isBoxOpen: Controls the opening/closing of the gift box lid
  const [internalMode, setInternalMode] = useState<AppMode>('INITIAL');
  const [isBoxOpen, setIsBoxOpen] = useState(false);

  useEffect(() => {
      let timeout: ReturnType<typeof setTimeout>;

      if (mode === 'INITIAL') {
          // CLOSING SEQUENCE
          // 1. First, send items back to box
          setInternalMode('INITIAL');
          
          // 2. Wait for items to arrive inside (500ms), then close lid
          timeout = setTimeout(() => {
              setIsBoxOpen(false);
          }, 500);

      } else {
          // OPENING SEQUENCE (or SCATTERED <-> TREE)
          
          // 1. Always ensure box is open immediately
          setIsBoxOpen(true);

          if (internalMode === 'INITIAL') {
              // If we are coming from Closed state:
              // Wait for lid to open slightly (350ms) before exploding items
              timeout = setTimeout(() => {
                  setInternalMode(mode);
              }, 350);
          } else {
              // If box is already open, switch modes immediately
              setInternalMode(mode);
          }
      }
      return () => clearTimeout(timeout);
  }, [mode, internalMode]);

  // Generate Ornaments
  const ornaments = useMemo(() => {
    const configs: OrnamentConfig[] = [];
    
    // Updated weights: More Cameras, Balanced distribution
    const types = [
        'camera', 'camera', 'camera', 'camera', 'camera', 'camera', 
        'gift', 'gift', 'gift', 'gift',
        'snowman', 'snowman', 'snowman',
        'star', 'star',
        'snowflake', 'snowflake',
        'goldTree', 'goldTree',
        'redBulb', 'redBulb', 'redBulb',
        'yellowBulb', 'yellowBulb', 'yellowBulb'
    ] as const;
    
    const count = 90; // Increased count for fuller tree
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~2.3999 rad (Golden Angle)

    // 1. Topper (Always ID 0)
    configs.push({
        id: 0,
        type: 'topper',
        treePos: new THREE.Vector3(0, 9.8, 0),
        treeRot: new THREE.Euler(0, 0, 0),
        scatterPos: new THREE.Vector3(0, 15, 0),
        scatterRot: new THREE.Euler(Math.random(), Math.random(), Math.random()),
        initialPos: new THREE.Vector3(0, -5, 0),
        scale: 1
    });

    // 2. Generate Decorations using Golden Spiral Distribution
    for (let i = 1; i < count; i++) {
        // Uniform height distribution (Phyllotaxis on a cone)
        const hProgress = i / count; 
        const y = -5 + hProgress * 12; // From -5 to 7 vertically
        
        // Calculate radius at this height based on cone shape
        const normalizedH = (y + 6) / 16; 
        const coneRadius = 6.8 * (1 - Math.max(0, normalizedH));
        const radius = coneRadius + 0.6; // Stick out slightly
        
        // Golden Angle distribution ensures perfect uniformity without clumping
        const theta = i * goldenAngle;
        
        const x = radius * Math.cos(theta);
        const z = radius * Math.sin(theta);
        
        const treePos = new THREE.Vector3(x, y, z);
        
        // Rotation: Face outward from center
        const treeRot = new THREE.Euler(0, -theta, 0); 
        
        // Adjust specific types
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Orient specific ornaments correctly
        if (type === 'star' || type === 'snowflake' || type === 'goldTree') {
             treeRot.y += Math.PI / 2; 
        }
        if (type === 'redBulb' || type === 'yellowBulb') {
            treeRot.x -= Math.PI / 4; 
        }

        // --- Scatter Position Calculation (Spherical Cloud) ---
        const sR = 12 + Math.random() * 10;
        const sTheta = Math.random() * Math.PI * 2;
        const sPhi = Math.acos((Math.random() * 2) - 1);
        const scatterPos = new THREE.Vector3(
            sR * Math.sin(sPhi) * Math.cos(sTheta),
            sR * Math.sin(sPhi) * Math.sin(sTheta),
            sR * Math.cos(sPhi)
        );

        const scatterRot = new THREE.Euler(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );

        // --- Initial Position (Packed Inside Box) ---
        // Box internal volume roughly: X/Z [-1.4, 1.4], Y [-5.6, -2.5]
        const initialPos = new THREE.Vector3(
            (Math.random() - 0.5) * 2.5,
            -5.5 + Math.random() * 2.5,
            (Math.random() - 0.5) * 2.5
        );
        
        let scale = 0.6 + Math.random() * 0.4;
        if (type === 'redBulb' || type === 'yellowBulb') scale = 0.8;
        if (type === 'camera') scale = 1.1; 

        configs.push({
            id: i,
            type,
            treePos,
            treeRot,
            scatterPos,
            scatterRot,
            initialPos,
            scale
        });
    }

    return configs;
  }, []);

  const renderOrnament = (config: OrnamentConfig) => {
      switch(config.type) {
          case 'topper': return <TreeTopper />;
          case 'camera': return <VintageCamera />;
          case 'gift': return <GiftBox />;
          case 'star': return <StarOrnament />;
          case 'snowman': return <Snowman />;
          case 'snowflake': return <SnowflakeOrnament />;
          case 'goldTree': return <GoldTreeOrnament />;
          case 'redBulb': return <BulbOrnament color={Palette.LightRed} />;
          case 'yellowBulb': return <BulbOrnament color={Palette.LightYellow} />;
          default: return null;
      }
  }

  return (
    <Canvas shadows camera={{ position: [20, 10, 20], fov: 30 }} dpr={[1, 2]} gl={{ toneMappingExposure: 1.8 }}>
      {/* Global Effects */}
      <Environment background={false}>
          {/* Brighter Studio Lighting Environment */}
          <group rotation={[-Math.PI / 2, 0, 0]}>
            {/* Top Light Panel */}
            <mesh position={[0, 0, 15]} scale={[30, 30, 1]}>
                <planeGeometry />
                <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
            </mesh>
            {/* Front Light Panel */}
            <mesh position={[10, 0, 5]} rotation={[0, -0.5, 0]} scale={[10, 20, 1]}>
                <planeGeometry />
                <meshBasicMaterial color="#FFF5E0" toneMapped={false} />
            </mesh>
            {/* Side Light Panel */}
             <mesh position={[-10, 0, 5]} rotation={[0, 0.5, 0]} scale={[10, 20, 1]}>
                <planeGeometry />
                <meshBasicMaterial color="#E0F0FF" toneMapped={false} />
            </mesh>
          </group>
      </Environment>
      <SoftShadows size={10} samples={16} focus={0.5} />
      <Lights />
      
      {/* Controls */}
      <OrbitControls 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2} 
        enablePan={false} 
        minDistance={10} 
        maxDistance={50} 
        autoRotate={mode !== 'INITIAL'}
        autoRotateSpeed={0.8}
        target={[0, 2, 0]}
      />
      
      {/* Main Content Group */}
      <group position={[0, -2, 0]}>
        
        {/* Confetti - Only shows when box is actively open */}
        <ConfettiExplosion active={isBoxOpen} />

        {/* Fairy Lights - Only shows when box is actively open */}
        <FairyLights active={isBoxOpen} />

        {/* The Intro Box - Reacts directly to 'isBoxOpen' for immediate lid feedback */}
        <IntroGiftBox isOpen={isBoxOpen} />

        {/* Trees and Ornaments react to 'internalMode' which is delayed */}
        <VoxelTree mode={internalMode} />

        {/* Dynamic Ornaments */}
        {ornaments.map((config) => (
            <AnimatedOrnament key={config.id} mode={internalMode} config={config}>
                {renderOrnament(config)}
            </AnimatedOrnament>
        ))}

      </group>

      <ContactShadows opacity={0.6} scale={40} blur={2} far={10} resolution={512} color="#000000" position={[0, -7, 0]} />
      
      {/* Background Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -7.1, 0]} receiveShadow>
         <planeGeometry args={[100, 100]} />
         <meshStandardMaterial color={Palette.PaperWhite} envMapIntensity={0.5} />
      </mesh>

    </Canvas>
  );
};
