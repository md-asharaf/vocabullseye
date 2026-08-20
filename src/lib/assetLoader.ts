import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export type ProgressCallback = (progress: number) => void;

export const ANIM_NAMES = [
  'Erika Archer With Bow Arrow',
  'Passive Marker Man',
  'Standing Aim Overdraw',
  'Standing Aim Recoil',
  'Standing Death Backward',
  'Standing Draw Arrow',
  'Standing Idle Examine',
  'Standing Idle',
  'Standing Jump',
  'Standing To Crouch',
] as const;

export type AnimName = (typeof ANIM_NAMES)[number];

export function loadAllAssets(
  baseUrl: string,
  onProgress: ProgressCallback,
): Promise<Record<string, GLTF>> {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(`${baseUrl}/draco/`);
  dracoLoader.preload();

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  const fileProgress: number[] = new Array(ANIM_NAMES.length).fill(0);

  const emitProgress = () => {
    const total = fileProgress.reduce((sum, p) => sum + p, 0);
    onProgress(total / fileProgress.length);
  };

  const promises = ANIM_NAMES.map((name, idx) => {
    const url = `${baseUrl}/models/${encodeURIComponent(name)}.glb`;

    return new Promise<[string, GLTF]>((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          fileProgress[idx] = 1;
          emitProgress();
          resolve([name, gltf]);
        },
        (event) => {
          if (event.lengthComputable) {
            fileProgress[idx] = event.loaded / event.total;
            emitProgress();
          }
        },
        (err) => {
          console.error(`[assetLoader] Failed to load ${name}.glb`, err);
          reject(new Error(`Failed to load ${name}.glb: ${(err as Error).message}`));
        },
      );
    });
  });

  return Promise.all(promises).then((entries) => {
    dracoLoader.dispose();
    return Object.fromEntries(entries) as Record<string, GLTF>;
  });
}

export function getClip(
  gltfs: Record<string, GLTF>,
  name: string,
  clipIndex = 0,
): THREE.AnimationClip | undefined {
  return gltfs[name]?.animations?.[clipIndex];
}
