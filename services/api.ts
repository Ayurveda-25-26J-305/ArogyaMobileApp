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
import { authService, userService, predictionService } from './supabase';


const API_URL=""

export const diseaseApi = {
  predict: async (payload: {
    age: number;
    gender: string;
    symptom: string;
    severity: number;
    duration_days: number;
    vata_score: number;
    pitta_score: number;
    kapha_score: number;
    prakriti: string;
  }) => {
    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Disease API Error:', error);
      throw error;
    }
  },
};



export const storage = {

  savePrakriti: async (userId: string, prakriti: any) => {
    try {
      await userService.savePrakriti(userId, prakriti);
      console.log('Prakriti saved to Supabase');
    } catch (error) {
      console.error('Error saving prakriti:', error);
      throw error;
    }
  },

  getPrakriti: async (userId: string) => {
    try {
      const prakriti = await userService.getPrakriti(userId);
      console.log('Prakriti loaded from Supabase:', prakriti);
      return prakriti;
    } catch (error) {
      console.error('Error loading prakriti:', error);
      return null;
    }
  },

  saveHistory: async (prediction: any) => {
    try {
      const user = await authService.currentUser();
      if (!user) {
        console.warn('No user logged in - cannot save prediction');
        return;
      }

      await predictionService.save(user.id, {
        predicted_disease: prediction.predicted_disease,
        confidence: prediction.confidence,
        symptom: prediction.symptom,
        severity: prediction.severity,
        duration: prediction.duration,
        top_3: prediction.top_3,
      });

      console.log('Prediction saved to Supabase:', prediction.predicted_disease);
    } catch (error) {
      console.error('Error saving prediction:', error);
      throw error;
    }
  },

  getHistory: async (userId: string) => {
    try {
      const history = await predictionService.getHistory(userId);
      console.log('Loaded', history.length, 'predictions from Supabase');
      return history;
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  },

  clearHistory: async (userId: string) => {
    try {
      await predictionService.clearAll(userId);
      console.log('History cleared from Supabase');
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
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