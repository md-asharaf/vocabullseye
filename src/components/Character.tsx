import { useRef, useEffect, useMemo } from 'react';
import { useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../store/gameStore';

export interface CharacterProps {
  animName:       string;
  position?:      [number, number, number] | THREE.Vector3;
  rotation?:      [number, number, number] | THREE.Euler;
  scale?:         number;
  onHandRef?:     (hand: THREE.Object3D) => void;
  characterType?: 'archer' | 'target';
}

export function Character({
  animName,
  position,
  rotation,
  scale = 0.6,
  onHandRef,
  characterType = 'archer',
}: CharacterProps) {
  const group       = useRef<THREE.Group>(null);
  const { size }    = useThree();
  const isMobile    = size.width < 520;
  const actualScale = isMobile ? scale * 0.7 : scale;

  const loadedGLTFs = useGameStore(s => s.loadedGLTFs);

  const baseGltf = useMemo(() => {
    if (!loadedGLTFs) return null;
    const key = characterType === 'target'
      ? 'Passive Marker Man'
      : 'Erika Archer With Bow Arrow';
    return loadedGLTFs[key] ?? null;
  }, [loadedGLTFs, characterType]);

  const clonedScene = useMemo(
    () => (baseGltf ? SkeletonUtils.clone(baseGltf.scene) : null),
    [baseGltf],
  );

  const animations = useMemo<THREE.AnimationClip[]>(() => {
    if (!loadedGLTFs) return [];

    const animMap: Record<string, string> = {
      'Standing Aim Overdraw':   'Standing Aim Overdraw',
      'Standing Aim Recoil':     'Standing Aim Recoil',
      'Standing Death Backward': 'Standing Death Backward',
      'Standing Draw Arrow':     'Standing Draw Arrow',
      'Standing Idle Examine':   'Standing Idle Examine',
      'Standing Idle':           'Standing Idle',
      'Standing Jump':           'Standing Jump',
      'Standing To Crouch':      'Standing To Crouch',
    };

    return Object.entries(animMap).flatMap(([srcKey, clipName]) => {
      const clip = loadedGLTFs[srcKey]?.animations?.[0];
      if (!clip) return [];
      return [{ ...clip, name: clipName }] as THREE.AnimationClip[];
    });
  }, [loadedGLTFs]);

  const { actions, mixer } = useAnimations(animations, group);

  useEffect(() => {
    if (!clonedScene) return;
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  useEffect(() => {
    if (!clonedScene || !onHandRef) return;
    clonedScene.traverse(child => {
      if (child.name === 'mixamorigLeftHand' || child.name === 'LeftHand') {
        onHandRef(child);
      }
    });
  }, [clonedScene, onHandRef]);

  useEffect(() => {
    const action = actions[animName];
    if (!action) return;

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

    return () => { action.fadeOut(0.2); };
  }, [animName, actions]);

  useFrame((_state, delta) => {
    if (mixer) mixer.update(delta);
  });

  if (!clonedScene) return null;

  return (
    <group ref={group} position={position} rotation={rotation} scale={actualScale}>
      <primitive object={clonedScene} />
    </group>
  );
}
