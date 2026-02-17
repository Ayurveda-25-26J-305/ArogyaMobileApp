// app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/api';

export default function HomeScreen() {
  const router = useRouter();
  const [prakriti, setPrakriti] = useState<any>(null);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const saved = await storage.getPrakriti();
    const history = await storage.getHistory();
    setPrakriti(saved);
    setHistoryCount(history.length);
  };

  const features = [
    { title: 'Disease Prediction', desc: 'Constitutional-aware AI diagnosis', icon: 'fitness', color: '#2d5016', route: '/prakriti' },
    { title: 'Medicine Guide', desc: 'Personalized Ayurvedic remedies', icon: 'medical', color: '#4a7c2c', route: '/(tabs)/medicine' },
    { title: 'Diet Planning', desc: 'Dosha-balanced meal plans', icon: 'restaurant', color: '#6a8759', route: '/(tabs)/diet' },
    { title: 'Ask Questions', desc: 'Intelligent Ayurvedic guidance', icon: 'help-circle', color: '#558b2f', route: '/(tabs)/qa' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🌿 Welcome to Arogya</Text>
        <Text style={styles.heroSubtitle}>
          Ancient Ayurvedic Wisdom Powered by Modern AI
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { value: '84.2%', label: 'Accuracy' },
          { value: '5', label: 'Diseases' },
          { value: String(historyCount), label: 'My Tests' },
        ].map((stat, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Get Started */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Get Started</Text>
        {prakriti ? (
          <View style={styles.card}>
            <View style={styles.prakritiRow}>
              <Ionicons name="checkmark-circle" size={22} color="#4caf50" />
              <Text style={styles.prakritiText}>
                Prakriti: <Text style={styles.prakritiValue}>{prakriti.dominant?.toUpperCase()}</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/prediction' as any)}
            >
              <Ionicons name="analytics" size={22} color="#fff" />
              <Text style={styles.primaryBtnText}>Start Disease Prediction</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={async () => { await storage.clearPrakriti(); setPrakriti(null); }}
            >
              <Text style={styles.secondaryBtnText}>Retake Prakriti Assessment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/prakriti' as any)}
          >
            <Ionicons name="body" size={22} color="#fff" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.primaryBtnText}>Start Prakriti Assessment</Text>
              <Text style={styles.primaryBtnSub}>Discover your constitutional type</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        {features.map((f, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.featureCard, { borderLeftColor: f.color }]}
            onPress={() => router.push(f.route as any)}
          >
            <View style={[styles.featureIcon, { backgroundColor: f.color }]}>
              <Ionicons name={f.icon as any} size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
        ))}
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.card}>
          {[
            { step: '1', title: 'Prakriti Assessment', desc: 'Answer 6 quick questions' },
            { step: '2', title: 'Select Symptom', desc: 'Choose from 60+ symptoms' },
            { step: '3', title: 'AI Prediction', desc: '84.2% accurate results' },
            { step: '4', title: 'Get Guidance', desc: 'Personalized recommendations' },
          ].map((item, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNum}>{item.step}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={styles.stepDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Ionicons name="warning" size={18} color="#ff9800" />
        <Text style={styles.disclaimerText}>
          For educational purposes only. Always consult qualified Ayurvedic practitioners.
        </Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  hero: {
    backgroundColor: '#2d5016',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
  },
  heroTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: '#c8e6c9', textAlign: 'center', lineHeight: 20 },
  statsRow: { flexDirection: 'row', marginTop: -24, marginHorizontal: 16, gap: 8, marginBottom: 8 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14,
    alignItems: 'center', elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#2d5016' },
  statLabel: { fontSize: 11, color: '#757575', marginTop: 2 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1b5e20', marginBottom: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  prakritiRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  prakritiText: { fontSize: 15, color: '#333' },
  prakritiValue: { fontWeight: 'bold', color: '#2d5016' },
  primaryBtn: {
    backgroundColor: '#2d5016', borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  primaryBtnSub: { color: '#c8e6c9', fontSize: 12, marginTop: 2 },
  secondaryBtn: { marginTop: 10, padding: 10, alignItems: 'center' },
  secondaryBtnText: { color: '#2d5016', fontSize: 14, fontWeight: '600' },
  featureCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4,
    marginBottom: 10, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  featureIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  featureTitle: { fontSize: 14, fontWeight: '600', color: '#1b5e20' },
  featureDesc: { fontSize: 12, color: '#757575', marginTop: 2 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2d5016', alignItems: 'center', justifyContent: 'center' },
  stepNum: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: '#1b5e20' },
  stepDesc: { fontSize: 12, color: '#757575', marginTop: 2 },
  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff3cd',
    margin: 16, padding: 12, borderRadius: 8, gap: 8,
  },
  disclaimerText: { flex: 1, fontSize: 12, color: '#856404', lineHeight: 18 },
});