// app/(tabs)/medicine.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MedicineScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.iconCircle}>
        <Ionicons name="medical" size={64} color="#2d5016" />
      </View>
      <Text style={styles.title}>Medicine Recommendation</Text>
      <Text style={styles.subtitle}>Personalized Ayurvedic Herbal Remedies</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coming Features</Text>
        {[
          'Disease-specific medicine recommendations',
          'Dosha-based herbal formulations',
          'Dosage and preparation instructions',
          'Classical reference citations',
          'Personalized treatment plans',
        ].map((item, i) => (
          <View key={i} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
            <Text style={styles.featureText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.devCard}>
        <Text style={styles.devName}>Roche J P</Text>
        <Text style={styles.devId}>IT22344274</Text>
        <Text style={styles.devModule}>Medicine Recommendation Module</Text>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>🚧 Integration in Progress</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  content: { flexGrow: 1, alignItems: 'center', padding: 24, paddingTop: 60 },
  iconCircle: { 
    width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1b5e20', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#777', marginBottom: 32, textAlign: 'center' },
  
  card: { 
    backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%',
    marginBottom: 20, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1b5e20', marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  featureText: { flex: 1, fontSize: 14, color: '#444', lineHeight: 20 },
  
  devCard: {
    backgroundColor: '#2d5016', borderRadius: 16, padding: 20, width: '100%',
    alignItems: 'center', marginBottom: 20,
  },
  devName: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  devId: { fontSize: 14, color: '#b8d4a8', marginBottom: 8 },
  devModule: { fontSize: 13, color: '#e8f5e9', textAlign: 'center' },
  
  badge: { 
    backgroundColor: '#fff3cd', borderRadius: 20, paddingHorizontal: 20,
    paddingVertical: 10, borderWidth: 1, borderColor: '#ff9800',
  },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#856404' },
});