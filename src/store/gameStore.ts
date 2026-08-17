import { create } from 'zustand';

export interface Option {
  text: string;
  correct: boolean;
  eliminated: boolean;
}

export interface Question {
  word: string;
  definition: string;
  mnemonic: string;
  options: Option[];
}

export interface WordItem {
  word: string;
  definition: string;
  mnemonic: string;
}

export interface Feedback {
  text: string;
  color: string;
}

export type GameState = 'idle' | 'aiming' | 'flying' | 'result' | 'end';

interface StoreState {
  allWords: WordItem[];
  gameQuestions: Question[];
  currentQIndex: number;
  currentOptions: Option[];
  score: number;
  streak: number;
  maxStreak: number;
  correctCount: number;
  gameState: GameState;
  fiftyUsed: boolean;
  muted: boolean;
  feedback: Feedback | null;
  isSceneReady: boolean;

  setWords: (words: WordItem[]) => void;
  startGame: () => void;
  nextQuestion: () => void;
  handleHit: (index: number) => void;
  handleMiss: () => void;
  useFiftyFifty: () => void;
  toggleMute: () => void;
  setGameState: (state: GameState) => void;
  setSceneReady: (ready: boolean) => void;
}

const QUESTIONS_PER_GAME = 12;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const useGameStore = create<StoreState>((set, get) => ({
  allWords: [],
  gameQuestions: [],
  currentQIndex: 0,
  currentOptions: [],
  score: 0,
  streak: 0,
  maxStreak: 0,
  correctCount: 0,
  gameState: 'idle',
  fiftyUsed: false,
  muted: false,
  feedback: null,
  isSceneReady: false,

  setWords: (words) => set({ allWords: words }),

  startGame: () => {
    const { allWords } = get();
    if (allWords.length === 0) return;

    const pool = shuffle(allWords);
    const sel = pool.slice(0, Math.min(QUESTIONS_PER_GAME, pool.length));
    const gameQuestions: Question[] = [];

    sel.forEach((item) => {
      let others = allWords.filter((w) => w.word !== item.word);
      others = shuffle(others).slice(0, 3);
      const opts: Option[] = [
        { text: item.word, correct: true, eliminated: false },
        { text: others[0].word, correct: false, eliminated: false },
        { text: others[1].word, correct: false, eliminated: false },
        { text: others[2].word, correct: false, eliminated: false }
      ];
      gameQuestions.push({
        word: item.word,
        definition: (() => {
          const s = item.definition.replace(/\[cite.*?\]/g, '').trim().toLowerCase();
          return s.charAt(0).toUpperCase() + s.slice(1);
        })(),
        mnemonic: item.mnemonic,
        options: shuffle(opts)
      });
    });

    set({
      gameQuestions,
      currentQIndex: 0,
      currentOptions: gameQuestions[0].options,
      score: 0,
      streak: 0,
      maxStreak: 0,
      correctCount: 0,
      gameState: 'aiming',
      fiftyUsed: false,
      feedback: null
    });
  },

  nextQuestion: () => {
    const state = get();
    const nextIdx = state.currentQIndex + 1;
    if (nextIdx >= state.gameQuestions.length) {
      set({ gameState: 'end', feedback: null });
    } else {
      set({
        currentQIndex: nextIdx,
        currentOptions: state.gameQuestions[nextIdx].options,
        gameState: 'aiming',
        fiftyUsed: false,
        feedback: null
      });
    }
  },

  handleHit: (index) => {
    const state = get();
    const opt = state.currentOptions[index];
    if (opt.eliminated) return;

    let newScore = state.score;
    let newStreak = state.streak;
    let newCorrect = state.correctCount;
    let newMax = state.maxStreak;
    let feedback: Feedback | null = null;

    if (opt.correct) {
      newScore += 100;
      newStreak++;
      newCorrect++;
      if (newStreak > newMax) newMax = newStreak;
      feedback = { text: '+100 CORRECT!', color: '#2ecc71' };
    } else {
      newScore = Math.max(0, newScore - 10);
      newStreak = 0;
      feedback = { text: '-10 WRONG!', color: '#e74c3c' };
    }

    set({
      score: newScore,
      streak: newStreak,
      correctCount: newCorrect,
      maxStreak: newMax,
      gameState: 'result',
      feedback
    });

    setTimeout(() => {
      get().nextQuestion();
    }, 1900);
  },

  handleMiss: () => {
    const state = get();
    set({
      score: Math.max(0, state.score - 10),
      streak: 0,
      gameState: 'result',
      feedback: { text: '-10 💨 MISSED!', color: '#e67e22' }
    });

    setTimeout(() => {
      get().nextQuestion();
    }, 1500);
  },

  useFiftyFifty: () => {
    const state = get();
    if (state.fiftyUsed || state.gameState !== 'aiming') return;

    const wrong = state.currentOptions.filter((o) => !o.correct && !o.eliminated);
    const toEliminate = shuffle(wrong).slice(0, 2);

    const newOptions = state.currentOptions.map((o) => {
      if (toEliminate.includes(o)) {
        return { ...o, eliminated: true };
      }
      return o;
    });

    set({
      fiftyUsed: true,
      currentOptions: newOptions
    });
  },

  toggleMute: () => set((state) => ({ muted: !state.muted })),
  setGameState: (state) => set({ gameState: state }),
  setSceneReady: (ready) => set({ isSceneReady: ready })
}));
