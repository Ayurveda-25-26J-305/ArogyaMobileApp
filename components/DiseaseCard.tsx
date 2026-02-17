import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';

interface DiseaseCardProps {
  disease: string;
  confidence: number;
  top3?: Array<{ disease: string; probability: number }>;
}

export default function DiseaseCard({ disease, confidence, top3 }: DiseaseCardProps) {
  return (
    <View style={styles.container}>
      {/* Primary Prediction */}
      <View style={styles.primaryCard}>
        <View style={styles.iconContainer}>
          <Ionicons name="fitness" size={40} color="#fff" />
        </View>
        <View style={styles.primaryContent}>
          <Text style={styles.primaryLabel}>Predicted Disease</Text>
          <Text style={styles.primaryDisease}>{disease}</Text>
          <Text style={styles.primaryConfidence}>
            {(confidence * 100).toFixed(1)}% Confidence
          </Text>
        </View>
      </View>

      {/* Top 3 Predictions */}
      {top3 && top3.length > 0 && (
        <View style={styles.top3Container}>
          <Text style={styles.top3Title}>Top 3 Predictions</Text>
          {top3.map((item, index) => (
            <View key={index} style={styles.top3Item}>
              <View style={styles.top3Rank}>
                <Text style={styles.top3RankText}>{index + 1}</Text>
              </View>
              <Text style={styles.top3Disease}>{item.disease}</Text>
              <Text style={styles.top3Confidence}>
                {(item.probability * 100).toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Disclaimer */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color={theme.colors.primary.main} />
        <Text style={styles.infoText}>
          This is a preliminary prediction. Please consult qualified Ayurvedic practitioners.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  primaryCard: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  primaryContent: {
    flex: 1,
  },
  primaryLabel: {
    fontSize: 12,
    color: '#c8e6c9',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  primaryDisease: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  primaryConfidence: {
    fontSize: 14,
    color: '#e8f5e9',
  },
  top3Container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  top3Title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  top3Item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  top3Rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  top3RankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary.main,
  },
  top3Disease: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  top3Confidence: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
});