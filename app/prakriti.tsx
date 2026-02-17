import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../services/api';
import { PRAKRITI_QUESTIONS } from '../utils/constants';

const DOSHA_COLORS: any = { vata: '#FF6B6B', pitta: '#4ECDC4', kapha: '#45B7D1' };

export default function PrakritiScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<any>({});

  const calculatePrakriti = (ans: any) => {
    const counts: any = { vata: 0, pitta: 0, kapha: 0 };
    Object.values(ans).forEach((v: any) => { counts[v]++; });
    const total = Object.values(counts).reduce((a: any, b: any) => a + b, 0) as number;
    return {
      vata: (counts.vata / total).toFixed(2),
      pitta: (counts.pitta / total).toFixed(2),
      kapha: (counts.kapha / total).toFixed(2),
      dominant: (Object.keys(counts) as string[]).reduce((a, b) => counts[a] > counts[b] ? a : b),
    };
  };

  const handleAnswer = async (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (current < PRAKRITI_QUESTIONS.length - 1) {
      setCurrent(current + 1);
    } else {
      const prakriti = calculatePrakriti(newAnswers);
      await storage.savePrakriti(prakriti);
      router.replace({
        pathname: '/prediction',
        params: { prakriti: JSON.stringify(prakriti) },
      } as any);
    }
  };

  const question = PRAKRITI_QUESTIONS[current];
  const progress = ((current + 1) / PRAKRITI_QUESTIONS.length) * 100;

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progressBox}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Question {current + 1} of {PRAKRITI_QUESTIONS.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>

        {/* Options */}
        {question.options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.optionCard,
              answers[question.id] === opt.value && styles.optionSelected,
            ]}
            onPress={() => handleAnswer(question.id, opt.value)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={[
                styles.optionLabel,
                answers[question.id] === opt.value && styles.optionLabelSelected,
              ]}>
                {opt.label}
              </Text>
            </View>
            <View style={[styles.doshaBadge, { backgroundColor: DOSHA_COLORS[opt.value] }]}>
              <Text style={styles.doshaText}>{opt.dosha}</Text>
            </View>
            {answers[question.id] === opt.value && (
              <Ionicons name="checkmark-circle" size={22} color="#2d5016" style={{ marginLeft: 8 }} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Back Button */}
      {current > 0 && (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setCurrent(current - 1)}
        >
          <Ionicons name="arrow-back" size={18} color="#2d5016" />
          <Text style={styles.backBtnText}>Previous</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  progressBox: {
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#e0e0e0',
  },
  progressBg: {
    height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden', marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: '#2d5016', borderRadius: 4 },
  progressText: { fontSize: 13, color: '#757575', textAlign: 'center' },
  content: { padding: 16, paddingBottom: 30 },
  questionCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 22, marginBottom: 20,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5,
  },
  questionText: { fontSize: 18, fontWeight: '600', color: '#1b5e20', lineHeight: 26 },
  optionCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 18,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    borderWidth: 2, borderColor: '#e0e0e0',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  optionSelected: { borderColor: '#2d5016', backgroundColor: '#f1f8e9' },
  optionLabel: { fontSize: 15, color: '#333', lineHeight: 20 },
  optionLabelSelected: { fontWeight: '600', color: '#1b5e20' },
  doshaBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  doshaText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0', gap: 6,
  },
  backBtnText: { fontSize: 15, fontWeight: '600', color: '#2d5016' },
});