import React from "react";
import { View, Text } from "react-native";
import { theme } from "../utils/theme";

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
      name: "Vata",
      value: parseFloat(prakriti.vata as string) || 0,
      color: theme.colors.dosha.vata,
    },
    {
      name: "Pitta",
      value: parseFloat(prakriti.pitta as string) || 0,
      color: theme.colors.dosha.pitta,
    },
    {
      name: "Kapha",
      value: parseFloat(prakriti.kapha as string) || 0,
      color: theme.colors.dosha.kapha,
    },
  ];

  return (
    <View className="gap-3">
      {doshas.map((dosha, index) => (
        <View key={index} className="flex-row items-center gap-3">
          <Text className="w-[60px] text-sm font-semibold text-[#1b5e20]">
            {dosha.name}
          </Text>
          <View className="flex-1 h-6 bg-gray-200 rounded-xl overflow-hidden">
            <View
              className="h-full rounded-xl"
              style={{
                width: `${dosha.value * 100}%`,
                backgroundColor: dosha.color,
              }}
            />
          </View>
          <Text className="w-[45px] text-sm font-semibold text-right text-[#33691e]">
            {(dosha.value * 100).toFixed(0)}%
          </Text>
        </View>
      ))}
    </View>
  );
}
