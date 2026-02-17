import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MedicineScreen() {
  const features = [
    "Personalized herb recommendations",
    "Dosage guidelines",
    "Preparation methods",
    "Dosha-specific medicines",
    "Safety information",
  ];

  return (
    <ScrollView
      className="flex-1 bg-[#f1f8e9]"
      contentContainerStyle={{
        alignItems: "center",
        padding: 24,
        paddingBottom: 40,
      }}
    >
      <View className="w-[120px] h-[120px] rounded-full bg-[#e8f5e9] items-center justify-center mb-5">
        <Ionicons name="medical" size={80} color="#4a7c2c" />
      </View>
      <Text className="text-2xl font-bold text-[#1b5e20] text-center mb-3">
        Medicine Recommendation
      </Text>
      <Text className="text-sm text-gray-600 text-center leading-6 mb-6">
        Context-aware Ayurvedic medicine suggestions based on predicted disease,
        dosha type, and individual constitution.
      </Text>

      <View className="w-full bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="text-base font-semibold text-[#1b5e20] mb-3">
          Coming Features:
        </Text>
        {features.map((f, i) => (
          <View key={i} className="flex-row items-center gap-2.5 mb-2.5">
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color="#4a7c2c"
            />
            <Text className="text-sm text-gray-700">{f}</Text>
          </View>
        ))}
      </View>

      <View className="w-full bg-[#e8f5e9] rounded-xl p-4 flex-row items-center gap-3 mb-4 border-l-4 border-ayurveda-primary">
        <Ionicons name="person-circle" size={36} color="#2d5016" />
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-[#1b5e20]">
            Roche J P
          </Text>
          <Text className="text-xs text-gray-500">IT22344274</Text>
          <Text className="text-[13px] text-ayurveda-primary mt-0.5">
            Medicine Recommendation Module
          </Text>
        </View>
      </View>

      <View className="flex-row items-center bg-[#fff3cd] px-4 py-2.5 rounded-full gap-2">
        <Ionicons name="construct" size={16} color="#856404" />
        <Text className="text-[13px] text-[#856404] font-semibold">
          Integration in Progress
        </Text>
      </View>
    </ScrollView>
  );
}
