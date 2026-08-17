import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { Character } from './Character';

const GRAVITY = 15;
const SPEED_MUL = 15;

export interface BowAndArrowProps {
  targetPositions: [number, number, number][];
  bowPos: THREE.Vector3;
}

export function BowAndArrow({ targetPositions, bowPos }: BowAndArrowProps) {
  const { gameState, handleHit, handleMiss, currentOptions, setGameState } = useGameStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentPull, setCurrentPull] = useState(0);
  const [aimAngle, setAimAngle] = useState(0);

  const [archerAnim, setArcherAnim] = useState('Standing Idle Examine');

  const { size } = useThree();
  const isMobile = size.width < 520;
  const bowScale = isMobile ? 0.45 : 0.65;

  const arrowRef = useRef<THREE.Group>(null);
  const bowGroupRef = useRef<THREE.Group>(null);
  const leftHandRef = useRef<THREE.Object3D | null>(null);
  const arrowFlying = useRef(false);
  const velocity = useRef(new THREE.Vector3());

  const isPulling = currentPull > 0;

  // Archer Animation State Machine
  useEffect(() => {
    if (gameState === 'flying') {
      setArcherAnim('Standing Aim Recoil');
    } else if (gameState === 'aiming') {
      if (isPulling) {
        setArcherAnim('Standing Aim Overdraw');
      } else {
        setArcherAnim('Standing Idle Examine');
      }
    }
  }, [gameState, isPulling]);

  const handlePointerDown = (e: PointerEvent) => {
    e.stopPropagation();
    if (gameState !== 'aiming') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;

      const dx = dragStart.x - e.clientX;
      const dy = e.clientY - dragStart.y; // Dragging down aims UP

      const dist = Math.hypot(dx, dy);
      const pull = Math.min(1, dist / 200);
      setCurrentPull(pull);

      // 180-degree constraint (only aim rightwards)
      if (dx > 0) {
        setAimAngle(Math.atan2(dy, dx));
      } else {
        setAimAngle(dy >= 0 ? Math.PI / 2 : -Math.PI / 2);
      }
    };

    const handlePointerUp = () => {
      if (!isDragging) return;
      setIsDragging(false);

      if (currentPull > 0.1) {
        const speed = currentPull * SPEED_MUL;
        const vX = Math.cos(aimAngle) * speed;
        const vY = Math.sin(aimAngle) * speed;
        velocity.current.set(vX, vY, 0);

        arrowFlying.current = true;
        setGameState('flying');
        if (arrowRef.current) arrowRef.current.userData = {}; // clear dodging memory

        // Prediction starts EXACTLY at the left hand (same as trajectory line and physical flight)
        let startX = bowPos.x;
        let startY = bowPos.y + 0.1;
        if (leftHandRef.current) {
          const hp = new THREE.Vector3();
          leftHandRef.current.getWorldPosition(hp);
          startX = hp.x;
          startY = hp.y;
        }

        // Simulate exact trajectory to find the first target intersected
        let simX = startX;
        let simY = startY;
        let simVy = vY;
        let simT = 0;
        const simDelta = 1 / 60; // 60fps simulation

        let destinedToHitCorrect = false;
        let firstIncorrectHit = -1;
        let firstIncorrectTime = 0;
        let firstIncorrectY = 0;

        while (simX < targetPositions[0][0] + 0.5 && simY > -10) {
          simX += vX * simDelta;
          simY += simVy * simDelta;
          simVy -= GRAVITY * simDelta;
          simT += simDelta;

          for (let i = 0; i < 4; i++) {
            if (!currentOptions[i] || currentOptions[i].eliminated) continue;
            const dx = Math.abs(simX - targetPositions[i][0]);
            const dy = Math.abs(simY - targetPositions[i][1]);

            // True character dimensions: ~1.2 tall, ~0.6 wide (at desktop scale 0.006)
            const hitBoxRadiusX = isMobile ? 0.3 * 0.7 : 0.3;
            const hitBoxRadiusY = isMobile ? 0.6 * 0.7 : 0.6;

            if (dx < hitBoxRadiusX && dy < hitBoxRadiusY) {
              if (currentOptions[i].correct) {
                destinedToHitCorrect = true;
              } else if (firstIncorrectHit === -1) {
                firstIncorrectHit = i;
                firstIncorrectTime = simT;
                firstIncorrectY = simY;
              }
            }
          }

          if (destinedToHitCorrect) break;
        }

        // Only dodge if the arrow is NOT going to hit the correct target
        if (!destinedToHitCorrect && firstIncorrectHit !== -1) {
          const dodgeTime = Math.max(0, firstIncorrectTime - 0.4) * 1000;
          const dodgeType = firstIncorrectY < targetPositions[firstIncorrectHit][1] ? 'jump' : 'crouch';

          // @ts-ignore
          if (window.dodgeTimeout) clearTimeout(window.dodgeTimeout);
          // @ts-ignore
          window.dodgeTimeout = setTimeout(() => {
            window.dispatchEvent(new CustomEvent('targetDodge', { detail: { index: firstIncorrectHit, type: dodgeType } }));
          }, dodgeTime);
        }

        if (arrowRef.current) {
          // Actual arrow flight starts EXACTLY at the left hand
          if (leftHandRef.current) {
            const handPos = new THREE.Vector3();
            leftHandRef.current.getWorldPosition(handPos);
            arrowRef.current.position.copy(handPos);
          } else {
            arrowRef.current.position.copy(bowPos);
            arrowRef.current.position.y += 0.1;
          }
          arrowRef.current.visible = true;
          // reset dodge flags
          arrowRef.current.userData = {};
        }
        arrowFlying.current = true;
        setGameState('flying'); // update game state to prevent new drags while flying
      }
      setCurrentPull(0);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, dragStart, currentPull, aimAngle, gameState, targetPositions, currentOptions]);

  useEffect(() => {
    if (gameState === 'aiming') {
      arrowFlying.current = false;
    }
  }, [gameState]);

  useFrame((_state, delta) => {
    if (leftHandRef.current && bowGroupRef.current) {
      const handPos = new THREE.Vector3();
      leftHandRef.current.getWorldPosition(handPos);
      bowGroupRef.current.position.copy(handPos);
    }

    if (arrowRef.current) {
      if (!arrowFlying.current && gameState === 'aiming') {
        const arr = arrowRef.current;
        arr.visible = isPulling;

        let px = bowPos.x;
        let py = bowPos.y + 0.1;
        if (leftHandRef.current) {
          const handPos = new THREE.Vector3();
          leftHandRef.current.getWorldPosition(handPos);
          px = handPos.x;
          py = handPos.y;
        }

        const drawOffset = currentPull * 0.4;
        px -= Math.cos(aimAngle) * drawOffset;
        py -= Math.sin(aimAngle) * drawOffset;

        arr.position.set(px, py, bowPos.z);
        arr.rotation.z = aimAngle - Math.PI / 2;
      } else if (arrowFlying.current) {
        const arr = arrowRef.current;
        arr.position.x += velocity.current.x * delta;
        arr.position.y += velocity.current.y * delta;

        velocity.current.y -= GRAVITY * delta;

        arr.rotation.z = Math.atan2(velocity.current.y, velocity.current.x) - Math.PI / 2;

        let hit = false;
        for (let i = 0; i < 4; i++) {
          if (!currentOptions[i] || currentOptions[i].eliminated) continue;
          const tp = targetPositions[i];

          const dx = Math.abs(arr.position.x - tp[0]);
          // Collision Logic - Exact Scaled Bounding Box
          const hitBoxRadiusX = isMobile ? 0.3 * 0.7 : 0.3;
          const hitBoxRadiusY = isMobile ? 0.6 * 0.7 : 0.6;

          const targetCenterY = tp[1];
          const dy = Math.abs(arr.position.y - targetCenterY);

          if (dx < hitBoxRadiusX && dy < hitBoxRadiusY) {
            if (currentOptions[i].correct) {
              hit = true;
              arrowFlying.current = false;
              window.dispatchEvent(new CustomEvent('targetHit', { detail: { index: i } }));
              handleHit(i);
              break;
            }
          }
        }

        if (!hit && (arr.position.y < -8 || arr.position.x > 10)) {
          arrowFlying.current = false;
          arr.visible = false;
          handleMiss();
        }
      }
    }
  });

  const trajectoryPoints: THREE.Vector3[] = [];
  if (isDragging && currentPull > 0.1) {
    const speed = currentPull * SPEED_MUL;
    let px = bowPos.x;
    let py = bowPos.y + 0.1;
    if (leftHandRef.current) {
      const handPos = new THREE.Vector3();
      leftHandRef.current.getWorldPosition(handPos);
      px = handPos.x;
      py = handPos.y;
    }
    let vx = Math.cos(aimAngle) * speed;
    let vy = Math.sin(aimAngle) * speed;
    const step = 0.05;

    for (let i = 0; i < 15; i++) {
      trajectoryPoints.push(new THREE.Vector3(px, py, 0));
      px += vx * step;
      py += vy * step;
      vy -= GRAVITY * step;
      if (py < -5) break;
    }
  }

  return (
    <group>
      {/* Procedural Bow tracking the actual hand bone */}
      <group ref={bowGroupRef} position={[bowPos.x, bowPos.y + 0.1, bowPos.z]} rotation={[0, 0, aimAngle]} scale={bowScale}>
        {/* Invisible Hit Box for easier dragging */}
        <mesh onPointerDown={handlePointerDown} position={[0, 0, 0]} visible={false}>
          <boxGeometry args={[1.5, 2.5, 1.5]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* Removed the procedural bow meshes, we now use the inbuilt bow! */}
      </group>

      {/* Archer Character shifted down by 0.6 so the visual center matches bowPos */}
      <Character
        animName={archerAnim}
        position={[bowPos.x, bowPos.y - 0.6, bowPos.z]}
        rotation={[0, Math.PI / 2, 0]}
        onHandRef={(hand) => leftHandRef.current = hand}
      />

      {trajectoryPoints.map((pt, i) => (
        <mesh key={i} position={pt}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="yellow" opacity={1 - (i / 15)} transparent />
        </mesh>
      ))}

      <group ref={arrowRef} visible={true} scale={bowScale}>
        {/* Shaft */}
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.8]} />
          <meshStandardMaterial color="#5C4033" /> {/* Dark brown wood */}
        </mesh>
        {/* Arrowhead */}
        <mesh position={[0, 0.35, 0]}>
          <coneGeometry args={[0.04, 0.15, 8]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} /> {/* Shiny silver */}
        </mesh>
        {/* Fletching (feathers) */}
        <mesh position={[0, -0.45, 0]}>
          <boxGeometry args={[0.08, 0.15, 0.005]} />
          <meshStandardMaterial color="#ff0000" /> {/* Red feathers */}
        </mesh>
        <mesh position={[0, -0.45, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.08, 0.15, 0.005]} />
          <meshStandardMaterial color="#ff0000" />
        </mesh>
      </group>
    </group>
  );
}
