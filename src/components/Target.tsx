import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore, Option } from '../store/gameStore';
import { Character } from './Character';

export interface TargetProps {
  position: [number, number, number];
  index:    number;
  option:   Option;
}

export function Target({ position, index, option }: TargetProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [animState, setAnimState] = useState('Standing Idle');
  const { gameState } = useGameStore();

  const isEliminated = option.eliminated;

  useEffect(() => {
    const handleDodge = (e: any) => {
      if (e.detail.index === index && !isEliminated && gameState === 'flying') {
        const type = e.detail.type;
        setAnimState(type === 'jump' ? 'Standing Jump' : 'Standing To Crouch');
        setTimeout(() => { setAnimState('Standing Idle'); }, 1500);
      }
    };
    window.addEventListener('targetDodge', handleDodge);
    return () => window.removeEventListener('targetDodge', handleDodge);
  }, [index, isEliminated, gameState]);

  useFrame(() => {
    if (!meshRef.current) return;

    if (isEliminated) {
      meshRef.current.scale.lerp(new THREE.Vector3(0.5, 0.5, 0.5), 0.1);
      if (animState !== 'Standing To Crouch') setAnimState('Standing To Crouch');
      return;
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
    }
  });

  useEffect(() => {
    const handleTargetHit = (e: any) => {
      if (e.detail.index === index && !isEliminated) {
        setAnimState('Standing Death Backward');
      }
    };
    window.addEventListener('targetHit', handleTargetHit);
    return () => window.removeEventListener('targetHit', handleTargetHit);
  }, [index, isEliminated]);

  useEffect(() => {
    if (gameState === 'aiming') {
      if (!isEliminated) setAnimState('Standing Idle');
    }
  }, [gameState, isEliminated]);

  const { size } = useThree();
  const isMobile = size.width < 520;

  const yShift = isMobile ? -0.378 : -0.54;
  const labelY = isMobile ? 0.35 : 0.55;

  const textColors = ['#ff5252', '#448aff', '#69f0ae', '#ffd740'];
  const textColor  = textColors[index % textColors.length];

  return (
    <group position={position} ref={meshRef}>
      <Character characterType="target" animName={animState} rotation={[0, -Math.PI / 2, 0]} position={[0, yShift, 0]} />
      <Html position={[0, labelY, 0]} center zIndexRange={[100, 0]}>
        <div
          className={`vocab-label ${isEliminated ? 'eliminated' : ''}`}
          style={{
            color: textColor,
            fontSize: isMobile ? '10px' : '14px',
            padding: isMobile ? '2px 6px' : '4px 10px'
          }}
        >
          {option.text}
        </div>
      </Html>
    </group>
  );
}
