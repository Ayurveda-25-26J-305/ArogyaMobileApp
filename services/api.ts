import { authService, userService, predictionService } from './supabase';

const API_URL = 'http://192.168.1.42:5000'; 

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