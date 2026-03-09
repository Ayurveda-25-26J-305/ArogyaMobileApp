import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://davxldqvxxtejapdjvzn.supabase.co';
const SUPABASE_ANON = 'sb_publishable_F5YVtzxylKvjx8OKnU5KTA_5-eXD1IE';

const isWeb = Platform.OS === 'web';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: isWeb ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// AUTH SERVICE
// ═══════════════════════════════════════════════════════════════════════════
export const authService = {
  register: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      console.error('Auth signup error:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('No user returned from signup');
    }

    console.log('Auth user created:', data.user.id);

    if (!data.session) {
      console.log('Email confirmation required — skipping profile insert until confirmed');
      return data.user;
    }

    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    const { error: insertError } = await supabase.from('users').insert({
      id: data.user.id,
      name,
      email,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Failed to create user profile:', insertError);
      throw insertError;
    }

    console.log('User profile created in users table');
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

// ═══════════════════════════════════════════════════════════════════════════
// USER SERVICE (INCLUDES PRAKRITI)
// ═══════════════════════════════════════════════════════════════════════════
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
    if (!prakriti) {
      // Clear prakriti
      const { error } = await supabase.from('users').update({
        prakriti_vata: null,
        prakriti_pitta: null,
        prakriti_kapha: null,
        prakriti_dominant: null,
        prakriti_updated: null,
      }).eq('id', userId);
      if (error) throw error;
      console.log('✅ Prakriti cleared from Supabase');
      return;
    }

    // Save prakriti
    const { error } = await supabase.from('users').update({
      prakriti_vata: parseFloat(prakriti.vata),
      prakriti_pitta: parseFloat(prakriti.pitta),
      prakriti_kapha: parseFloat(prakriti.kapha),
      prakriti_dominant: prakriti.dominant,
      prakriti_updated: new Date().toISOString(),
    }).eq('id', userId);
    
    if (error) {
      console.error('❌ Error saving Prakriti:', error);
      throw error;
    }
    console.log('✅ Prakriti saved to Supabase');
  },

  getPrakriti: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('prakriti_vata, prakriti_pitta, prakriti_kapha, prakriti_dominant')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('❌ Error loading Prakriti:', error);
      return null;
    }
    
    if (!data?.prakriti_dominant) {
      console.log('ℹ️ No Prakriti found for user');
      return null;
    }
    
    const prakriti = {
      vata: data.prakriti_vata?.toString() || '0.33',
      pitta: data.prakriti_pitta?.toString() || '0.33',
      kapha: data.prakriti_kapha?.toString() || '0.33',
      dominant: data.prakriti_dominant,
    };
    
    console.log('✅ Prakriti loaded:', prakriti);
    return prakriti;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PREDICTION SERVICE
