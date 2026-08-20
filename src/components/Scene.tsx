import { Suspense, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { Target } from './Target';
import { BowAndArrow } from './BowAndArrow';

function SceneContent() {
  const { currentOptions } = useGameStore();
  const { viewport, size } = useThree();

  const isMobile = size.width < 520;

  const w = viewport.width;
  const h = viewport.height;
  const left = -w / 2;
  const top = h / 2;

  // Archer
  const bowX = left + (isMobile ? w * 0.15 : w * 0.12);
  const bowY = top - h * 0.58;
  const bowPos = new THREE.Vector3(bowX, bowY, 0);

  // Targets
  const baseX = left + (isMobile ? w * 0.80 : w * 0.76);
  const rawBulge = isMobile
    ? Math.min(w * 0.10, (45 / size.width) * w)
    : Math.min(w * 0.16, (115 / size.width) * w);
  const bulge = Math.min(rawBulge, (left + w * 0.95) - baseX);

  const topSafePx = isMobile ? 140 : 120; // Slightly less padding on desktop
  const botSafePx = size.height - 60;

  const topSafe = top - (topSafePx / size.height) * h;
  const botSafe = top - (botSafePx / size.height) * h;

  const stickH = isMobile ? h * 0.12 : h * 0.18;

  const topCenter = topSafe - stickH / 2;
  const botCenter = botSafe + stickH / 2;

  let targetAvailable = Math.max(0, topCenter - botCenter);
  let startY = topCenter;

  if (isMobile) {
    const compressed = targetAvailable * 0.82;
    startY -= (targetAvailable - compressed) / 2;
    targetAvailable = compressed;
  }

  // Equal distance between all 4 targets: 3 gaps
  const targetPositions = useMemo(() => {
    const tValues = [0, 1 / 3, 2 / 3, 1];
    return tValues.map(t => {
      const y = startY - t * targetAvailable;
      const xr = bulge * 4 * t * (1 - t);
      return [baseX + xr, y, 0] as [number, number, number];
    });
  }, [startY, targetAvailable, bulge, baseX]);

  return (
    <>
      <BowAndArrow targetPositions={targetPositions} bowPos={bowPos} />

      {currentOptions.map((opt, i) => (
        <Target
          key={`${opt.text}-${i}`}
          index={i}
          option={opt}
          position={targetPositions[i]}
        />
      ))}
    </>
  );
}

export default function Scene() {
  const gameState = useGameStore(s => s.gameState);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 50, pointerEvents: 'none' }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 8], fov: 50 }}
        eventSource={document.getElementById('root')!}
        eventPrefix="client"
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[5, 10, 5]}
          intensity={1.5}
          shadow-mapSize={1024}
        />
        <Environment preset="city" />
        <Suspense fallback={null}>
          {gameState !== 'idle' && gameState !== 'starting' && gameState !== 'end' && <SceneContent />}
        </Suspense>
      </Canvas>
    </div>
  );
}
