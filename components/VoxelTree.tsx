
import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { Palette, VoxelData, AppMode } from '../types';
import { Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface VoxelTreeProps {
  mode: AppMode;
}

export const VoxelTree: React.FC<VoxelTreeProps> = ({ mode }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate Voxel Data (Improved Cone Shape)
  const voxels = useMemo(() => {
    const data: VoxelData[] = [];
    
    // The specific 4-tone palette from the reference image
    const colors = [
        Palette.DeepForest, // Dark Slate
        Palette.ForestGreen, // Teal
        Palette.SageGreen, // Sage
        Palette.LightFern, // Pale Mint
    ];

    const treeHeight = 16;
    const maxRadius = 6.5;

    for (let y = 0; y < treeHeight; y++) {
      // Calculate radius at this height (linear cone)
      // Top (y=treeHeight) radius is 0, Bottom (y=0) radius is maxRadius
      const progress = y / treeHeight;
      const radiusAtHeight = maxRadius * (1 - progress);
      
      // Scan a grid at this Y level
      const scanRange = Math.ceil(radiusAtHeight);
      
      for (let x = -scanRange; x <= scanRange; x++) {
        for (let z = -scanRange; z <= scanRange; z++) {
          // Distance from center
          const dist = Math.sqrt(x*x + z*z);
          
          // Add some noise to the radius for organic look
          const noise = (Math.random() - 0.5) * 1.5;
          
          // Solid core + slightly noisy edge
          if (dist <= radiusAtHeight + noise && dist > 0.5) { 
             
             // Random skip for texture
             if(Math.random() > 0.15) {
                // Distribute colors: Lighter colors slightly more probable at tips/edges
                // but generally random to create the mosaic effect
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                // Offset Y to center the tree vertically roughly around 0-8
                data.push({ position: [x, y - 6, z], color });
             }
          } else if (dist <= 0.5 && y < 3) {
             // Trunk base - Dark brownish/black
             data.push({ position: [x, y - 6, z], color: '#2A2A2A' });
          }
        }
      }
    }
    return data;
  }, []);

  // Compute positions and rotations for different states
  const instancesData = useMemo(() => {
    return voxels.map((v) => {
      const treePos = new THREE.Vector3(...v.position);
      
      // Scattered: Random point in a sphere radius 18
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 12 + Math.random() * 10;
      const scatterPos = new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
      );

      // Initial: All clustered inside the gift box at bottom center
      // The box is at y = -4 roughly. Inner size is about 3.3.
      // We want them packed in the box (-1.5 to 1.5 in X/Z, and -5.5 to -2.5 in Y)
      const initialPos = new THREE.Vector3(
          (Math.random()-0.5) * 2.8, 
          -5.5 + Math.random() * 3, 
          (Math.random()-0.5) * 2.8
      );

      // Rotations
      const treeRot = new THREE.Quaternion(); // Identity (Aligned with grid)
      const initialRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI));
      
      // Random rotation for Scattered state (Variable angles)
      const randomEuler = new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      const scatterRot = new THREE.Quaternion().setFromEuler(randomEuler);

      return { 
          treePos, 
          scatterPos, 
          initialPos,
          treeRot,
          initialRot,
          scatterRot
      };
    });
  }, [voxels]);

  // Current animation state management
  const currentPositions = useMemo(() => instancesData.map(p => p.initialPos.clone()), [instancesData]);
  const currentQuaternions = useMemo(() => instancesData.map(p => p.initialRot.clone()), [instancesData]);
  
  useLayoutEffect(() => {
    // Initialize positions
    if (meshRef.current) {
        instancesData.forEach((_, i) => {
            dummy.position.copy(currentPositions[i]);
            dummy.quaternion.copy(currentQuaternions[i]);
            // Set initial scale to something visible so box isn't empty!
            dummy.scale.setScalar(0.2); 
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [instancesData, dummy, currentPositions, currentQuaternions]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Animation Speed
    const step = Math.min(1, delta * 2.5); 

    for (let i = 0; i < voxels.length; i++) {
        let targetPos = instancesData[i].treePos;
        let targetRot = instancesData[i].treeRot;
        
        if (mode === 'SCATTERED') {
            targetPos = instancesData[i].scatterPos;
            targetRot = instancesData[i].scatterRot; 
        } else if (mode === 'INITIAL') {
            targetPos = instancesData[i].initialPos;
            targetRot = instancesData[i].initialRot;
        }

        // --- Fountain Effect / Chimney Logic ---
        // If we are in SCATTERED mode (exploding out) but the particle is still low (inside box),
        // we suppress its horizontal movement (X/Z) so it travels mostly Up (Y).
        // This prevents clipping through the box walls.
        if (mode === 'SCATTERED' && currentPositions[i].y < -2) {
             // Damp X and Z towards center 0
             currentPositions[i].x = THREE.MathUtils.lerp(currentPositions[i].x, 0, step * 0.5);
             currentPositions[i].z = THREE.MathUtils.lerp(currentPositions[i].z, 0, step * 0.5);
             
             // Allow Y to interpolate naturally towards target (which is high)
             currentPositions[i].y = THREE.MathUtils.lerp(currentPositions[i].y, targetPos.y, step);
        } else {
             // Standard Linear Interpolation
             currentPositions[i].lerp(targetPos, step);
        }

        // Interpolate Rotation
        currentQuaternions[i].slerp(targetRot, step);
        dummy.quaternion.copy(currentQuaternions[i]);

        // Scale Logic
        // INITIAL: 0.2 (Visible inside box) -> SCATTERED: 0.8 -> TREE: 1
        const targetScale = mode === 'INITIAL' ? 0.2 : (mode === 'TREE' ? 1 : 0.8);
        
        dummy.position.copy(currentPositions[i]);
        dummy.scale.setScalar(targetScale); 

        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[0, 0, 0]}>
      <Instances ref={meshRef} range={voxels.length} castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.95, 0.95]} />
        <meshStandardMaterial 
            roughness={0.2} 
            metalness={0.1}
            envMapIntensity={2.0}
        />
        {voxels.map((voxel, i) => (
          <Instance
            key={i}
            color={voxel.color}
          />
        ))}
      </Instances>
    </group>
  );
};
