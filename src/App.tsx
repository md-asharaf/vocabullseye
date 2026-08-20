import { useEffect } from 'react';
import Scene from './components/Scene';
import HUD from './components/HUD';
import { StartScreen, EndScreen, StartGameLoader } from './components/Overlays';
import { useGameStore } from './store/gameStore';
import { loadAllAssets } from './lib/assetLoader';

function App() {
  const setAssetsProgress = useGameStore(s => s.setAssetsProgress);
  const setLoadedGLTFs    = useGameStore(s => s.setLoadedGLTFs);

  useEffect(() => {
    loadAllAssets(import.meta.env.BASE_URL, setAssetsProgress)
      .then(setLoadedGLTFs)
      .catch(err => console.error('[App] Asset loading failed:', err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <StartScreen />
      <EndScreen />
      <HUD />
      <Scene />
      <StartGameLoader />
    </>
  );
}

export default App;
