import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../utils/theme";

interface DiseaseCardProps {
  disease: string;
  confidence: number;
  top3?: Array<{ disease: string; probability: number }>;
}

export default function DiseaseCard({
  disease,
  confidence,
  top3,
}: DiseaseCardProps) {
  return (
    <View className="gap-4">
      {/* Primary Prediction */}
      <View className="bg-ayurveda-primary rounded-2xl p-5 flex-row items-center shadow-md">
        <View className="w-[60px] h-[60px] rounded-full bg-white/20 items-center justify-center mr-4">
          <Ionicons name="fitness" size={40} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-[#c8e6c9] uppercase mb-1">
            Predicted Disease
          </Text>
          <Text className="text-[22px] font-bold text-white mb-1">
            {disease}
          </Text>
          <Text className="text-sm text-[#e8f5e9]">
            {(confidence * 100).toFixed(1)}% Confidence
          </Text>
        </View>
      </View>

      {/* Top 3 Predictions */}
      {top3 && top3.length > 0 && (
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-base font-semibold text-[#1b5e20] mb-3">
            Top 3 Predictions
          </Text>
          {top3.map((item, index) => (
            <View
              key={index}
              className="flex-row items-center py-2 border-b border-gray-100"
            >
              <View className="w-7 h-7 rounded-full bg-[#f1f8e9] items-center justify-center mr-3">
                <Text className="text-sm font-bold text-ayurveda-primary">
                  {index + 1}
                </Text>
              </View>
              <Text className="flex-1 text-[15px] text-[#1b5e20]">
                {item.disease}
              </Text>
              <Text className="text-sm font-semibold text-[#33691e]">
                {(item.probability * 100).toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Disclaimer */}
      <View className="flex-row items-start bg-[#fff3cd] p-3 rounded-lg gap-2">
        <Ionicons
          name="information-circle"
          size={20}
          color={theme.colors.primary.main}
        />
        <Text className="flex-1 text-[13px] text-[#856404] leading-[18px]">
          This is a preliminary prediction. Please consult qualified Ayurvedic
          practitioners.
        </Text>
      </View>
    </View>
  );
}
