import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { storage } from "../../services/api";

export default function HomeScreen() {
  const router = useRouter();
  const [prakriti, setPrakriti] = useState<any>(null);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const saved = await storage.getPrakriti();
    const history = await storage.getHistory();
    setPrakriti(saved);
    setHistoryCount(history.length);
  };

  const features = [
    {
      title: "Disease Prediction",
      desc: "Constitutional-aware AI diagnosis",
      icon: "fitness",
      color: "#2d5016",
      route: "/prakriti",
    },
    {
      title: "Medicine Guide",
      desc: "Personalized Ayurvedic remedies",
      icon: "medical",
      color: "#4a7c2c",
      route: "/(tabs)/medicine",
    },
    {
      title: "Diet Planning",
      desc: "Dosha-balanced meal plans",
      icon: "restaurant",
      color: "#6a8759",
      route: "/(tabs)/diet",
    },
    {
      title: "Ask Questions",
      desc: "Intelligent Ayurvedic guidance",
      icon: "help-circle",
      color: "#558b2f",
      route: "/(tabs)/qa",
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-[#f1f8e9]"
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View className="bg-ayurveda-primary py-10 px-5 rounded-b-[28px] items-center">
        <Text className="text-[26px] font-bold text-white text-center mb-2">
          🌿 Welcome to Arogya
        </Text>
        <Text className="text-sm text-[#c8e6c9] text-center leading-5">
          Ancient Ayurvedic Wisdom Powered by Modern AI
        </Text>
      </View>

      {/* Stats */}
      <View className="flex-row -mt-6 mx-4 gap-2 mb-2">
        {[
          { value: "84.2%", label: "Accuracy" },
          { value: "5", label: "Diseases" },
          { value: String(historyCount), label: "My Tests" },
        ].map((stat, i) => (
          <View
            key={i}
            className="flex-1 bg-white rounded-xl p-3.5 items-center shadow-md"
          >
            <Text className="text-lg font-bold text-ayurveda-primary">
              {stat.value}
            </Text>
            <Text className="text-[11px] text-gray-600 mt-0.5">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Get Started */}
      <View className="px-4 pt-5">
        <Text className="text-lg font-bold text-[#1b5e20] mb-3">
          Get Started
        </Text>
        {prakriti ? (
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="flex-row items-center gap-2 mb-3.5">
              <Ionicons name="checkmark-circle" size={22} color="#4caf50" />
              <Text className="text-[15px] text-gray-800">
                Prakriti:{" "}
                <Text className="font-bold text-ayurveda-primary">
                  {prakriti.dominant?.toUpperCase()}
                </Text>
              </Text>
            </View>
            <TouchableOpacity
              className="bg-ayurveda-primary rounded-xl p-4 flex-row items-center gap-3 shadow-md"
              onPress={() => router.push("/prediction" as any)}
            >
              <Ionicons name="analytics" size={22} color="#fff" />
              <Text className="text-white text-base font-semibold">
                Start Disease Prediction
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="mt-2.5 p-2.5 items-center"
              onPress={async () => {
                await storage.clearPrakriti();
                setPrakriti(null);
              }}
            >
              <Text className="text-ayurveda-primary text-sm font-semibold">
                Retake Prakriti Assessment
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className="bg-ayurveda-primary rounded-xl p-4 flex-row items-center gap-3 shadow-md"
            onPress={() => router.push("/prakriti" as any)}
          >
            <Ionicons name="body" size={22} color="#fff" />
            <View className="flex-1 ml-3">
              <Text className="text-white text-base font-semibold">
                Start Prakriti Assessment
              </Text>
              <Text className="text-[#c8e6c9] text-xs mt-0.5">
                Discover your constitutional type
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Features */}
      <View className="px-4 pt-5">
        <Text className="text-lg font-bold text-[#1b5e20] mb-3">Features</Text>
        {features.map((f, i) => (
          <TouchableOpacity
            key={i}
            className="bg-white rounded-xl p-3.5 flex-row items-center border-l-4 mb-2.5 shadow-sm"
            style={{ borderLeftColor: f.color }}
            onPress={() => router.push(f.route as any)}
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: f.color }}
            >
              <Ionicons name={f.icon as any} size={26} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-[#1b5e20]">
                {f.title}
              </Text>
              <Text className="text-xs text-gray-600 mt-0.5">{f.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
        ))}
      </View>

      {/* How It Works */}
      <View className="px-4 pt-5">
        <Text className="text-lg font-bold text-[#1b5e20] mb-3">
          How It Works
        </Text>
        <View className="bg-white rounded-xl p-4 shadow-sm">
          {[
            {
              step: "1",
              title: "Prakriti Assessment",
              desc: "Answer 6 quick questions",
            },
            {
              step: "2",
              title: "Select Symptom",
              desc: "Choose from 60+ symptoms",
            },
            {
              step: "3",
              title: "AI Prediction",
              desc: "84.2% accurate results",
            },
            {
              step: "4",
              title: "Get Guidance",
              desc: "Personalized recommendations",
            },
          ].map((item, i) => (
            <View key={i} className="flex-row items-start mb-3.5 gap-3">
              <View className="w-8 h-8 rounded-full bg-ayurveda-primary items-center justify-center">
                <Text className="text-white font-bold text-sm">
                  {item.step}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#1b5e20]">
                  {item.title}
                </Text>
                <Text className="text-xs text-gray-600 mt-0.5">
                  {item.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Disclaimer */}
      <View className="flex-row items-start bg-[#fff3cd] m-4 p-3 rounded-lg gap-2">
        <Ionicons name="warning" size={18} color="#ff9800" />
        <Text className="flex-1 text-xs text-[#856404] leading-[18px]">
          For educational purposes only. Always consult qualified Ayurvedic
          practitioners.
        </Text>
      </View>

      <View className="h-8" />
    </ScrollView>
  );
}
