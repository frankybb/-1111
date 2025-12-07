
import React, { useRef, useMemo, useState } from 'react';
import { Palette, ConfettiData } from '../types';
import { Cylinder, Box, Torus, Sphere, Instance, Instances, Extrude } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- Shared Materials ---
const GoldMaterial = () => (
  <meshStandardMaterial
    color={Palette.SoftGold}
    metalness={1.0}
    roughness={0.2} // Slightly more matte for foil look
    envMapIntensity={2.0}
  />
);

const StarMaterial = () => (
    <meshStandardMaterial
      color="#FFD700" 
      metalness={1.0}
      roughness={0.1}
      envMapIntensity={3.0}
      emissive="#FFD700"
      emissiveIntensity={0.2}
    />
);

const ConfettiMaterial = () => (
  <meshStandardMaterial
    side={THREE.DoubleSide}
    roughness={0.2}
    metalness={0.6}
    envMapIntensity={2}
  />
);

const EnamelWhiteMaterial = () => (
    <meshPhysicalMaterial 
        color="#FFFFFF" 
        roughness={0.15} 
        metalness={0.1} 
        clearcoat={0.8} 
        clearcoatRoughness={0.1}
    />
);

// Updated to be more matte (Cardboard/Paper texture) to match reference
const WallMaterial = () => (
    <meshStandardMaterial 
        color={Palette.LuxuryGreen} 
        roughness={0.8} 
        metalness={0.0} 
        side={THREE.DoubleSide} 
    />
);

// --- New Bulb Ornament (Simple Glowing Sphere) ---
export const BulbOrnament: React.FC<{ color: string; position?: [number, number, number]; scale?: number }> = ({ color, position, scale = 1 }) => {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial 
            color={color} 
            emissive={color}
            emissiveIntensity={3.0} // Strong glow
            toneMapped={false} // Keep color pure even at high brightness
            roughness={0.2}
            metalness={0.1}
        />
        {/* Local light for the bulb to illuminate nearby blocks */}
        <pointLight color={color} distance={4} intensity={2} decay={2} />
      </mesh>
    </group>
  );
};

