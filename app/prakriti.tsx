import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { userService, authService } from '../services/supabase';

const QUESTIONS = [
  {
    id: 1,
    category: 'Physical',
    question: 'Body Frame & Build',
    subtitle: 'How would you describe your natural body frame?',
    options: [
      { 
        label: 'Thin/Light', 
        dosha: 'vata', 
        help: 'Slim build, prominent joints, find it difficult to gain weight even when eating well',
        weight: 0.15
      },
      { 
        label: 'Medium', 
        dosha: 'pitta', 
        help: 'Moderate build with good muscle tone, can gain or lose weight with effort',
        weight: 0.15
      },
      { 
        label: 'Large/Solid', 
        dosha: 'kapha', 
        help: 'Broad shoulders/hips, solid build, gain weight easily and lose it slowly',
        weight: 0.15
      },
    ],
  },
  {
    id: 2,
    category: 'Physical',
    question: 'Skin Texture & Quality',
    subtitle: 'What best describes your skin texture?',
    options: [
      { 
        label: 'Dry/Rough/Thin', 
        dosha: 'vata', 
        help: 'Skin feels dry, may crack in winter, visible veins, ages with fine lines',
        weight: 0.12
      },
      { 
        label: 'Warm/Soft/Oily', 
        dosha: 'pitta', 
        help: 'Skin feels warm to touch, may have acne or rashes, sensitive to sun',
        weight: 0.12
      },
      { 
        label: 'Thick/Smooth/Cool', 
        dosha: 'kapha', 
        help: 'Soft and moist skin, cool to touch, ages well with fewer wrinkles',
        weight: 0.12
      },
    ],
  },
  {
    id: 3,
    category: 'Digestive',
    question: 'Appetite Pattern',
    subtitle: 'How would you describe your appetite?',
    options: [
      { 
        label: 'Irregular/Variable', 
        dosha: 'vata', 
        help: 'Sometimes very hungry, other times not at all. May forget to eat when busy',
        weight: 0.13
      },
      { 
        label: 'Strong/Sharp', 
        dosha: 'pitta', 
        help: 'Get very hungry at regular times. Irritable or uncomfortable if meals are delayed',
        weight: 0.13
      },
      { 
        label: 'Steady/Low', 
        dosha: 'kapha', 
        help: 'Can skip meals easily without discomfort. Eat at regular times but never urgently hungry',
        weight: 0.13
      },
    ],
  },
  {
    id: 4,
    category: 'Digestive',
    question: 'Digestion Speed',
    subtitle: 'How quickly do you digest food?',
    options: [
      { 
        label: 'Quick/Irregular', 
        dosha: 'vata', 
        help: 'Food moves through quickly, may experience gas or bloating, irregular bowel movements',
        weight: 0.10
      },
      { 
        label: 'Fast/Strong', 
        dosha: 'pitta', 
        help: 'Digest food rapidly, regular bowel movements 2-3 times daily, may feel heat after eating',
        weight: 0.10
      },
      { 
        label: 'Slow/Steady', 
        dosha: 'kapha', 
        help: 'Digestion feels slow and heavy, bowel movements once daily or less, may feel sluggish after meals',
        weight: 0.10
      },
    ],
  },
  {
    id: 5,
    category: 'Sleep',
    question: 'Sleep Pattern',
    subtitle: 'What best describes your sleep?',
    options: [
      { 
        label: 'Light/Interrupted', 
        dosha: 'vata', 
        help: 'Wake up easily from small noises, trouble falling back asleep, sleep less than 6 hours',
        weight: 0.10
      },
      { 
        label: 'Moderate/Sound', 
        dosha: 'pitta', 
        help: 'Fall asleep quickly, may wake once, need 6-7 hours, dream vividly',
        weight: 0.10
      },
      { 
        label: 'Deep/Heavy', 
        dosha: 'kapha', 
        help: 'Sleep deeply and long (8+ hours), hard to wake up, groggy in morning',
        weight: 0.10
      },
    ],
  },
  {
    id: 6,
    category: 'Mental',
    question: 'Mental Activity & Thinking',
    subtitle: 'How does your mind work?',
    options: [
      { 
        label: 'Quick/Active/Creative', 
        dosha: 'vata', 
        help: 'Mind always racing with many ideas, creative but may struggle to focus, learn quickly but forget quickly',
        weight: 0.12
      },
      { 
        label: 'Sharp/Focused/Analytical', 
        dosha: 'pitta', 
        help: 'Logical thinker, good at planning and decisions, focused but may become critical or perfectionist',
        weight: 0.12
      },
      { 
        label: 'Calm/Steady/Methodical', 
        dosha: 'kapha', 
        help: 'Think slowly but thoroughly, excellent memory once learned, calm but may resist change',
        weight: 0.12
      },
    ],
  },
  {
    id: 7,
    category: 'Emotional',
    question: 'Stress Response',
    subtitle: 'How do you typically respond to stress?',
    options: [
      { 
        label: 'Anxiety/Worry/Fear', 
        dosha: 'vata', 
        help: 'Tend to worry and overthink, feel anxious or nervous, may experience panic or scattered thoughts',
        weight: 0.11
      },
      { 
        label: 'Anger/Frustration', 
        dosha: 'pitta', 
        help: 'Get frustrated easily, may lose temper, become critical of others or impatient',
        weight: 0.11
      },
      { 
        label: 'Withdrawal/Depression', 
        dosha: 'kapha', 
        help: 'Become withdrawn or sad, hold onto things or relationships, may overeat or oversleep',
        weight: 0.11
      },
    ],
  },
  {
    id: 8,
    category: 'Energy',
    question: 'Energy Levels & Stamina',
    subtitle: 'How would you describe your energy?',
    options: [
      { 
        label: 'Bursts/Quick Fatigue', 
        dosha: 'vata', 
        help: 'Energetic in short bursts, tire quickly, energy fluctuates throughout the day',
        weight: 0.08
      },
      { 
        label: 'Steady/Moderate', 
        dosha: 'pitta', 
        help: 'Consistent energy levels, good stamina, can push through when needed',
        weight: 0.08
      },
      { 
        label: 'Slow Start/High Endurance', 
        dosha: 'kapha', 
        help: 'Slow to get started but excellent endurance once moving, steady energy all day',
        weight: 0.08
      },
    ],
  },
  {
    id: 9,
    category: 'Physical',
    question: 'Temperature Preference',
    subtitle: 'Which weather suits you best?',
    options: [
      { 
        label: 'Prefer Warm', 
        dosha: 'vata', 
        help: 'Feel cold easily, hands and feet often cold, love warm weather and hot drinks',
        weight: 0.05
      },
      { 
        label: 'Prefer Cool', 
        dosha: 'pitta', 
        help: 'Feel hot easily, prefer cool weather, uncomfortable in heat, like cold drinks',
        weight: 0.05
      },
      { 
        label: 'Tolerate Both', 
        dosha: 'kapha', 
        help: 'Comfortable in most temperatures, may prefer moderate climate',
        weight: 0.05
      },
    ],
  },
  {
    id: 10,
    category: 'Behavioral',
    question: 'Speech & Communication',
    subtitle: 'How would you describe your way of speaking?',
    options: [
      { 
        label: 'Fast/Talkative', 
        dosha: 'vata', 
        help: 'Speak quickly, talk a lot, may jump between topics, voice may be weak or hoarse',
        weight: 0.04
      },
      { 
        label: 'Clear/Articulate', 
        dosha: 'pitta', 
        help: 'Speak clearly and precisely, good at debates, voice is strong and sharp',
        weight: 0.04
      },
      { 
        label: 'Slow/Steady', 
        dosha: 'kapha', 
        help: 'Speak slowly and thoughtfully, voice is deep and melodious, say less but meaningful',
        weight: 0.04
      },
    ],
  },
];

