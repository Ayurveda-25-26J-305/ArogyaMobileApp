import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MedicineScreen() {
  const features = [
    'Personalized herb recommendations',
    'Dosage guidelines',
    'Preparation methods',
    'Dosha-specific medicines',
    'Safety information',
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.iconWrap}>
        <Ionicons name="medical" size={80} color="#4a7c2c" />
      </View>
      <Text style={styles.title}>Medicine Recommendation</Text>
      <Text style={styles.subtitle}>
        Context-aware Ayurvedic medicine suggestions based on predicted disease,
        dosha type, and individual constitution.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coming Features:</Text>
        {features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#4a7c2c" />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <View style={styles.devCard}>
        <Ionicons name="person-circle" size={36} color="#2d5016" />
        <View style={{ flex: 1 }}>
          <Text style={styles.devName}>Roche J P</Text>
          <Text style={styles.devId}>IT22344274</Text>
          <Text style={styles.devModule}>Medicine Recommendation Module</Text>
        </View>
      </View>

      <View style={styles.badge}>
        <Ionicons name="construct" size={16} color="#856404" />
        <Text style={styles.badgeText}>Integration in Progress</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  content: { alignItems: 'center', padding: 24, paddingBottom: 40 },
  iconWrap: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1b5e20', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 18, marginBottom: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1b5e20', marginBottom: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  featureText: { fontSize: 14, color: '#444' },
  devCard: { width: '100%', backgroundColor: '#e8f5e9', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#2d5016' },
  devName: { fontSize: 15, fontWeight: '700', color: '#1b5e20' },
  devId: { fontSize: 12, color: '#777' },
  devModule: { fontSize: 13, color: '#2d5016', marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff3cd', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8 },
  badgeText: { fontSize: 13, color: '#856404', fontWeight: '600' },
});