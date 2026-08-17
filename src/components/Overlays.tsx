import { useGameStore } from '../store/gameStore';
import { useProgress } from '@react-three/drei';

export function GameLoader() {
  const { gameState, isSceneReady } = useGameStore();
  const { progress } = useProgress();

  if (gameState === 'idle' || gameState === 'end') return null;
  if (isSceneReady) return null;

  return (
    <div className="overlay-screen" style={{ zIndex: 999999, backgroundColor: 'rgba(0, 77, 64, 1)' }}>
      <div className="start-content">
        <h2 className="game-title" style={{ fontSize: '2.5rem' }}>PREPARING TARGETS...</h2>
        <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden', marginTop: '1.5rem' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--mint)', transition: 'width 0.2s' }} />
        </div>
        <p style={{ color: 'var(--mint)', marginTop: '0.8rem', fontFamily: 'Bangers, cursive', fontSize: '1.2rem', letterSpacing: '1px' }}>
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}

export function StartScreen() {
  const { gameState, startGame } = useGameStore();

  if (gameState !== 'idle') return null;

  return (
    <div id="startScreen" className="overlay-screen">
      <div className="start-content">
        <h1 className="game-title">🏹 ARCHER QUIZ 3D</h1>
        <p className="game-subtitle">Shoot the correct answer!</p>
        <div className="start-instructions">
          <div className="instr-item">🖱️ <span>Drag & pull the bow string to aim</span></div>
          <div className="instr-item">✅ <span>Hit correct man = <b>+100 pts</b></span></div>
          <div className="instr-item">❌ <span>Wrong/Miss = <b>-10 pts</b></span></div>
          <div className="instr-item">⚡ <span>Use 50/50 to eliminate 2 wrong options</span></div>
          <div className="instr-item">💡 <span>Use Hint for a memory trick</span></div>
        </div>
        <button id="startBtn" className="btn-primary" onClick={startGame}>START GAME</button>
      </div>
    </div>
  );
}

export function EndScreen() {
  const { gameState, score, maxStreak, correctCount, gameQuestions, startGame } = useGameStore();

  if (gameState !== 'end') return null;

  return (
    <div id="endScreen" className="overlay-screen">
      <div className="end-content">
        <h2 className="end-title">🎯 GAME OVER!</h2>
        <div className="end-stats">
          <div className="stat-box">
            <span className="stat-label">Final Score</span>
            <span className="stat-value" id="finalScore">{score}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Max Streak</span>
            <span className="stat-value" id="finalStreak">{maxStreak}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Correct</span>
            <span className="stat-value" id="finalCorrect">{correctCount}/{gameQuestions.length}</span>
          </div>
        </div>
        <button id="playAgainBtn" className="btn-primary" onClick={startGame}>PLAY AGAIN</button>
      </div>
    </div>
  );
}