// --- New Fairy Lights (Glowing Particles) ---
export const FairyLights: React.FC<{ active: boolean }> = ({ active }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = 60;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Static positions, but we will animate movement in useFrame
    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            position: new THREE.Vector3(
                (Math.random() - 0.5) * 15,
                -2 + Math.random() * 14,
                (Math.random() - 0.5) * 15
            ),
            speed: Math.random() * 0.5 + 0.2,
            offset: Math.random() * 100
        }));
    }, []);

    useFrame((state) => {
        if (!meshRef.current || !active) return;
        const time = state.clock.getElapsedTime();

        particles.forEach((p, i) => {
            // Floating motion
            const y = p.position.y + Math.sin(time * p.speed + p.offset) * 0.5;
            const x = p.position.x + Math.cos(time * p.speed * 0.5 + p.offset) * 0.3;
            const z = p.position.z + Math.sin(time * p.speed * 0.3 + p.offset) * 0.3;

            dummy.position.set(x, y, z);
            
            // Pulsing scale
            const scale = 0.6 + Math.sin(time * 2 + p.offset) * 0.2;
            dummy.scale.setScalar(scale);
            
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (!active) return null;

    return (
        <Instances ref={meshRef} range={count}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial 
                color={Palette.WarmLight} 
                emissive={Palette.WarmLight}
                emissiveIntensity={2}
                toneMapped={false}
            />
            {particles.map((_, i) => <Instance key={i} />)}
        </Instances>
    );
};

// --- Custom 3D Faceted Star Geometry ---
const FacetedStarGeometry: React.FC<{ outerRadius?: number, innerRadius?: number, depth?: number }> = ({ outerRadius = 1, innerRadius = 0.382, depth = 0.3 }) => {
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const vertices = [];
        const numPoints = 5;

        for (let i = 0; i < numPoints; i++) {
             const angle = (i / numPoints) * Math.PI * 2;
             const nextAngle = ((i + 1) / numPoints) * Math.PI * 2;
             const halfAngle = angle + (nextAngle - angle) / 2;
             
             // Coordinates
             const ox1 = Math.sin(angle) * outerRadius;
             const oy1 = Math.cos(angle) * outerRadius;
             const ix = Math.sin(halfAngle) * innerRadius;
             const iy = Math.cos(halfAngle) * innerRadius;
             const ox2 = Math.sin(nextAngle) * outerRadius;
             const oy2 = Math.cos(nextAngle) * outerRadius;

             // Front Face
             vertices.push(0, 0, depth);
             vertices.push(ox1, oy1, 0);
             vertices.push(ix, iy, 0);

             vertices.push(0, 0, depth);
             vertices.push(ix, iy, 0);
             vertices.push(ox2, oy2, 0);
             
             // Back Face
             vertices.push(0, 0, -depth);
             vertices.push(ix, iy, 0);
             vertices.push(ox1, oy1, 0);

             vertices.push(0, 0, -depth);
             vertices.push(ox2, oy2, 0);
             vertices.push(ix, iy, 0);
        }
        
        geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geo.computeVertexNormals();
        return geo;
    }, [outerRadius, innerRadius, depth]);

    return <primitive object={geometry} attach="geometry" />;
}

export const ConfettiExplosion: React.FC<{ active: boolean }> = ({ active }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = 300;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const particles = useMemo(() => {
        const data: ConfettiData[] = [];
        const colors = [Palette.SoftGold, Palette.CameraSilver, '#ffffff', Palette.SageGreen, Palette.LightRed];
        for(let i=0; i<count; i++) {
            data.push({
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    -5 + (Math.random() - 0.5) * 1,
                    (Math.random() - 0.5) * 2
                ),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.8, 
                    Math.random() * 1.5 + 0.5,
                    (Math.random() - 0.5) * 0.8
                ),
                rotation: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, 0),
                rotationSpeed: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5),
                color: colors[Math.floor(Math.random() * colors.length)],
                scale: Math.random() * 0.5 + 0.2
            });
        }
        return data;
    }, []);

    useFrame((state, delta) => {
        if (!meshRef.current || !active) return;
        
        particles.forEach((p, i) => {
            p.position.addScaledVector(p.velocity, delta * 15);
            p.velocity.y -= delta * 2;
            p.velocity.multiplyScalar(0.98);
            
            p.rotation.x += p.rotationSpeed.x * delta * 5;
            p.rotation.y += p.rotationSpeed.y * delta * 5;
            p.rotation.z += p.rotationSpeed.z * delta * 5;

            dummy.position.copy(p.position);
            dummy.rotation.copy(p.rotation);
            dummy.scale.setScalar(p.scale);
            
            if (p.position.y < -7) {
                p.velocity.y = 0;
                p.velocity.x = 0;
                p.velocity.z = 0;
                p.position.y = -7;
            }

            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (!active) return null;

    return (
        <Instances ref={meshRef} range={count} position={[0,0,0]} frustumCulled={false}>
            <planeGeometry args={[0.2, 0.08]} />
            <ConfettiMaterial />
            {particles.map((p, i) => (
                <Instance key={i} color={p.color} />
            ))}
        </Instances>
    )
}

// A classic, neat bow (Loop and Knot style)
const ClassicBow: React.FC = () => {
    return (
        <group scale={1.2}>
             {/* Center Knot */}
             <mesh position={[0, 0.1, 0]}>
                <sphereGeometry args={[0.25, 32, 32]} />
                <GoldMaterial />
             </mesh>
             
             {/* Left Loop */}
             <group position={[-0.6, 0.15, 0]} rotation={[0, 0, Math.PI/1.8]}>
                 <mesh scale={[0.4, 0.8, 0.4]}>
                    <torusGeometry args={[0.8, 0.35, 16, 32]} />
                    <GoldMaterial />
                 </mesh>
             </group>

             {/* Right Loop */}
             <group position={[0.6, 0.15, 0]} rotation={[0, 0, -Math.PI/1.8]}>
                 <mesh scale={[0.4, 0.8, 0.4]}>
                    <torusGeometry args={[0.8, 0.35, 16, 32]} />
                    <GoldMaterial />
                 </mesh>
             </group>

             {/* Ribbon Tails */}
             <group position={[0, 0.1, 0.2]} rotation={[0.5, 0, 0.3]}>
                 <mesh position={[-0.4, -0.6, 0]}>
                     <boxGeometry args={[0.4, 1.2, 0.05]} />
                     <GoldMaterial />
                 </mesh>
             </group>
             <group position={[0, 0.1, 0.2]} rotation={[0.5, 0, -0.3]}>
                 <mesh position={[0.4, -0.6, 0]}>
                     <boxGeometry args={[0.4, 1.2, 0.05]} />
                     <GoldMaterial />
                 </mesh>
             </group>
        </group>
    )
}

export const IntroGiftBox: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
    const lidRef = useRef<THREE.Group>(null);
    const boxSize = 3.5;
    const lidHeight = 0.8; // Deep lid
    const thickness = 0.15; // Increased thickness for solid hollow look
    const ribbonWidth = 0.55; 
    
    useFrame((state, delta) => {
        if(lidRef.current) {
            const targetRotation = isOpen ? -Math.PI / 1.8 : 0; 
            const targetY = isOpen ? 2 : boxSize/2 + lidHeight/2 - 0.1; // -0.1 to sit snugly
            const targetZ = isOpen ? -2 : 0;

            lidRef.current.rotation.x = THREE.MathUtils.lerp(lidRef.current.rotation.x, targetRotation, delta * 3);
            lidRef.current.position.y = THREE.MathUtils.lerp(lidRef.current.position.y, targetY, delta * 3);
            lidRef.current.position.z = THREE.MathUtils.lerp(lidRef.current.position.z, targetZ, delta * 3);
        }
    });

    return (
        <group position={[0, -4, 0]}> 
           <group scale={1.2}>
                {/* --- BASE (Hollow Box) --- */}
                {/* Reference Match: No ribbons on the base, just pure Green Box */}
                <group position={[0, 0, 0]}>
                    {/* Floor */}
                    <mesh position={[0, -boxSize/2 + thickness/2, 0]} castShadow receiveShadow><boxGeometry args={[boxSize, thickness, boxSize]} /><WallMaterial /></mesh>
                    {/* Walls - Thicker to emphasize hollow structure */}
                    <mesh position={[0, 0, boxSize/2 - thickness/2]} castShadow receiveShadow><boxGeometry args={[boxSize, boxSize, thickness]} /><WallMaterial /></mesh>
                    <mesh position={[0, 0, -boxSize/2 + thickness/2]} castShadow receiveShadow><boxGeometry args={[boxSize, boxSize, thickness]} /><WallMaterial /></mesh>
                    <mesh position={[-boxSize/2 + thickness/2, 0, 0]} castShadow receiveShadow><boxGeometry args={[thickness, boxSize, boxSize - 2*thickness]} /><WallMaterial /></mesh>
                    <mesh position={[boxSize/2 - thickness/2, 0, 0]} castShadow receiveShadow><boxGeometry args={[thickness, boxSize, boxSize - 2*thickness]} /><WallMaterial /></mesh>

                    {/* Inner Light - Subtle fill to show interior volume */}
                    <pointLight position={[0, 0, 0]} intensity={isOpen ? 2 : 0} distance={5} color="#FFFFAA" decay={2} />
                </group>

                {/* --- LID --- */}
                <group ref={lidRef} position={[0, boxSize/2 + lidHeight/2 - 0.1, 0]}>
                     {/* Lid Core */}
                     <mesh position={[0, lidHeight/2 - thickness/2, 0]} castShadow>
                        <boxGeometry args={[boxSize + 0.2, thickness, boxSize + 0.2]} />
                        <WallMaterial />
                     </mesh>
                     {/* Lid Rim */}
                     <mesh position={[0, 0, 0]} castShadow>
                        <boxGeometry args={[boxSize + 0.2, lidHeight, boxSize + 0.2]} />
                        <WallMaterial />
                     </mesh>

                     {/* Lid Ribbon Cross - Wraps over the top and sides of the lid */}
                     {/* Z-Axis Strip */}
                     <mesh position={[0, 0, 0]}>
                         <boxGeometry args={[ribbonWidth, lidHeight + 0.04, boxSize + 0.22]} />
                         <GoldMaterial />
                     </mesh>
                     {/* X-Axis Strip */}
                     <mesh position={[0, 0, 0]}>
                         <boxGeometry args={[boxSize + 0.22, lidHeight + 0.04, ribbonWidth]} />
                         <GoldMaterial />
                     </mesh>
                </group>
           </group>
        </group>
    )
}

// Ornament Version of Gift Box (White Enamel with Gold Ribbon)
export const GiftBox: React.FC<{ position?: [number, number, number]; rotation?: [number, number, number] }> = (props) => {
  return (
    <group {...props}>
        {/* Box Body (White Enamel) */}
        <mesh castShadow receiveShadow>
             <boxGeometry args={[0.9, 0.75, 0.9]} /> 
             <EnamelWhiteMaterial />
        </mesh>

        {/* Gold Ribbon Vertical */}
        <mesh position={[0, 0, 0]} castShadow>
           <boxGeometry args={[0.92, 0.77, 0.2]} />
           <GoldMaterial />
        </mesh>
        
        {/* Gold Ribbon Horizontal */}
         <mesh position={[0, 0, 0]} castShadow>
           <boxGeometry args={[0.2, 0.77, 0.92]} />
           <GoldMaterial />
        </mesh>

        {/* Gold Bow */}
        <group position={[0, 0.38, 0]} scale={0.35}>
             <ClassicBow />
        </group>
    </group>
  );
};

export const StarOrnament: React.FC<{ position?: [number, number, number]; scale?: number }> = ({ position, scale = 1 }) => {
  return (
    <group position={position} scale={scale}>
        <mesh castShadow receiveShadow rotation={[Math.PI/2, 0, 0]}>
            <FacetedStarGeometry outerRadius={0.5} innerRadius={0.2} depth={0.15} />
            <StarMaterial />
        </mesh>
    </group>
  );
};

// Snowflake Ornament (Gold 3D)
export const SnowflakeOrnament: React.FC<{ position?: [number, number, number]; scale?: number }> = ({ position, scale = 1 }) => {
    const branches = 6;
    return (
        <group position={position} scale={scale}>
            {/* Center */}
            <mesh>
                <cylinderGeometry args={[0.1, 0.1, 0.1, 6]} />
                <GoldMaterial />
            </mesh>
            {/* Branches */}
            {Array.from({ length: branches }).map((_, i) => (
                <group key={i} rotation={[0, 0, (i / branches) * Math.PI * 2]}>
                    <mesh position={[0, 0.4, 0]}>
                        <boxGeometry args={[0.08, 0.8, 0.05]} />
                        <GoldMaterial />
                    </mesh>
                    <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 4]}>
                        <boxGeometry args={[0.05, 0.3, 0.05]} />
                        <GoldMaterial />
                    </mesh>
                    <mesh position={[0, 0.6, 0]} rotation={[0, 0, -Math.PI / 4]}>
                        <boxGeometry args={[0.05, 0.3, 0.05]} />
                        <GoldMaterial />
                    </mesh>
                     <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 4]}>
                        <boxGeometry args={[0.05, 0.3, 0.05]} />
                        <GoldMaterial />
                    </mesh>
                    <mesh position={[0, 0.3, 0]} rotation={[0, 0, -Math.PI / 4]}>
                        <boxGeometry args={[0.05, 0.3, 0.05]} />
                        <GoldMaterial />
                    </mesh>
                </group>
            ))}
        </group>
    )
}

