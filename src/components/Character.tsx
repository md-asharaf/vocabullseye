import { useRef, useEffect, useMemo } from 'react';
import { useFBX, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useFrame, useThree } from '@react-three/fiber';

const ANIM_FILES = [
  'Erika Archer With Bow Arrow',
  'Passive Marker Man',
  'Standing Aim Overdraw',
  'Standing Aim Recoil',
  'Standing Death Backward',
  'Standing Draw Arrow',
  'Standing Idle Examine',
  'Standing Idle',
  'Standing Jump',
  'Standing To Crouch'
];

export function PreloadCharacters() {
  ANIM_FILES.forEach(file => {
    useFBX.preload(`/models/${file}.fbx`);
  });
  return null;
}

export interface CharacterProps {
  animName: string;
  position?: [number, number, number] | THREE.Vector3;
  rotation?: [number, number, number] | THREE.Euler;
  scale?: number;
  onHandRef?: (hand: THREE.Object3D) => void;
  characterType?: 'archer' | 'target';
}

export function Character({ animName, position, rotation, scale = 0.006, onHandRef, characterType = 'archer' }: CharacterProps) {
  const group = useRef<THREE.Group>(null);
  const { size } = useThree();
  const isMobile = size.width < 520;
  const actualScale = isMobile ? scale * 0.7 : scale;

  // @ts-ignore - Drei's useFBX types only specify string, but useLoader supports string[]
  const fbxs = useFBX([
    '/models/Erika Archer With Bow Arrow.fbx', // 0: Archer Base
    '/models/Passive Marker Man.fbx',          // 1: Target Base
    '/models/Standing Aim Overdraw.fbx',       // 2
    '/models/Standing Aim Recoil.fbx',         // 3
    '/models/Standing Death Backward.fbx',     // 4
    '/models/Standing Draw Arrow.fbx',         // 5
    '/models/Standing Idle Examine.fbx',       // 6
    '/models/Standing Idle.fbx',               // 7
    '/models/Standing Jump.fbx',               // 8
    '/models/Standing To Crouch.fbx'           // 9
  ]) as any[];

  const baseFbx = characterType === 'target' ? fbxs[1] : fbxs[0];
  const clonedScene = useMemo(() => SkeletonUtils.clone(baseFbx), [baseFbx]);

  const aimOverdraw = fbxs[2].animations[0];
  const aimRecoil = fbxs[3].animations[0];
  const deathBackward = fbxs[4].animations[0];
  const drawArrow = fbxs[5].animations[0];
  const idleExamine = fbxs[6].animations[0];
  const idle = fbxs[7].animations[0];
  const jump = fbxs[8].animations[0];
  const toCrouch = fbxs[9].animations[0];

  const animations = useMemo(() => [
    { ...aimOverdraw, name: 'Standing Aim Overdraw' },
    { ...aimRecoil, name: 'Standing Aim Recoil' },
    { ...deathBackward, name: 'Standing Death Backward' },
    { ...drawArrow, name: 'Standing Draw Arrow' },
    { ...idleExamine, name: 'Standing Idle Examine' },
    { ...idle, name: 'Standing Idle' },
    { ...jump, name: 'Standing Jump' },
    { ...toCrouch, name: 'Standing To Crouch' }
  ], [
    aimOverdraw, aimRecoil, deathBackward,
    drawArrow, idleExamine, idle, jump, toCrouch
  ]);

  const { actions, mixer } = useAnimations(animations as THREE.AnimationClip[], group);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  useEffect(() => {
    if (clonedScene) {
      let hand: THREE.Object3D | undefined;

      clonedScene.traverse(child => {
        if (child.name === 'mixamorigLeftHand' || child.name === 'LeftHand') {
          hand = child;
        }
      });
      if (hand && onHandRef) onHandRef(hand);
    }
  }, [clonedScene, onHandRef]);

  // Handle Animation Playback
  useEffect(() => {
    const action = actions[animName];
    if (action) {
      action.reset().fadeIn(0.2).play();

      if (
        animName.includes('Death') ||
        animName === 'Standing Aim Recoil' ||
        animName === 'Standing To Crouch' ||
        animName === 'Standing Jump'
      ) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      } else {
        action.setLoop(THREE.LoopRepeat, Infinity);
      }

      return () => {
        action.fadeOut(0.2);
      };
    }
  }, [animName, actions]);

  useFrame((_state, delta) => {
    if (mixer) mixer.update(delta);
  });

  return (
    <group ref={group} position={position} rotation={rotation} scale={actualScale}>
      <primitive object={clonedScene} />
    </group>
  );
}
