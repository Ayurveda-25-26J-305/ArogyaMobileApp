import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

interface DoshaChartProps {
  prakriti: {
    vata: string | number;
    pitta: string | number;
    kapha: string | number;
  };
}

export default function DoshaChart({ prakriti }: DoshaChartProps) {
  if (!prakriti) return null;

  const doshas = [
    { 
      name: 'Vata', 
      value: parseFloat(prakriti.vata as string) || 0, 
      color: theme.colors.dosha.vata 
    },
    { 
      name: 'Pitta', 
      value: parseFloat(prakriti.pitta as string) || 0, 
      color: theme.colors.dosha.pitta 
    },
    { 
      name: 'Kapha', 
      value: parseFloat(prakriti.kapha as string) || 0, 
      color: theme.colors.dosha.kapha 
    },
  ];

  return (
    <View style={styles.container}>
      {doshas.map((dosha, index) => (
        <View key={index} style={styles.doshaRow}>
          <Text style={styles.doshaName}>{dosha.name}</Text>
          <View style={styles.barContainer}>
            <View
              style={[
                styles.bar,
                {
                  width: `${dosha.value * 100}%`,
                  backgroundColor: dosha.color,
                },
              ]}
            />
          </View>
          <Text style={styles.doshaValue}>{(dosha.value * 100).toFixed(0)}%</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  doshaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doshaName: {
    width: 60,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
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
  },
  doshaValue: {
    width: 45,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    color: theme.colors.text.secondary,
  },
});