// Gold Tree Ornament (Enamel Pin Style)
export const GoldTreeOrnament: React.FC<{ position?: [number, number, number]; scale?: number }> = ({ position, scale = 1 }) => {
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(0, 1);
        s.lineTo(0.5, 0.2);
        s.lineTo(0.2, 0.2);
        s.lineTo(0.6, -0.4);
        s.lineTo(0.2, -0.4);
        s.lineTo(0.7, -1);
        s.lineTo(-0.7, -1);
        s.lineTo(-0.2, -0.4);
        s.lineTo(-0.6, -0.4);
        s.lineTo(-0.2, 0.2);
        s.lineTo(-0.5, 0.2);
        s.lineTo(0, 1);
        return s;
    }, []);

    const extrudeSettings = { depth: 0.1, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };

    return (
        <group position={position} scale={scale}>
            <mesh rotation={[0, 0, 0]}>
                <extrudeGeometry args={[shape, extrudeSettings]} />
                <GoldMaterial />
            </mesh>
            {/* Enamel Dots/Snow */}
            <mesh position={[0, 0.5, 0.06]}>
                 <sphereGeometry args={[0.08, 16, 16]} />
                 <EnamelWhiteMaterial />
            </mesh>
             <mesh position={[-0.3, -0.2, 0.06]}>
                 <sphereGeometry args={[0.08, 16, 16]} />
                 <EnamelWhiteMaterial />
            </mesh>
             <mesh position={[0.3, -0.2, 0.06]}>
                 <sphereGeometry args={[0.08, 16, 16]} />
                 <EnamelWhiteMaterial />
            </mesh>
             <mesh position={[0, -0.7, 0.06]}>
                 <sphereGeometry args={[0.08, 16, 16]} />
                 <EnamelWhiteMaterial />
            </mesh>
        </group>
    )
}

