import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DiseaseCardProps {
  disease: string;
  confidence: number;
  top3: Array<{ disease: string; probability: number }>;
}

export default function DiseaseCard({ disease, confidence, top3 }: DiseaseCardProps) {
  return (
    <View style={styles.container}>
      {/* Primary Prediction */}
      <View style={styles.primaryCard}>
        <Text style={styles.primaryLabel}>Primary Prediction</Text>
        <Text style={styles.primaryDisease}>{disease}</Text>
        <View style={styles.confidenceRow}>
          <Text style={styles.confidenceLabel}>Confidence</Text>
          <Text style={styles.confidenceValue}>
            {(confidence * 100).toFixed(1)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${confidence * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Top 3 List */}
      <View style={styles.listCard}>
        <Text style={styles.listTitle}>Top 3 Predictions</Text>
        {top3.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <Text style={styles.listDisease}>{item.disease}</Text>
            <Text style={styles.listProbability}>
              {(item.probability * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>

      {/* Warning */}
      <View style={styles.warning}>
        <Text style={styles.warningText}>
          ⚕️ This is an AI prediction. Consult a qualified practitioner for confirmation.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  
  primaryCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4caf50',
    elevation: 3,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2e7d32',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  primaryDisease: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1b5e20',
    marginBottom: 12,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLabel: { fontSize: 14, color: '#666' },
  confidenceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#c8e6c9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 4,
  },
  
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b5e20',
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2d5016',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  listDisease: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  listProbability: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4caf50',
  },
  
  warning: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  warningText: {
    fontSize: 13,
    color: '#e65100',
    lineHeight: 18,
  },
});