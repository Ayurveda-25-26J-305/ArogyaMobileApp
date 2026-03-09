import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DoshaChartProps {
  prakriti: {
    vata: string;
    pitta: string;
    kapha: string;
    dominant?: string;
  };
}

const DOSHA_COLORS = {
  vata: '#FF6B6B',
  pitta: '#4ECDC4',
  kapha: '#45B7D1',
};

export default function DoshaChart({ prakriti }: DoshaChartProps) {
  const vataPercent = parseFloat(prakriti.vata) * 100;
  const pittaPercent = parseFloat(prakriti.pitta) * 100;
  const kaphaPercent = parseFloat(prakriti.kapha) * 100;

  return (
    <View style={styles.container}>
      {/* Vata */}
      <View style={styles.row}>
        <Text style={styles.label}>Vata</Text>
        <View style={styles.barContainer}>
          <View
            style={[
              styles.bar,
              { width: `${vataPercent}%`, backgroundColor: DOSHA_COLORS.vata },
            ]}
          />
        </View>
        <Text style={styles.percentage}>{vataPercent.toFixed(0)}%</Text>
      </View>

      {/* Pitta */}
      <View style={styles.row}>
        <Text style={styles.label}>Pitta</Text>
        <View style={styles.barContainer}>
          <View
            style={[
              styles.bar,
              { width: `${pittaPercent}%`, backgroundColor: DOSHA_COLORS.pitta },
            ]}
          />
        </View>
        <Text style={styles.percentage}>{pittaPercent.toFixed(0)}%</Text>
      </View>

      {/* Kapha */}
      <View style={styles.row}>
        <Text style={styles.label}>Kapha</Text>
        <View style={styles.barContainer}>
          <View
            style={[
              styles.bar,
              { width: `${kaphaPercent}%`, backgroundColor: DOSHA_COLORS.kapha },
            ]}
          />
        </View>
        <Text style={styles.percentage}>{kaphaPercent.toFixed(0)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1b5e20',
    width: 50,
    textTransform: 'capitalize',
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 12,
    minWidth: 2,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b5e20',
    width: 45,
    textAlign: 'right',
  },
});