// Enamel Snowman with Gold Hat
export const Snowman: React.FC<{ position?: [number, number, number]; rotation?: [number, number, number] }> = (props) => {
  return (
    <group {...props}>
      {/* Body - Bottom Sphere */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.4, 32, 32]} />
        <EnamelWhiteMaterial />
      </mesh>
      
      {/* Head - Top Sphere */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.28, 32, 32]} />
        <EnamelWhiteMaterial />
      </mesh>

      {/* Gold Top Hat */}
      <group position={[0, 0.78, 0]} rotation={[0.1, 0, 0]}>
         {/* Brim */}
         <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.05, 32]} />
            <GoldMaterial />
         </mesh>
         {/* Cylinder */}
         <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.4, 32]} />
            <GoldMaterial />
         </mesh>
      </group>

      {/* Face Details */}
      <group position={[0, 0.55, 0]} rotation={[0, 0, 0]}>
          {/* Eyes */}
          <mesh position={[-0.1, 0.05, 0.24]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshStandardMaterial color="black" roughness={0.2} />
          </mesh>
          <mesh position={[0.1, 0.05, 0.24]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshStandardMaterial color="black" roughness={0.2} />
          </mesh>
          {/* Nose (Orange Cone) */}
          <mesh position={[0, 0, 0.28]} rotation={[1.5, 0, 0]}>
            <coneGeometry args={[0.04, 0.15, 16]} />
            <meshStandardMaterial color="#FF6D00" roughness={0.5} />
          </mesh>
          {/* Smile (Dots) */}
          <mesh position={[-0.08, -0.08, 0.25]}>
             <sphereGeometry args={[0.02, 16, 16]} />
             <meshStandardMaterial color="black" />
          </mesh>
           <mesh position={[-0.04, -0.11, 0.26]}>
             <sphereGeometry args={[0.02, 16, 16]} />
             <meshStandardMaterial color="black" />
          </mesh>
          <mesh position={[0.04, -0.11, 0.26]}>
             <sphereGeometry args={[0.02, 16, 16]} />
             <meshStandardMaterial color="black" />
          </mesh>
          <mesh position={[0.08, -0.08, 0.25]}>
             <sphereGeometry args={[0.02, 16, 16]} />
             <meshStandardMaterial color="black" />
          </mesh>
      </group>

      {/* Buttons */}
      <mesh position={[0, 0.15, 0.38]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="black" roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.05, 0.39]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="black" roughness={0.2} />
      </mesh>
    </group>
  );
};

export const TreeTopper: React.FC = (props) => {
    return (
        <group {...props}>
             <group scale={1.2}>
                <mesh castShadow receiveShadow rotation={[0, 0, 0]} position={[0, 0, 0]}>
                    <FacetedStarGeometry outerRadius={1} innerRadius={0.382} depth={0.3} />
                    <StarMaterial />
                </mesh>
             </group>
             <pointLight intensity={5} color={Palette.SoftGold} distance={8} decay={2} position={[0, 0, 0.5]} />
        </group>
    )
}
