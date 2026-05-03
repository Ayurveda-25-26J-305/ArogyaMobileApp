import React from "react";
import { Text, View } from "react-native";

interface MedicineResultsProps {
  predictedHerbs: any;
}

export default function MedicineResults({ predictedHerbs }: MedicineResultsProps) {
  if (!predictedHerbs) return null;

  return (
    <View className="bg-white rounded-2xl p-4 mt-5 shadow-md border border-green-100">
      <Text className="text-lg font-semibold text-[#1b5e20] mb-2">
        🌿 Recommended Herbs
      </Text>
      <View className="bg-green-50 p-3 rounded-lg mb-2">
        <Text className="font-semibold">
          Primary Herb: {predictedHerbs.primary}
        </Text>
      </View>
      <View className="bg-green-50 p-3 rounded-lg">
        <Text className="font-semibold">
          Secondary Herb: {predictedHerbs.secondary}
        </Text>
      </View>
      <View className="bg-green-50 p-3 rounded-lg">
        <Text className="font-semibold">
          Tertiary Herb: {predictedHerbs.tertiary}
        </Text>
      </View>
    </View>
  );
}