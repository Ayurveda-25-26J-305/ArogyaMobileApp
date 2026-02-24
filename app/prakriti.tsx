import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storage, authService } from '../services/supabase';

const QUESTIONS = [
  {
    id: 1,
    category: 'Physical',
    question: 'Body Build',
    options: [
      { label: 'Thin/Light', dosha: 'vata' },
      { label: 'Medium', dosha: 'pitta' },
      { label: 'Large/Heavy', dosha: 'kapha' },
    ],
  },
  {
    id: 2,
    category: 'Physical',
    question: 'Skin Type',
    options: [
      { label: 'Dry/Rough', dosha: 'vata' },
      { label: 'Warm/Oily', dosha: 'pitta' },
      { label: 'Thick/Cool', dosha: 'kapha' },
    ],
  },
  {
    id: 3,
    category: 'Digestive',
    question: 'Appetite',
    options: [
      { label: 'Irregular', dosha: 'vata' },
      { label: 'Strong', dosha: 'pitta' },
      { label: 'Steady/Slow', dosha: 'kapha' },
    ],
  },
  {
    id: 4,
    category: 'Sleep',
    question: 'Sleep Pattern',
    options: [
      { label: 'Light/Interrupted', dosha: 'vata' },
      { label: 'Moderate', dosha: 'pitta' },
      { label: 'Deep/Long', dosha: 'kapha' },
    ],
  },
  {
    id: 5,
    category: 'Mental',
    question: 'Mental Activity',
    options: [
      { label: 'Restless/Active', dosha: 'vata' },
      { label: 'Sharp/Focused', dosha: 'pitta' },
      { label: 'Calm/Steady', dosha: 'kapha' },
    ],
  },
  {
    id: 6,
    category: 'Emotional',
    question: 'Temperament',
    options: [
      { label: 'Anxious/Worried', dosha: 'vata' },
      { label: 'Irritable/Angry', dosha: 'pitta' },
      { label: 'Calm/Attached', dosha: 'kapha' },
    ],
  },
];

const DOSHA_COLORS = {
  vata: '#FF6B6B',
  pitta: '#4ECDC4',
  kapha: '#45B7D1',
};

export default function PrakritiScreen() {
  const router = useRouter();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleAnswer = (dosha: string) => {
    const newAnswers = { ...answers, [currentQ]: dosha };
    setAnswers(newAnswers);
    
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      calculatePrakriti(newAnswers);
    }
  };

  const calculatePrakriti = async (finalAnswers: Record<number, string>) => {
    const counts = { vata: 0, pitta: 0, kapha: 0 };
    Object.values(finalAnswers).forEach((dosha) => {
      counts[dosha as keyof typeof counts]++;
    });

    const total = QUESTIONS.length;
    const vata = counts.vata / total;
    const pitta = counts.pitta / total;
    const kapha = counts.kapha / total;

    const dominant = vata >= pitta && vata >= kapha
      ? 'vata'
      : pitta >= kapha
      ? 'pitta'
      : 'kapha';

    const prakriti = {
      vata: vata.toFixed(2),
      pitta: pitta.toFixed(2),
      kapha: kapha.toFixed(2),
      dominant,
    };

    try {
      const user = await authService.currentUser();
      if (user) {
        await storage.savePrakriti(user.id, prakriti);
      }
    } catch (e) {
      console.log('Error saving prakriti:', e);
    }

    Alert.alert(
      'Assessment Complete! 🎉',
      `Your dominant Prakriti is ${dominant.toUpperCase()}`,
      [
        {
          text: 'Start Prediction',
          onPress: () => router.push({ pathname: '/prediction', params: { prakriti: JSON.stringify(prakriti) } } as any),
        },
      ]
    );
  };

  const goBack = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const question = QUESTIONS[currentQ];
  const progress = ((currentQ + 1) / QUESTIONS.length) * 100;

  return (
    <View style={styles.container}>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Question {currentQ + 1} of {QUESTIONS.length}
        </Text>
      </View>

      {/* Question Card */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionCard}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{question.category}</Text>
          </View>
          <Text style={styles.questionTitle}>{question.question}</Text>
          <Text style={styles.questionSubtitle}>Select the option that best describes you</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionBtn,
                answers[currentQ] === option.dosha && styles.optionBtnActive,
                { borderColor: DOSHA_COLORS[option.dosha as keyof typeof DOSHA_COLORS] },
              ]}
              onPress={() => handleAnswer(option.dosha)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View
                  style={[
                    styles.optionDot,
                    { backgroundColor: DOSHA_COLORS[option.dosha as keyof typeof DOSHA_COLORS] },
                    answers[currentQ] === option.dosha && styles.optionDotActive,
                  ]}
                />
                <View style={styles.optionTextContainer}>
                  <Text style={[
                    styles.optionLabel,
                    answers[currentQ] === option.dosha && styles.optionLabelActive,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionDosha}>
                    {option.dosha.charAt(0).toUpperCase() + option.dosha.slice(1)}
                  </Text>
                </View>
              </View>
              {answers[currentQ] === option.dosha && (
                <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Navigation */}
        {currentQ > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#2d5016" />
            <Text style={styles.backBtnText}>Previous Question</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  
  progressContainer: { backgroundColor: '#fff', padding: 20, paddingTop: 60, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  progressBg: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: '#2d5016', borderRadius: 4 },
  progressText: { fontSize: 14, color: '#777', textAlign: 'center', fontWeight: '600' },
  
  content: { flex: 1, padding: 20 },
  
  questionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#f1f8e9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 16 },
  categoryText: { fontSize: 12, fontWeight: '700', color: '#2d5016', textTransform: 'uppercase' },
  questionTitle: { fontSize: 24, fontWeight: 'bold', color: '#1b5e20', marginBottom: 8 },
  questionSubtitle: { fontSize: 14, color: '#777' },
  
  optionsContainer: { gap: 12, marginBottom: 24 },
  optionBtn: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    borderWidth: 2, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  optionBtnActive: { backgroundColor: '#f1f8e9', elevation: 3 },
  optionContent: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  optionDot: { width: 16, height: 16, borderRadius: 8 },
  optionDotActive: { width: 20, height: 20, borderRadius: 10 },
  optionTextContainer: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 2 },
  optionLabelActive: { color: '#1b5e20', fontWeight: '700' },
  optionDosha: { fontSize: 12, color: '#999', textTransform: 'capitalize' },
  
  backBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 16, borderRadius: 12, borderWidth: 2,
    borderColor: '#2d5016', backgroundColor: '#fff',
  },
  backBtnText: { fontSize: 15, fontWeight: '700', color: '#2d5016' },
});