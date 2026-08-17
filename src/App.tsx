import { useEffect } from 'react';
import Scene from './components/Scene';
import HUD from './components/HUD';
import { StartScreen, EndScreen, GameLoader } from './components/Overlays';
import { useGameStore } from './store/gameStore';

function App() {
  const setWords = useGameStore(state => state.setWords);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}/data.json`)
      .then(r => r.json())
      .then(d => setWords(d))
      .catch(e => {
        console.error("Failed to load data.json", e);
        // Fallback words
        setWords([
          { word: 'Ambivalence', mnemonic: 'Aam Violence', definition: 'The State of having Conflicting Emotional Attitudes' },
          { word: 'Amorphous', mnemonic: 'Aam(mango)', definition: 'Formless' },
          { word: 'Anachronistic', mnemonic: 'Ana crow', definition: 'Having an Error involving time in a story' },
          { word: 'Analogous', mnemonic: 'ana logo', definition: 'Comparable' },
          { word: 'Anarchist', mnemonic: 'ana christ', definition: 'Person who seeks to overturn the established government' }
        ]);
      });
  }, [setWords]);

  return (
    <>
      <StartScreen />
      <EndScreen />
      <HUD />
      <Scene />
      <GameLoader />
    </>
  );
}

export default App;
