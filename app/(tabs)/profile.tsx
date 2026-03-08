// app/(tabs)/profile.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService, userService, predictionService } from '../../services/supabase';
import DoshaChart from '../../components/DoshaChart';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [prakriti, setPrakriti] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [qaProfile, setQaProfile] = useState<{
    dominant_dosha: string;
    current_season: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await authService.currentUser();
      if (currentUser) {
        setUser(currentUser);
        const p = await userService.getPrakriti(currentUser.id);
        setPrakriti(p);
        const h = await predictionService.getHistory(currentUser.id);
        setHistory(h.slice(0, 5));
      }
    } catch (e) {
      console.log('Error loading profile:', e);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            router.replace('/login' as any);
          },
        },
      ]
    );
  };

  const handleClearHistory = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            if (user) {
              await predictionService.clearAll(user.id);
              setHistory([]);
            }
          },
        },
      ]
    );
  };

  const handleRetakePrakriti = async () => {
    if (user) {
      await userService.savePrakriti(user.id, null);
      setPrakriti(null);
      router.push('/prakriti' as any);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.email || 'User'}</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color="#d32f2f" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Prakriti Summary */}
      {prakriti ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Prakriti</Text>
          <DoshaChart prakriti={prakriti} />
          <View style={styles.doshaScores}>
            <View style={styles.doshaScore}>
              <View style={[styles.doshaDot, { backgroundColor: '#FF6B6B' }]} />
              <Text style={styles.doshaLabel}>Vata</Text>
              <Text style={styles.doshaValue}>{(parseFloat(prakriti.vata) * 100).toFixed(0)}%</Text>
            </View>
            <View style={styles.doshaScore}>
              <View style={[styles.doshaDot, { backgroundColor: '#4ECDC4' }]} />
              <Text style={styles.doshaLabel}>Pitta</Text>
              <Text style={styles.doshaValue}>{(parseFloat(prakriti.pitta) * 100).toFixed(0)}%</Text>
            </View>
            <View style={styles.doshaScore}>
              <View style={[styles.doshaDot, { backgroundColor: '#45B7D1' }]} />
              <Text style={styles.doshaLabel}>Kapha</Text>
              <Text style={styles.doshaValue}>{(parseFloat(prakriti.kapha) * 100).toFixed(0)}%</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.retakeBtn} onPress={handleRetakePrakriti} activeOpacity={0.7}>
            <Ionicons name="refresh" size={16} color="#2d5016" />
            <Text style={styles.retakeBtnText}>Retake Assessment</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Ionicons name="body-outline" size={48} color="#ccc" />
          <Text style={styles.emptyTitle}>No Prakriti Assessment</Text>
          <Text style={styles.emptyText}>Take the assessment to discover your body constitution</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/prakriti' as any)} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Start Assessment</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Prediction History */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Predictions</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearHistory}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        {history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="time-outline" size={48} color="#ccc" />
            <Text style={styles.emptyHistoryText}>No predictions yet</Text>
          </View>
        ) : (
          history.map((item, index) => (
            <View key={index} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyDisease}>{item.predicted_disease}</Text>
                <Text style={styles.historyConfidence}>
                  {(item.confidence * 100).toFixed(1)}%
                </Text>
              </View>
              <Text style={styles.historySymptom}>Symptom: {item.symptom}</Text>
              <Text style={styles.historyDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Team Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Members</Text>
        {[
          { name: 'Perera S I A', id: 'IT22905918', module: 'Disease Prediction' },
          { name: 'Roche J P', id: 'IT22344274', module: 'Medicine Recommendation' },
          { name: 'Dias W A N M', id: 'IT22899910', module: 'Diet Planning' },
          { name: 'Fernando K P M R A', id: 'IT22897176', module: 'Q&A System' },
        ].map((member, i) => (
          <View key={i} style={styles.teamCard}>
            <View style={styles.teamAvatar}>
              <Text style={styles.teamAvatarText}>{member.name.charAt(0)}</Text>
            </View>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{member.name}</Text>
              <Text style={styles.teamId}>{member.id}</Text>
              <Text style={styles.teamModule}>{member.module}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Project Info */}
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>SLIIT • CoEAI</Text>
        <Text style={styles.footerSubtitle}>Project 25-26J-305</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>84.2%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>10%</Text>
            <Text style={styles.statLabel}>Improvement</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1000+</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Diseases</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  
  header: { backgroundColor: '#2d5016', paddingTop: 60, paddingBottom: 32, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#2d5016' },
  userName: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#d32f2f' },
  
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, padding: 20, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1b5e20', marginBottom: 16, alignSelf: 'flex-start' },
  doshaScores: { width: '100%', gap: 12, marginTop: 16 },
  doshaScore: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doshaDot: { width: 12, height: 12, borderRadius: 6 },
  doshaLabel: { flex: 1, fontSize: 14, color: '#666', fontWeight: '500' },
  doshaValue: { fontSize: 16, fontWeight: 'bold', color: '#1b5e20' },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#2d5016' },
  retakeBtnText: { fontSize: 14, fontWeight: '600', color: '#2d5016' },
  
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1b5e20', marginTop: 12, marginBottom: 4 },
  emptyText: { fontSize: 13, color: '#777', textAlign: 'center', marginBottom: 16 },
  primaryBtn: { backgroundColor: '#2d5016', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  
  section: { marginHorizontal: 16, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1b5e20' },
  clearText: { fontSize: 14, color: '#d32f2f', fontWeight: '600' },
  
  emptyHistory: { backgroundColor: '#fff', borderRadius: 16, padding: 40, alignItems: 'center' },
  emptyHistoryText: { fontSize: 14, color: '#999', marginTop: 12 },
  
  historyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyDisease: { fontSize: 16, fontWeight: '700', color: '#1b5e20' },
  historyConfidence: { fontSize: 14, fontWeight: '600', color: '#4caf50' },
  historySymptom: { fontSize: 13, color: '#666', marginBottom: 4 },
  historyDate: { fontSize: 12, color: '#999' },
  
  teamCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  teamAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2d5016', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  teamAvatarText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  teamInfo: { flex: 1, justifyContent: 'center' },
  teamName: { fontSize: 15, fontWeight: '700', color: '#1b5e20', marginBottom: 2 },
  teamId: { fontSize: 12, color: '#666', marginBottom: 2 },
  teamModule: { fontSize: 12, color: '#2d5016', fontWeight: '500' },
  
  footer: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 24, padding: 20, borderRadius: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  footerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1b5e20', marginBottom: 4 },
  footerSubtitle: { fontSize: 13, color: '#777', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 20 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#2d5016', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase' },
});