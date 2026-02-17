// services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


const API_BASE_URL = 'http://192.168.1.42:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
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