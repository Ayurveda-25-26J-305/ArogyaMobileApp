// services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as QA_API_BASE_URL } from '../config';

// Single source of truth — update config.ts when ngrok URL changes
const API_BASE_URL = QA_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

export const diseaseApi = {
  predict: async (data: any) => {
    const response = await api.post('/predict', data);
    return response.data;
  },
};

export const storage = {
  savePrakriti: async (prakriti: any) => {
    await AsyncStorage.setItem('prakriti', JSON.stringify(prakriti));
  },

  getPrakriti: async () => {
    const data = await AsyncStorage.getItem('prakriti');
    return data ? JSON.parse(data) : null;
  },

  clearPrakriti: async () => {
    await AsyncStorage.removeItem('prakriti');
  },

  saveHistory: async (prediction: any) => {
    const history = await storage.getHistory();
    const entry = { ...prediction, timestamp: new Date().toISOString(), id: Date.now().toString() };
    history.unshift(entry);
    await AsyncStorage.setItem('history', JSON.stringify(history.slice(0, 20)));
  },

  getHistory: async () => {
    const data = await AsyncStorage.getItem('history');
    return data ? JSON.parse(data) : [];
  },

  clearHistory: async () => {
    await AsyncStorage.removeItem('history');
  },
};

// ─── QA Module API ────────────────────────────────────────────────────────────

const QA_HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

/** Fetch knowledge-base stats (total docs, model name). */
export async function fetchStats() {
  const res = await fetch(`${QA_API_BASE_URL}/api/stats`, { headers: QA_HEADERS });
  return res.json();
  // Returns: { success, stats: { total_documents, model } }
}

/** Ask a question and get an Ayurveda answer. */
export async function askQuestion(
  question: string,
  userId: string,
  profile?: { dominant_dosha: string; current_season: string } | null,
) {
  const res = await fetch(`${QA_API_BASE_URL}/api/ask`, {
    method: 'POST',
    headers: QA_HEADERS,
    body: JSON.stringify({
      question,
      user_id: userId,
      ...(profile ? { dominant_dosha: profile.dominant_dosha, current_season: profile.current_season } : {}),
    }),
  });
  return res.json();
}

/** Submit Prakriti quiz responses to get a personalised dosha profile. */
export async function submitPrakriti(
  userId: string,
  responses: Record<string, string>,
) {
  const res = await fetch(`${QA_API_BASE_URL}/api/prakriti/assess`, {
    method: 'POST',
    headers: QA_HEADERS,
    body: JSON.stringify({ user_id: userId, responses }),
  });
  return res.json();
  // Returns: { success, profile: { dominant_dosha, current_season } }
}