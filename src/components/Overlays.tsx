import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { audioManager } from '../lib/audioManager';

export function StartGameLoader() {
  const {
    gameState, assetsReady, assetsProgress,
    quizFetchState, quizError, rawQuestions,
    _beginGame, requestStartGame,
  } = useGameStore();

  const didBegin = useRef(false);

  useEffect(() => {
    if (gameState !== 'starting') {
      didBegin.current = false;
      return;
    }

    if (assetsReady && quizFetchState === 'done' && !didBegin.current) {
      didBegin.current = true;
      _beginGame(rawQuestions);
    }
  }, [gameState, assetsReady, quizFetchState, rawQuestions, _beginGame]);

  if (gameState !== 'starting') return null;

  const pct = Math.round(assetsProgress * 100);

  if (quizFetchState === 'error') {
    return (
      <div className="overlay-screen" style={{ zIndex: 999 }}>
        <div className="start-content">
          <h2 className="game-title" style={{ fontSize: '1.8rem', color: '#e74c3c' }}>
            ⚠️ Quiz Load Failed
          </h2>
          <p style={{ color: 'var(--text-dim)', margin: '1rem 0', fontSize: '0.85rem' }}>
            {quizError}
          </p>
          <button
            className="btn-primary"
            onClick={() => {
              audioManager.play('ui_click');
              requestStartGame();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!assetsReady) {
    return (
      <div className="overlay-screen" style={{ zIndex: 999, backgroundColor: 'rgba(0, 77, 64, 1)' }}>
        <div className="start-content">
          <h2 className="game-title" style={{ fontSize: '2rem' }}>
            🏹 LOADING GAME
          </h2>
          <p className="game-subtitle" style={{ marginBottom: '1.5rem' }}>
            Loading 3D Assets ({pct}%)…
          </p>
          <div className="loader-bar-track">
            <div className="loader-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <p style={{ color: 'var(--mint)', marginTop: '0.8rem', fontFamily: 'Bangers, cursive', fontSize: '1.2rem', letterSpacing: '1px' }}>
            {pct}%
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay-screen" style={{ zIndex: 999, backgroundColor: 'rgba(0, 77, 64, 1)' }}>
      <div className="start-content">
        <h2 className="game-title" style={{ fontSize: '2rem' }}>
          🎯 GENERATING QUIZ…
        </h2>
        <div className="quiz-spinner" />
      </div>
    </div>
  );
}

export function StartScreen() {
  const { gameState, requestStartGame } = useGameStore();

  if (gameState !== 'idle') return null;

  return (
    <div id="startScreen" className="overlay-screen">
      <div className="start-content">
        <h1 className="game-title">🏹 ARCHER QUIZ 3D</h1>
        <p className="game-subtitle">Shoot the correct answer!</p>
        <div className="start-instructions">
          <div className="instr-item">🖱️ <span>Drag &amp; pull the bow string to aim</span></div>
          <div className="instr-item">✅ <span>Hit correct man = <b>+100 pts</b></span></div>
          <div className="instr-item">❌ <span>Wrong/Miss = <b>-10 pts</b></span></div>
          <div className="instr-item">⚡ <span>Use 50/50 to eliminate 2 wrong options</span></div>
          <div className="instr-item">💡 <span>Use Hint for a memory trick</span></div>
        </div>
        <button id="startBtn" className="btn-primary" onClick={requestStartGame}>
          START GAME
        </button>
      </div>
    </div>
  );
}

export function EndScreen() {
  const { gameState, score, maxStreak, correctCount, gameQuestions, requestStartGame } = useGameStore();

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
        <button id="playAgainBtn" className="btn-primary" onClick={requestStartGame}>
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}
