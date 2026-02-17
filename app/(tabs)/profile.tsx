import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../services/api';
import { TEAM_MEMBERS } from '../../utils/constants';

export default function ProfileScreen() {
  const router = useRouter();
  const [prakriti, setPrakriti] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const p = await storage.getPrakriti();
    const h = await storage.getHistory();
    setPrakriti(p);
    setHistory(h);
  };

  const handleClearHistory = () => {
    Alert.alert('Clear History', 'Delete all prediction history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => {
        await storage.clearHistory();
        setHistory([]);
      }},
    ]);
  };

  const DOSHA_COLORS: any = { vata: '#FF6B6B', pitta: '#4ECDC4', kapha: '#45B7D1' };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={52} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>Your Profile</Text>
        <Text style={styles.headerSub}>AyurAI Health Tracker</Text>
      </View>

      {/* Prakriti */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Constitutional Type</Text>
        {prakriti ? (
          <View style={styles.card}>
            <View style={styles.prakritiRow}>
              <Ionicons name="body" size={22} color="#2d5016" />
              <Text style={styles.prakritiDominant}>
                Dominant: {prakriti.dominant?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.doshaScoresRow}>
              {['vata', 'pitta', 'kapha'].map((d) => (
                <View key={d} style={styles.doshaBox}>
                  <Text style={[styles.doshaScore, { color: DOSHA_COLORS[d] }]}>
                    {(parseFloat(prakriti[d] || '0') * 100).toFixed(0)}%
                  </Text>
                  <Text style={styles.doshaLabel}>{d.charAt(0).toUpperCase() + d.slice(1)}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={async () => { await storage.clearPrakriti(); setPrakriti(null); router.push('/prakriti' as any); }}
            >
              <Ionicons name="refresh" size={16} color="#2d5016" />
              <Text style={styles.retakeBtnText}>Retake Assessment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.emptyCard}
            onPress={() => router.push('/prakriti' as any)}
          >
            <Ionicons name="body-outline" size={44} color="#ccc" />
            <Text style={styles.emptyText}>No assessment yet</Text>
            <Text style={styles.emptyAction}>Tap to start</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* History */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Prediction History</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearHistory}>
              <Text style={styles.clearBtn}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        {history.length > 0 ? history.slice(0, 5).map((item, i) => (
          <View key={i} style={styles.historyItem}>
            <View style={styles.historyIcon}>
              <Ionicons name="medical" size={20} color="#2d5016" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyDisease}>{item.predicted_disease || item.disease}</Text>
              <Text style={styles.historyDetails}>
                {item.symptom} • {new Date(item.timestamp).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.historyConf}>
              {((item.confidence || 0.85) * 100).toFixed(0)}%
            </Text>
          </View>
        )) : (
          <View style={styles.emptyCard}>
            <Ionicons name="time-outline" size={44} color="#ccc" />
            <Text style={styles.emptyText}>No predictions yet</Text>
          </View>
        )}
      </View>

      {/* Team */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Development Team</Text>
        <View style={styles.card}>
          {TEAM_MEMBERS.map((m, i) => (
            <View key={i} style={[styles.teamRow, i < TEAM_MEMBERS.length - 1 && styles.teamDivider]}>
              <View style={styles.teamAvatar}>
                <Text style={styles.teamAvatarText}>{m.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.teamName}>{m.name}</Text>
                <Text style={styles.teamId}>{m.id}</Text>
                <Text style={styles.teamComponent}>{m.component}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Academic */}
      <View style={styles.section}>
        <View style={styles.academicCard}>
          <Text style={styles.academicInst}>🎓 SLIIT - Sri Lanka Institute of Information Technology</Text>
          <Text style={styles.academicDetail}>Research Group: Centre of Excellence for AI (CoEAI)</Text>
          <Text style={styles.academicDetail}>Course: IT4010 Research Project - 2025 July</Text>
          <Text style={styles.academicDetail}>Project ID: 25-26J-305</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <View style={styles.card}>
          <Text style={styles.appName}>🌿 AyurAI</Text>
          <Text style={styles.appSub}>Constitutional-Aware Ayurvedic Disease Prediction</Text>
          <View style={styles.statsRow}>
            {[['84.2%', 'Accuracy'], ['10%', 'Improvement'], ['1000+', 'Patients'], ['5', 'Diseases']].map(([v, l], i) => (
              <View key={i} style={styles.statBox}>
                <Text style={styles.statValue}>{v}</Text>
                <Text style={styles.statLabel}>{l}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  header: { backgroundColor: '#2d5016', padding: 30, alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: '#c8e6c9' },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1b5e20', marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  clearBtn: { fontSize: 13, color: '#d32f2f', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  prakritiRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  prakritiDominant: { fontSize: 17, fontWeight: 'bold', color: '#1b5e20' },
  doshaScoresRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#f1f8e9', borderRadius: 8, paddingVertical: 12, marginBottom: 12 },
  doshaBox: { alignItems: 'center' },
  doshaScore: { fontSize: 20, fontWeight: 'bold' },
  doshaLabel: { fontSize: 12, color: '#757575', marginTop: 2 },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 10 },
  retakeBtnText: { fontSize: 14, color: '#2d5016', fontWeight: '600' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 32, alignItems: 'center', elevation: 1 },
  emptyText: { fontSize: 14, color: '#aaa', marginTop: 10 },
  emptyAction: { fontSize: 13, color: '#2d5016', marginTop: 4 },
  historyItem: { backgroundColor: '#fff', borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8, elevation: 1 },
  historyIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#f1f8e9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  historyDisease: { fontSize: 14, fontWeight: '600', color: '#1b5e20', marginBottom: 2 },
  historyDetails: { fontSize: 12, color: '#aaa' },
  historyConf: { fontSize: 14, fontWeight: 'bold', color: '#2d5016' },
  teamRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  teamDivider: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  teamAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2d5016', alignItems: 'center', justifyContent: 'center' },
  teamAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  teamName: { fontSize: 14, fontWeight: '600', color: '#1b5e20' },
  teamId: { fontSize: 12, color: '#aaa' },
  teamComponent: { fontSize: 12, color: '#2d5016', fontWeight: '500', marginTop: 2 },
  academicCard: { backgroundColor: '#e8f5e9', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#2d5016' },
  academicInst: { fontSize: 14, fontWeight: '600', color: '#1b5e20', marginBottom: 8 },
  academicDetail: { fontSize: 13, color: '#444', marginBottom: 4 },
  appName: { fontSize: 22, fontWeight: 'bold', color: '#1b5e20', textAlign: 'center', marginBottom: 4 },
  appSub: { fontSize: 12, color: '#777', textAlign: 'center', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 14 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#2d5016' },
  statLabel: { fontSize: 11, color: '#aaa', marginTop: 2 },
});