// ═══════════════════════════════════════════════════════════════════════════
export const predictionService = {
  save: async (userId: string, prediction: any) => {
    const { error } = await supabase.from('predictions').insert({
      user_id: userId,
      predicted_disease: prediction.predicted_disease,
      confidence: prediction.confidence,
      symptom: prediction.symptom,
      severity: prediction.severity,
      duration_days: prediction.duration,
      top_3: JSON.stringify(prediction.top_3 || []),
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
  },

  getHistory: async (userId: string) => {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  delete: async (predictionId: string) => {
    const { error } = await supabase.from('predictions').delete().eq('id', predictionId);
    if (error) throw error;
  },

  clearAll: async (userId: string) => {
    const { error } = await supabase.from('predictions').delete().eq('user_id', userId);
    if (error) throw error;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// MEDICINE SERVICE
// ═══════════════════════════════════════════════════════════════════════════
export const medicineService = {
  getByDisease: async (disease: string) => {
    const { data, error } = await supabase.from('medicines').select('*').eq('disease', disease);
    if (error) throw error;
    return data || [];
  },

  getByDosha: async (dosha: string) => {
    const { data, error } = await supabase.from('medicines').select('*').ilike('dosha', `%${dosha}%`);
    if (error) throw error;
    return data || [];
  },

  getAll: async () => {
    const { data, error } = await supabase.from('medicines').select('*');
    if (error) throw error;
    return data || [];
  },

  add: async (medicine: any) => {
    const { error } = await supabase.from('medicines').insert({
      name: medicine.name,
      sanskrit_name: medicine.sanskrit_name,
      disease: medicine.disease,
      dosha: medicine.dosha,
      description: medicine.description,
      dosage: medicine.dosage,
      preparation: medicine.preparation,
      source: medicine.source,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// DIET SERVICE
// ═══════════════════════════════════════════════════════════════════════════
export const dietService = {
  getPlanByDosha: async (dosha: string) => {
    const { data, error } = await supabase.from('diet_plans').select('*').ilike('dosha', `%${dosha}%`);
    if (error) throw error;
    return data || [];
  },

  getPlanByDiseaseAndDosha: async (disease: string, dosha: string) => {
    const { data, error } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('disease', disease)
      .ilike('dosha', `%${dosha}%`);
    if (error) throw error;
    return data || [];
  },

  getAllFoods: async () => {
    const { data, error } = await supabase.from('ayurvedic_foods').select('*');
    if (error) throw error;
    return data || [];
  },

  addPlan: async (plan: any) => {
    const { error } = await supabase.from('diet_plans').insert({
      disease: plan.disease,
      dosha: plan.dosha,
      meal_type: plan.meal_type,
      foods: JSON.stringify(plan.foods || []),
      avoid_foods: JSON.stringify(plan.avoid_foods || []),
      season: plan.season,
      description: plan.description,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
  },

  addFood: async (food: any) => {
    const { error } = await supabase.from('ayurvedic_foods').insert({
      name: food.name,
      rasa: food.rasa,
      virya: food.virya,
      vipaka: food.vipaka,
      dosha_effect: JSON.stringify(food.dosha_effect || {}),
      benefits: food.benefits,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// QA SERVICE
// ═══════════════════════════════════════════════════════════════════════════
export const qaService = {
  saveQA: async (userId: string, question: string, answer: string) => {
    const { error } = await supabase.from('qa_history').insert({
      user_id: userId,
      question,
      answer,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
  },

  getUserHistory: async (userId: string) => {
    const { data, error } = await supabase
      .from('qa_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  searchKnowledge: async (keyword: string) => {
    const { data, error } = await supabase
      .from('qa_knowledge')
      .select('*')
      .or(`question.ilike.%${keyword}%,answer.ilike.%${keyword}%`);
    if (error) throw error;
    return data || [];
  },

  addKnowledge: async (qa: any) => {
    const { error } = await supabase.from('qa_knowledge').insert({
      question: qa.question,
      answer: qa.answer,
      source: qa.source,
      category: qa.category,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// NER SERVICE
// ═══════════════════════════════════════════════════════════════════════════
export const nerService = {
  getAll: async () => {
    const { data, error } = await supabase.from('ner_data').select('*');
    if (error) throw error;
    return data || [];
  },

  getBySource: async (source: string) => {
    const { data, error } = await supabase.from('ner_data').select('*').eq('source', source);
    if (error) throw error;
    return data || [];
  },

  add: async (ner: any) => {
    const { error } = await supabase.from('ner_data').insert({
      sentence: ner.sentence,
      entity_text: ner.entity_text,
      entity_label: ner.entity_label,
      start_position: ner.start_position,
      end_position: ner.end_position,
      source: ner.source,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
  },

  getSymptomMappings: async () => {
    const { data, error } = await supabase.from('symptom_disease_mappings').select('*');
    if (error) throw error;
    return data || [];
  },

  addMapping: async (mapping: any) => {
    const { error } = await supabase.from('symptom_disease_mappings').insert({
      symptom: mapping.symptom,
      disease: mapping.disease,
      severity: mapping.severity,
      dosha: mapping.dosha,
      source: mapping.source,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY STORAGE WRAPPER (for backward compatibility with api.ts)
// ═══════════════════════════════════════════════════════════════════════════
export const storage = {
  savePrakriti: userService.savePrakriti,
  getPrakriti: userService.getPrakriti,
  saveHistory: predictionService.save,
  getHistory: predictionService.getHistory,
  clearHistory: predictionService.clearAll,
};