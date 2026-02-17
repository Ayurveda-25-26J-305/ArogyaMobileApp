import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { storage } from "../../services/api";
import { TEAM_MEMBERS } from "../../utils/constants";

export default function ProfileScreen() {
  const router = useRouter();
  const [prakriti, setPrakriti] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const p = await storage.getPrakriti();
    const h = await storage.getHistory();
    setPrakriti(p);
    setHistory(h);
  };

  const handleClearHistory = () => {
    Alert.alert("Clear History", "Delete all prediction history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await storage.clearHistory();
          setHistory([]);
        },
      },
    ]);
  };

  const DOSHA_COLORS: any = {
    vata: "#FF6B6B",
    pitta: "#4ECDC4",
    kapha: "#45B7D1",
  };

  return (
    <ScrollView
      className="flex-1 bg-[#f1f8e9]"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="bg-ayurveda-primary p-8 items-center rounded-b-3xl">
        <View className="w-[90px] h-[90px] rounded-full bg-white/20 items-center justify-center mb-3">
          <Ionicons name="person" size={52} color="#fff" />
        </View>
        <Text className="text-[22px] font-bold text-white mb-1">
          Your Profile
        </Text>
        <Text className="text-[13px] text-[#c8e6c9]">
          AyurAI Health Tracker
        </Text>
      </View>

      {/* Prakriti */}
      <View className="px-4 pt-5">
        <Text className="text-[17px] font-bold text-[#1b5e20] mb-2.5">
          Constitutional Type
        </Text>
        {prakriti ? (
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="flex-row items-center gap-2.5 mb-3.5">
              <Ionicons name="body" size={22} color="#2d5016" />
              <Text className="text-[17px] font-bold text-[#1b5e20]">
                Dominant: {prakriti.dominant?.toUpperCase()}
              </Text>
            </View>
            <View className="flex-row justify-around bg-[#f1f8e9] rounded-lg py-3 mb-3">
              {["vata", "pitta", "kapha"].map((d) => (
                <View key={d} className="items-center">
                  <Text
                    className="text-xl font-bold"
                    style={{ color: DOSHA_COLORS[d] }}
                  >
                    {(parseFloat(prakriti[d] || "0") * 100).toFixed(0)}%
                  </Text>
                  <Text className="text-xs text-gray-600 mt-0.5">
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              className="flex-row items-center justify-center gap-1.5 pt-2.5"
              onPress={async () => {
                await storage.clearPrakriti();
                setPrakriti(null);
                router.push("/prakriti" as any);
              }}
            >
              <Ionicons name="refresh" size={16} color="#2d5016" />
              <Text className="text-sm text-ayurveda-primary font-semibold">
                Retake Assessment
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className="bg-white rounded-xl p-8 items-center shadow-sm"
            onPress={() => router.push("/prakriti" as any)}
          >
            <Ionicons name="body-outline" size={44} color="#ccc" />
            <Text className="text-sm text-gray-400 mt-2.5">
              No assessment yet
            </Text>
            <Text className="text-[13px] text-ayurveda-primary mt-1">
              Tap to start
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* History */}
      <View className="px-4 pt-5">
        <View className="flex-row justify-between items-center mb-2.5">
          <Text className="text-[17px] font-bold text-[#1b5e20]">
            Prediction History
          </Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearHistory}>
              <Text className="text-[13px] text-red-700 font-semibold">
                Clear All
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {history.length > 0 ? (
          history.slice(0, 5).map((item, i) => (
            <View
              key={i}
              className="bg-white rounded-xl p-3.5 flex-row items-center mb-2 shadow-sm"
            >
              <View className="w-[38px] h-[38px] rounded-full bg-[#f1f8e9] items-center justify-center mr-3">
                <Ionicons name="medical" size={20} color="#2d5016" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#1b5e20] mb-0.5">
                  {item.predicted_disease || item.disease}
                </Text>
                <Text className="text-xs text-gray-400">
                  {item.symptom} •{" "}
                  {new Date(item.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <Text className="text-sm font-bold text-ayurveda-primary">
                {((item.confidence || 0.85) * 100).toFixed(0)}%
              </Text>
            </View>
          ))
        ) : (
          <View className="bg-white rounded-xl p-8 items-center shadow-sm">
            <Ionicons name="time-outline" size={44} color="#ccc" />
            <Text className="text-sm text-gray-400 mt-2.5">
              No predictions yet
            </Text>
          </View>
        )}
      </View>

      {/* Team */}
      <View className="px-4 pt-5">
        <Text className="text-[17px] font-bold text-[#1b5e20] mb-2.5">
          Development Team
        </Text>
        <View className="bg-white rounded-xl p-4 shadow-sm">
          {TEAM_MEMBERS.map((m, i) => (
            <View
              key={i}
              className={`flex-row items-center py-3 gap-3 ${
                i < TEAM_MEMBERS.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <View className="w-10 h-10 rounded-full bg-ayurveda-primary items-center justify-center">
                <Text className="text-white font-bold text-base">
                  {m.name.charAt(0)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#1b5e20]">
                  {m.name}
                </Text>
                <Text className="text-xs text-gray-400">{m.id}</Text>
                <Text className="text-xs text-ayurveda-primary font-medium mt-0.5">
                  {m.component}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Academic */}
      <View className="px-4 pt-5">
        <View className="bg-[#e8f5e9] rounded-xl p-4 border-l-4 border-ayurveda-primary">
          <Text className="text-sm font-semibold text-[#1b5e20] mb-2">
            🎓 SLIIT - Sri Lanka Institute of Information Technology
          </Text>
          <Text className="text-[13px] text-gray-700 mb-1">
            Research Group: Centre of Excellence for AI (CoEAI)
          </Text>
          <Text className="text-[13px] text-gray-700 mb-1">
            Course: IT4010 Research Project - 2025 July
          </Text>
          <Text className="text-[13px] text-gray-700">
            Project ID: 25-26J-305
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View className="px-4 pt-5">
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-[22px] font-bold text-[#1b5e20] text-center mb-1">
            🌿 AyurAI
          </Text>
          <Text className="text-xs text-gray-600 text-center mb-4">
            Constitutional-Aware Ayurvedic Disease Prediction
          </Text>
          <View className="flex-row justify-around border-t border-gray-100 pt-3.5">
            {[
              ["84.2%", "Accuracy"],
              ["10%", "Improvement"],
              ["1000+", "Patients"],
              ["5", "Diseases"],
            ].map(([v, l], i) => (
              <View key={i} className="items-center">
                <Text className="text-lg font-bold text-ayurveda-primary">
                  {v}
                </Text>
                <Text className="text-[11px] text-gray-400 mt-0.5">{l}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className="h-8" />
    </ScrollView>
  );
}
