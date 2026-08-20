import { create } from 'zustand';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { QuizQuestion } from '../types/api';
import { fetchQuiz } from '../lib/quizApi';
import { audioManager } from '../lib/audioManager';

export interface Option {
  text: string;
  correct: boolean;
  eliminated: boolean;
}


export interface Feedback {
  text: string;
  color: string;
}

export type GameState = 'idle' | 'starting' | 'aiming' | 'flying' | 'result' | 'end';
export type QuizFetchState = 'idle' | 'loading' | 'done' | 'error';
export type QuestionResult = 'pending' | 'correct' | 'wrong';

interface StoreState {
  loadedGLTFs: Record<string, GLTF> | null;
  assetsProgress: number;
  assetsReady: boolean;

  quizFetchState: QuizFetchState;
  quizError: string | null;
  rawQuestions: QuizQuestion[];

  gameQuestions: QuizQuestion[];
  currentQIndex: number;
  currentOptions: Option[];
  questionResults: QuestionResult[];

  score: number;
  streak: number;
  maxStreak: number;
  correctCount: number;

  gameState: GameState;
  fiftyUsed: boolean;
  muted: boolean;
  feedback: Feedback | null;

  setAssetsProgress: (p: number) => void;
  setLoadedGLTFs: (gltfs: Record<string, GLTF>) => void;

  requestStartGame: () => void;
  _beginGame: (questions: QuizQuestion[]) => void;
  nextQuestion: () => void;
  handleHit: (index: number) => void;
  handleMiss: () => void;
  useFiftyFifty: () => void;
  toggleMute: () => void;
  setGameState: (state: GameState) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(q: QuizQuestion): Option[] {
  return (q.options as string[]).map((text) => ({
    text,
    correct: text === q.answer.value,
    eliminated: false,
  }));
}

export const useGameStore = create<StoreState>((set, get) => ({
  loadedGLTFs: null,
  assetsProgress: 0,
  assetsReady: false,

  quizFetchState: 'idle',
  quizError: null,
  rawQuestions: [],

  gameQuestions: [],
  currentQIndex: 0,
  currentOptions: [],
  questionResults: [],

  score: 0,
  streak: 0,
  maxStreak: 0,
  correctCount: 0,

  gameState: 'idle',
  fiftyUsed: false,
  muted: false,
  feedback: null,

  setAssetsProgress: (p) => set({ assetsProgress: p }),

  setLoadedGLTFs: (gltfs) => set({ loadedGLTFs: gltfs, assetsReady: true, assetsProgress: 1 }),

  requestStartGame: () => {
    const { quizFetchState } = get();
    audioManager.play('ui_click');
    set({ gameState: 'starting', quizError: null });

    if (quizFetchState !== 'loading' && quizFetchState !== 'done') {
      set({ quizFetchState: 'loading' });

      fetchQuiz()
        .then((questions) => {
          set({ rawQuestions: questions, quizFetchState: 'done' });
        })
        .catch((err: Error) => {
          set({ quizFetchState: 'error', quizError: err.message });
        });
    }
  },

  _beginGame: (questions) => {
    const gameQuestions = shuffle(questions);
    const questionResults: QuestionResult[] = gameQuestions.map(() => 'pending');

    set({
      gameQuestions,
      currentQIndex: 0,
      currentOptions: buildOptions(gameQuestions[0]),
      questionResults,
      score: 0,
      streak: 0,
      maxStreak: 0,
      correctCount: 0,
      gameState: 'aiming',
      fiftyUsed: false,
      feedback: null,
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
        currentOptions: buildOptions(state.gameQuestions[nextIdx]),
        gameState: 'aiming',
        fiftyUsed: false,
        feedback: null,
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
    const newResults = [...state.questionResults];

    if (opt.correct) {
      newScore += 100;
      newStreak++;
      newCorrect++;
      if (newStreak > newMax) newMax = newStreak;
      feedback = { text: '+100 CORRECT!', color: '#2ecc71' };
      newResults[state.currentQIndex] = 'correct';
      audioManager.play('target_hit');
    } else {
      newScore = Math.max(0, newScore - 10);
      newStreak = 0;
      feedback = { text: '-10 WRONG!', color: '#e74c3c' };
      newResults[state.currentQIndex] = 'wrong';
      audioManager.play('target_miss');
    }

    set({
      score: newScore,
      streak: newStreak,
      correctCount: newCorrect,
      maxStreak: newMax,
      gameState: 'result',
      feedback,
      questionResults: newResults,
    });

    setTimeout(() => { get().nextQuestion(); }, 1900);
  },

  handleMiss: () => {
    const state = get();
    const newResults = [...state.questionResults];
    newResults[state.currentQIndex] = 'wrong';
    audioManager.play('target_miss');

    set({
      score: Math.max(0, state.score - 10),
      streak: 0,
      gameState: 'result',
      feedback: { text: '-10 💨 MISSED!', color: '#e67e22' },
      questionResults: newResults,
    });

    setTimeout(() => { get().nextQuestion(); }, 1500);
  },

  useFiftyFifty: () => {
    const state = get();
    if (state.fiftyUsed || state.gameState !== 'aiming') return;

    const wrong = state.currentOptions.filter((o) => !o.correct && !o.eliminated);
    const toEliminate = shuffle(wrong).slice(0, 2);

    const newOptions = state.currentOptions.map((o) =>
      toEliminate.includes(o) ? { ...o, eliminated: true } : o,
    );

    set({ fiftyUsed: true, currentOptions: newOptions });
    audioManager.play('ui_click');
  },

  toggleMute: () => set((s) => {
    const newMuted = !s.muted;
    audioManager.setMuted(newMuted);
    return { muted: newMuted };
  }),
  setGameState: (state) => set({ gameState: state }),
}));
