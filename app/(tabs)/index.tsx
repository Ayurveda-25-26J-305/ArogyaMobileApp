import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storage, authService } from '../../services/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const [prakriti, setPrakriti] = useState<any>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await authService.currentUser();
      setUser(currentUser);
      if (currentUser) {
        const p = await storage.getPrakriti(currentUser.id);
        setPrakriti(p);
        const h = await storage.getHistory(currentUser.id);
        setHistoryCount(h.length);
      }
    } catch (e) {
      console.log('Error loading data:', e);
    }
  };

  const handleQuickStart = () => {
    if (prakriti) {
      router.push({ pathname: '/prediction', params: { prakriti: JSON.stringify(prakriti) } } as any);
    } else {
      router.push('/prakriti' as any);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🌿</Text>
        <Text style={styles.heroTitle}>Arogya</Text>
        <Text style={styles.heroSubtitle}>
          Constitutional-Aware Ayurvedic Disease Prediction
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>84.2%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Diseases</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{historyCount}</Text>
          <Text style={styles.statLabel}>Tests</Text>
        </View>
      </View>

      {/* Quick Start */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎯 Quick Start</Text>
        <Text style={styles.cardText}>
          {prakriti
            ? 'Your Prakriti is assessed. Start disease prediction now.'
            : 'Begin by assessing your Prakriti (body constitution).'}
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleQuickStart} activeOpacity={0.8}>
          <Ionicons name={prakriti ? 'analytics' : 'body'} size={20} color="#fff" />
          <Text style={styles.primaryBtnText}>
            {prakriti ? 'Start Prediction' : 'Assess Prakriti'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Features Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.grid}>
          {[
            { icon: 'body', title: 'Prakriti Assessment', desc: 'Determine your body constitution', route: '/prakriti' },
            { icon: 'analytics', title: 'Disease Prediction', desc: 'AI-powered health analysis', route: '/prediction' },
            { icon: 'medkit', title: 'Medicine Recommendations', desc: 'Personalized herbal remedies', route: '/(tabs)/medicine' },
            { icon: 'nutrition', title: 'Diet Plans', desc: 'Ayurvedic meal suggestions', route: '/(tabs)/diet' },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.featureCard}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.featureIconWrap}>
                <Ionicons name={item.icon as any} size={28} color="#2d5016" />
              </View>
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsContainer}>
          {[
            { num: '1', title: 'Assess Prakriti', desc: 'Answer questions about your body type' },
            { num: '2', title: 'Enter Symptoms', desc: 'Select your primary symptom and severity' },
            { num: '3', title: 'Get Prediction', desc: 'AI analyzes using constitutional factors' },
            { num: '4', title: 'View Results', desc: 'Receive personalized recommendations' },
          ].map((step, i) => (
            <View key={i} style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.num}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle" size={20} color="#ff9800" />
        <Text style={styles.disclaimerText}>
          This is a research prototype. Always consult qualified Ayurvedic practitioners for diagnosis and treatment.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  hero: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  heroEmoji: { fontSize: 64, marginBottom: 12 },
  heroTitle: { fontSize: 36, fontWeight: 'bold', color: '#1b5e20', marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: '#777', textAlign: 'center', maxWidth: 280 },
  
  statsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 20,
    alignItems: 'center', elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#2d5016', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#777', textTransform: 'uppercase' },
  
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16,
    borderRadius: 16, padding: 20, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1b5e20', marginBottom: 8 },
  cardText: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 16 },
  
  primaryBtn: {
    backgroundColor: '#2d5016', borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  section: { marginHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1b5e20', marginBottom: 16 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureCard: {
    width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3,
  },
  featureIconWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#f1f8e9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  featureTitle: { fontSize: 15, fontWeight: '700', color: '#1b5e20', marginBottom: 4 },
  featureDesc: { fontSize: 12, color: '#777', lineHeight: 16 },
  
  stepsContainer: { gap: 12 },
  stepCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', gap: 16, elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  stepNumber: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#2d5016',
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumberText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  stepContent: { flex: 1, justifyContent: 'center' },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#1b5e20', marginBottom: 2 },
  stepDesc: { fontSize: 13, color: '#777', lineHeight: 18 },
  
  disclaimer: {
    marginHorizontal: 16, backgroundColor: '#fff3cd', borderRadius: 12,
    padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start',
  },
  disclaimerText: { flex: 1, fontSize: 13, color: '#856404', lineHeight: 18 },
});