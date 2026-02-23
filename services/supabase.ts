import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';


const SUPABASE_URL  = 'https://davxldqvxxtejapdjvzn.supabase.co';
const SUPABASE_ANON = 'sb_publishable_F5YVtzxylKvjx8OKnU5KTA_5-eXD1IE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage:          AsyncStorage,   
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: false,
  },
});



export const authService = {

  register: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await supabase.from('users').insert({
        id:         data.user.id,
        name,
        email,
        created_at: new Date().toISOString(),
      });
    }
    return data.user;
  },

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getSession: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  currentUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  onAuthChange: (callback: (user: any) => void) => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
    return data.subscription;
  },
};

export const userService = {

  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  updateProfile: async (userId: string, updates: any) => {
    const { error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
  },

  savePrakriti: async (userId: string, prakriti: any) => {
    const { error } = await supabase
      .from('users')
      .update({
        prakriti_vata:     prakriti.vata,
        prakriti_pitta:    prakriti.pitta,
        prakriti_kapha:    prakriti.kapha,
        prakriti_dominant: prakriti.dominant,
        prakriti_updated:  new Date().toISOString(),
      })
      .eq('id', userId);
    if (error) throw error;
  },

  getPrakriti: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('prakriti_vata, prakriti_pitta, prakriti_kapha, prakriti_dominant')
      .eq('id', userId)
      .single();
    if (error) return null;
    if (!data?.prakriti_dominant) return null;
    return {
      vata:     data.prakriti_vata,
      pitta:    data.prakriti_pitta,
      kapha:    data.prakriti_kapha,
      dominant: data.prakriti_dominant,
    };
  },
};