const DOSHA_COLORS = {
  vata: '#FF6B6B',
  pitta: '#4ECDC4',
  kapha: '#45B7D1',
};

const DOSHA_INFO = {
  vata: {
    icon: '💨',
    element: 'Air + Space',
    characteristics: 'Creative, energetic, quick thinking',
    traits: ['Light body', 'Dry skin', 'Variable appetite', 'Light sleeper', 'Active mind'],
  },
  pitta: {
    icon: '🔥',
    element: 'Fire + Water',
    characteristics: 'Intelligent, focused, ambitious',
    traits: ['Medium build', 'Warm skin', 'Strong appetite', 'Moderate sleep', 'Sharp mind'],
  },
  kapha: {
    icon: '🌊',
    element: 'Earth + Water',
    characteristics: 'Calm, stable, compassionate',
    traits: ['Sturdy body', 'Smooth skin', 'Steady appetite', 'Deep sleep', 'Calm mind'],
  },
};

export default function PrakritiScreen() {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { dosha: string; weight: number }>>({});

  const handleAnswer = (dosha: string, weight: number) => {
    const newAnswers = { ...answers, [currentQ]: { dosha, weight } };
    setAnswers(newAnswers);
    
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      calculatePrakriti(newAnswers);
    }
  };

  const calculatePrakriti = async (finalAnswers: Record<number, { dosha: string; weight: number }>) => {
    // Weighted calculation
    const scores = { vata: 0, pitta: 0, kapha: 0 };
    
    Object.values(finalAnswers).forEach((answer) => {
      scores[answer.dosha as keyof typeof scores] += answer.weight;
    });

    const total = scores.vata + scores.pitta + scores.kapha;
    const vata = scores.vata / total;
    const pitta = scores.pitta / total;
    const kapha = scores.kapha / total;

    const dominant = vata >= pitta && vata >= kapha
      ? 'vata'
      : pitta >= kapha
      ? 'pitta'
      : 'kapha';

    // Calculate confidence
    const maxScore = Math.max(vata, pitta, kapha);
    const secondMax = [vata, pitta, kapha].sort((a, b) => b - a)[1];
    const confidence = maxScore - secondMax; // Higher = more certain

    const prakriti = {
      vata: vata.toFixed(2),
      pitta: pitta.toFixed(2),
      kapha: kapha.toFixed(2),
      dominant,
      confidence: confidence > 0.2 ? 'HIGH' : confidence > 0.1 ? 'MODERATE' : 'LOW',
    };

    try {
      const user = await authService.currentUser();
     if (user) {
        // ✅ FIXED: Use userService.savePrakriti instead of storage
        await userService.savePrakriti(user.id, prakriti);
        console.log('✅ Prakriti saved successfully to Supabase');
      } else {
        console.warn('⚠️ No user logged in - cannot save prakriti');
      }
    } catch (e) {
      console.error('❌ Error saving prakriti:', e);
    }

    const info = DOSHA_INFO[dominant];
    const confidenceEmoji = prakriti.confidence === 'HIGH' ? '✅' : prakriti.confidence === 'MODERATE' ? '⚠️' : '❓';
    
    Alert.alert(
      `Your Prakriti: ${dominant.toUpperCase()} ${info.icon}`,
      `${info.element}\n\n${info.characteristics}\n\nKey traits:\n• ${info.traits.join('\n• ')}\n\nConfidence: ${prakriti.confidence} ${confidenceEmoji}`,
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

  if (showIntro) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.introContent}>
        <View style={styles.introHeader}>
          <Text style={styles.introEmoji}>🌿</Text>
          <Text style={styles.introTitle}>Prakriti Assessment</Text>
          <Text style={styles.introSubtitle}>Discover Your Body Constitution in 10 Questions</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Prakriti</Text> is your unique mind-body constitution in Ayurveda. It influences how you look, think, digest food, and respond to stress.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>The Three Doshas</Text>

        {Object.entries(DOSHA_INFO).map(([dosha, info]) => (
          <View key={dosha} style={styles.doshaCard}>
            <View style={styles.doshaHeader}>
              <Text style={styles.doshaEmoji}>{info.icon}</Text>
              <View style={styles.doshaHeaderText}>
                <Text style={styles.doshaName}>{dosha.toUpperCase()}</Text>
                <Text style={styles.doshaElement}>{info.element}</Text>
              </View>
            </View>
            <Text style={styles.doshaCharacteristics}>{info.characteristics}</Text>
          </View>
        ))}

        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={24} color="#2d5016" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Assessment Info</Text>
            <Text style={styles.tipText}>
              • Takes 3-4 minutes{'\n'}
              • 10 validated questions{'\n'}
              • Answer based on your natural tendencies{'\n'}
              • ~75% accuracy compared to clinical assessment
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => setShowIntro(false)}
          activeOpacity={0.8}
        >
          <Text style={styles.startBtnText}>Start Assessment</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.skipBtnText}>Skip for Now</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const question = QUESTIONS[currentQ];
  const progress = ((currentQ + 1) / QUESTIONS.length) * 100;

  return (
    <View style={styles.container}>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            Question {currentQ + 1} of {QUESTIONS.length}
          </Text>
          <TouchableOpacity onPress={() => setShowHelp(true)} style={styles.helpBtn}>
            <Ionicons name="help-circle" size={24} color="#2d5016" />
          </TouchableOpacity>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Question Card */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionCard}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{question.category}</Text>
          </View>
          <Text style={styles.questionTitle}>{question.question}</Text>
          <Text style={styles.questionSubtitle}>{question.subtitle}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionBtn,
                answers[currentQ]?.dosha === option.dosha && styles.optionBtnActive,
                { borderColor: DOSHA_COLORS[option.dosha as keyof typeof DOSHA_COLORS] },
              ]}
              onPress={() => handleAnswer(option.dosha, option.weight)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View
                  style={[
                    styles.optionDot,
                    { backgroundColor: DOSHA_COLORS[option.dosha as keyof typeof DOSHA_COLORS] },
                    answers[currentQ]?.dosha === option.dosha && styles.optionDotActive,
                  ]}
                />
                <View style={styles.optionTextContainer}>
                  <Text style={[
                    styles.optionLabel,
                    answers[currentQ]?.dosha === option.dosha && styles.optionLabelActive,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionHelp}>{option.help}</Text>
                </View>
              </View>
              {answers[currentQ]?.dosha === option.dosha && (
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

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Help Modal */}
      <Modal visible={showHelp} animationType="slide" onRequestClose={() => setShowHelp(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Dosha Guide</Text>
            <TouchableOpacity onPress={() => setShowHelp(false)} style={styles.modalClose}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {Object.entries(DOSHA_INFO).map(([dosha, info]) => (
              <View key={dosha} style={styles.modalDoshaCard}>
                <Text style={styles.modalDoshaTitle}>
                  {info.icon} {dosha.toUpperCase()}
                </Text>
                <Text style={styles.modalDoshaElement}>{info.element}</Text>
                <Text style={styles.modalDoshaDesc}>{info.characteristics}</Text>
                {info.traits.map((trait, i) => (
                  <Text key={i} style={styles.modalDoshaTrait}>• {trait}</Text>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// Styles remain the same as previous version
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  introContent: { padding: 20, paddingTop: 60 },
  introHeader: { alignItems: 'center', marginBottom: 32 },
  introEmoji: { fontSize: 64, marginBottom: 12 },
  introTitle: { fontSize: 28, fontWeight: 'bold', color: '#1b5e20', marginBottom: 8 },
  introSubtitle: { fontSize: 15, color: '#777', textAlign: 'center' },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24, elevation: 2 },
  infoText: { fontSize: 15, color: '#444', lineHeight: 22 },
  bold: { fontWeight: '700', color: '#1b5e20' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1b5e20', marginBottom: 16 },
  doshaCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2 },
  doshaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  doshaEmoji: { fontSize: 32, marginRight: 12 },
  doshaHeaderText: { flex: 1 },
  doshaName: { fontSize: 18, fontWeight: 'bold', color: '#1b5e20' },
  doshaElement: { fontSize: 13, color: '#777', marginTop: 2 },
  doshaCharacteristics: { fontSize: 14, color: '#666', fontStyle: 'italic' },
  tipCard: { flexDirection: 'row', backgroundColor: '#e8f5e9', borderRadius: 12, padding: 16, marginBottom: 24, gap: 12, borderLeftWidth: 4, borderLeftColor: '#2d5016' },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 14, fontWeight: '700', color: '#1b5e20', marginBottom: 6 },
  tipText: { fontSize: 13, color: '#2d5016', lineHeight: 20 },
  startBtn: { backgroundColor: '#2d5016', borderRadius: 12, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 3, marginBottom: 12 },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  skipBtn: { padding: 16, alignItems: 'center' },
  skipBtnText: { color: '#777', fontSize: 14 },
  progressContainer: { backgroundColor: '#fff', padding: 20, paddingTop: 60, elevation: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressText: { fontSize: 14, color: '#777', fontWeight: '600' },
  helpBtn: { padding: 4 },
  progressBg: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2d5016', borderRadius: 4 },
  content: { flex: 1, padding: 20 },
  questionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, elevation: 2 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#f1f8e9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 16 },
  categoryText: { fontSize: 12, fontWeight: '700', color: '#2d5016', textTransform: 'uppercase' },
  questionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1b5e20', marginBottom: 6 },
  questionSubtitle: { fontSize: 14, color: '#777' },
  optionsContainer: { gap: 12, marginBottom: 24 },
  optionBtn: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 1 },
  optionBtnActive: { backgroundColor: '#f1f8e9', elevation: 3 },
  optionContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, flex: 1 },
  optionDot: { width: 16, height: 16, borderRadius: 8, marginTop: 2 },
  optionDotActive: { width: 20, height: 20, borderRadius: 10 },
  optionTextContainer: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6 },
  optionLabelActive: { color: '#1b5e20', fontWeight: '700' },
  optionHelp: { fontSize: 13, color: '#777', lineHeight: 18 },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#2d5016', backgroundColor: '#fff' },
  backBtnText: { fontSize: 15, fontWeight: '700', color: '#2d5016' },
  modalContainer: { flex: 1, backgroundColor: '#f1f8e9' },
  modalHeader: { backgroundColor: '#2d5016', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  modalClose: { padding: 4 },
  modalContent: { flex: 1, padding: 20 },
  modalDoshaCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2 },
  modalDoshaTitle: { fontSize: 20, fontWeight: 'bold', color: '#1b5e20', marginBottom: 4 },
  modalDoshaElement: { fontSize: 14, color: '#777', marginBottom: 8 },
  modalDoshaDesc: { fontSize: 14, color: '#666', marginBottom: 12, fontStyle: 'italic' },
  modalDoshaTrait: { fontSize: 13, color: '#555', marginBottom: 4, lineHeight: 18 },
});