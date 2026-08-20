import type { QuizQuestion, ApiResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const PROJECT_ID = import.meta.env.VITE_PROJECT_ID as string;

export async function fetchQuiz(): Promise<QuizQuestion[]> {
  const url = `${API_BASE_URL}/projects/${PROJECT_ID}/quiz`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `${res.status} ${res.statusText}`);
  }

  const body: ApiResponse<QuizQuestion[]> = await res.json();

  if (!body.success || !Array.isArray(body.data)) {
    throw new Error(body.message ?? 'Quiz API returned an unexpected response shape.');
  }

  return body.data;
}
