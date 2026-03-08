import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { submitPrakriti, storage } from "../services/api";
import { QA_PRAKRITI_QUESTIONS, STORAGE_KEYS } from "../utils/constants";

const OPTION_META = {
  A: { color: "#7986cb", dosha: "Vata" },
  B: { color: "#ef5350", dosha: "Pitta" },
  C: { color: "#26a69a", dosha: "Kapha" },
} as const;

type OptionKey = keyof typeof OPTION_META;

export default function PrakritiScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleAnswer = async (questionId: string, option: OptionKey) => {
    const newAnswers = { ...answers, [questionId]: option };
    setAnswers(newAnswers);

    if (current < QA_PRAKRITI_QUESTIONS.length - 1) {
      setCurrent(current + 1);
      return;
    }

    // ── All questions answered ─────────────────────────────────────────────
    setSubmitting(true);
    try {
      // Ensure user ID exists
      let uid = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
      if (!uid) {
        uid = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, uid);
      }

      // Submit to API
      const result = await submitPrakriti(uid, newAnswers);

      let dominantDosha: string;
      let currentSeason: string;

      if (result.success && result.profile) {
        dominantDosha = result.profile.dominant_dosha;
        currentSeason = result.profile.current_season;
      } else {
        // Offline fallback: local count
        const counts: Record<string, number> = { vata: 0, pitta: 0, kapha: 0 };
        Object.values(newAnswers).forEach((v) => {
          if (v === "A") counts.vata++;
          else if (v === "B") counts.pitta++;
          else counts.kapha++;
        });
        dominantDosha = Object.keys(counts).reduce((a, b) =>
          counts[a] >= counts[b] ? a : b,
        );
        const m = new Date().getMonth();
        currentSeason =
          m >= 2 && m <= 4
            ? "spring"
            : m >= 5 && m <= 7
              ? "summer"
              : m >= 8 && m <= 10
                ? "autumn"
                : "winter";
        Alert.alert(
          "Offline Mode",
          "Could not reach the server — profile calculated locally.",
        );
      }

      // Save QA profile
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify({
          dominant_dosha: dominantDosha,
          current_season: currentSeason,
        }),
      );

      // Save local prakriti for disease-prediction compatibility
      const total = QA_PRAKRITI_QUESTIONS.length;
      const counts: Record<string, number> = { vata: 0, pitta: 0, kapha: 0 };
      Object.values(newAnswers).forEach((v) => {
        if (v === "A") counts.vata++;
        else if (v === "B") counts.pitta++;
        else counts.kapha++;
      });
      await storage.savePrakriti({
        vata: (counts.vata / total).toFixed(2),
        pitta: (counts.pitta / total).toFixed(2),
        kapha: (counts.kapha / total).toFixed(2),
        dominant: dominantDosha,
      });

      router.replace({
        pathname: "/prediction",
        params: {
          prakriti: JSON.stringify({
            vata: (counts.vata / total).toFixed(2),
            pitta: (counts.pitta / total).toFixed(2),
            kapha: (counts.kapha / total).toFixed(2),
            dominant: dominantDosha,
          }),
        },
      } as any);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const question = QA_PRAKRITI_QUESTIONS[current];
  const progress = ((current + 1) / QA_PRAKRITI_QUESTIONS.length) * 100;

  if (submitting) {
    return (
      <View className="flex-1 bg-[#f1f8e9] items-center justify-center gap-4">
        <ActivityIndicator size="large" color="#2d5016" />
        <Text className="text-[15px] text-[#2d5016] font-semibold">
          Analysing your profile…
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f1f8e9]">
      {/* Progress bar */}
      <View className="bg-white px-5 py-3.5 border-b border-gray-300">
        <View className="h-2 bg-gray-300 rounded overflow-hidden mb-2">
          <View
            className="h-full bg-ayurveda-primary rounded"
            style={{ width: `${progress}%` }}
          />
        </View>
        <Text className="text-[13px] text-gray-600 text-center">
          Question {current + 1} of {QA_PRAKRITI_QUESTIONS.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        {/* Question card */}
        <View className="bg-white rounded-[14px] p-5 mb-5 shadow-md">
          <Text className="text-lg font-semibold text-[#1b5e20] leading-7">
            {question.question}
          </Text>
        </View>

        {/* A / B / C options */}
        {(["A", "B", "C"] as OptionKey[]).map((opt) => {
          const { color, dosha } = OPTION_META[opt];
          const selected = answers[question.id] === opt;
          return (
            <TouchableOpacity
              key={opt}
              className={`bg-white rounded-xl p-4 flex-row items-center mb-3 border-2 shadow-sm ${
                selected
                  ? "border-ayurveda-primary bg-[#f1f8e9]"
                  : "border-gray-300"
              }`}
              onPress={() => handleAnswer(question.id, opt)}
              activeOpacity={0.7}
            >
              {/* Option letter badge */}
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3 shrink-0"
                style={{ backgroundColor: color }}
              >
                <Text className="text-white font-bold text-sm">{opt}</Text>
              </View>

              {/* Label */}
              <View className="flex-1">
                <Text
                  className={`text-[15px] leading-5 ${
                    selected ? "font-semibold text-[#1b5e20]" : "text-gray-800"
                  }`}
                >
                  {question.options[opt]}
                </Text>
              </View>

              {/* Dosha tag */}
              <View
                className="px-2.5 py-0.5 rounded-full ml-2"
                style={{
                  backgroundColor: color + "22",
                  borderColor: color,
                  borderWidth: 1,
                }}
              >
                <Text className="text-[11px] font-bold" style={{ color }}>
                  {dosha}
                </Text>
              </View>

              {selected && (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color="#2d5016"
                  style={{ marginLeft: 8 }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Back button */}
      {current > 0 && (
        <TouchableOpacity
          className="flex-row items-center justify-center p-4 bg-white border-t border-gray-300 gap-1.5"
          onPress={() => setCurrent(current - 1)}
        >
          <Ionicons name="arrow-back" size={18} color="#2d5016" />
          <Text className="text-[15px] font-semibold text-ayurveda-primary">
            Previous
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
