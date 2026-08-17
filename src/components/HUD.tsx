import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export default function HUD() {
  const [showRestartModal, setShowRestartModal] = useState(false);
  const { 
    gameState, currentQIndex, gameQuestions,
    score, streak, fiftyUsed, useFiftyFifty, 
    toggleMute, muted, feedback
  } = useGameStore();

  if (gameState === 'idle' || gameState === 'end') return null;

  const currentQ = gameQuestions[currentQIndex];

  return (
    <div id="gameWrapper" className="interactive-layer">
      {/* TOP HUD */}
      <div id="topHud">
        <div id="questionBox">
          <span id="questionLabel">{currentQIndex + 1}/{gameQuestions.length}</span>
          <span id="questionText">
            What word means <span className="q-highlight">"{currentQ?.definition}"</span>?
          </span>
        </div>
        <div id="topControls">
          <button id="restartBtn" className="hud-btn" title="Restart" onClick={() => setShowRestartModal(true)}>🔄</button>
          <button id="muteBtn" className="hud-btn" title="Mute" onClick={toggleMute}>{muted ? '🔇' : '🔊'}</button>
        </div>
      </div>

      {/* SCORE (left middle) */}
      <div className="score-overlay">
        <span className="score-label">SCORE</span>
        <span className="score-value">{score}</span>
      </div>

      {/* BOTTOM HUD */}
      <div id="bottomHud">
        <button 
          id="fiftyBtn" 
          className="hud-btn bottom-btn" 
          title="50/50"
          onClick={useFiftyFifty}
          disabled={fiftyUsed || gameState !== 'aiming'}
        >
          <span>50/50</span>
        </button>
        <div id="streakDisplay">
          <span id="streakLabel">Streak: <b id="streakValue">{streak}</b></span>
        </div>
        <button 
          id="hintBtn" 
          className="hud-btn bottom-btn" 
          title="Hint"
          onClick={() => {
            const popup = document.getElementById('hintPopup');
            if(popup) popup.style.display = popup.style.display === 'flex' ? 'none' : 'flex';
          }}
        >
          💡 Hint
        </button>
      </div>

      {/* HINT POPUP */}
      <div id="hintPopup" style={{ display: 'none' }}>
        <div className="hint-icon">💡</div>
        <p className="hint-text">
          <b>Mnemonic:</b><br/>{currentQ?.mnemonic}
        </p>
        <button 
          style={{marginTop: '1rem', padding: '0.3rem 1rem', borderRadius: '20px', background: 'var(--mint)', color: '#000', border: 'none', cursor: 'pointer', fontFamily: 'Bangers, cursive', fontSize: '1.2rem'}}
          onClick={(e) => {
            (e.target as HTMLElement).parentElement!.style.display = 'none';
          }}
        >CLOSE</button>
      </div>

      {/* RESTART MODAL */}
      {showRestartModal && (
        <div className="overlay-screen" style={{ zIndex: 200, backgroundColor: 'rgba(0,0,0,0.7)', pointerEvents: 'auto' }}>
          <div className="start-content" style={{ maxWidth: '320px', padding: '1.5rem' }}>
            <h2 className="game-subtitle" style={{ fontSize: '1.3rem', color: '#f5a623', marginBottom: '1rem', fontWeight: 'bold' }}>Restart Game?</h2>
            <p style={{ color: '#e0faf4', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Are you sure you want to restart and lose your current progress?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn-primary" 
                style={{ padding: '0.5rem 1.5rem', background: 'rgba(255,255,255,0.1)', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
                onClick={() => setShowRestartModal(false)}
              >
                No
              </button>
              <button 
                className="btn-primary" 
                style={{ padding: '0.5rem 1.5rem', background: '#e74c3c', boxShadow: 'none' }}
                onClick={() => window.location.reload()}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK FLASH */}
      {feedback && (
        <div id="feedbackFlash" style={{ color: feedback.color, animation: 'flashAnim 1.7s ease forwards' }}>
          {feedback.text}
        </div>
      )}
    </div>
  );
}
