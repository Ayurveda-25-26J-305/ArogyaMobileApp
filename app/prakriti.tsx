import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { storage } from "../services/api";
import { PRAKRITI_QUESTIONS } from "../utils/constants";

const DOSHA_COLORS: any = {
  vata: "#FF6B6B",
  pitta: "#4ECDC4",
  kapha: "#45B7D1",
};

export default function PrakritiScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<any>({});

  const calculatePrakriti = (ans: any) => {
    const counts: any = { vata: 0, pitta: 0, kapha: 0 };
    Object.values(ans).forEach((v: any) => {
      counts[v]++;
    });
    const total = Object.values(counts).reduce(
      (a: any, b: any) => a + b,
      0,
    ) as number;
    return {
      vata: (counts.vata / total).toFixed(2),
      pitta: (counts.pitta / total).toFixed(2),
      kapha: (counts.kapha / total).toFixed(2),
      dominant: (Object.keys(counts) as string[]).reduce((a, b) =>
        counts[a] > counts[b] ? a : b,
      ),
    };
  };

  const handleAnswer = async (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (current < PRAKRITI_QUESTIONS.length - 1) {
      setCurrent(current + 1);
    } else {
      const prakriti = calculatePrakriti(newAnswers);
      await storage.savePrakriti(prakriti);
      router.replace({
        pathname: "/prediction",
        params: { prakriti: JSON.stringify(prakriti) },
      } as any);
    }
  };

  const question = PRAKRITI_QUESTIONS[current];
  const progress = ((current + 1) / PRAKRITI_QUESTIONS.length) * 100;

  return (
    <View className="flex-1 bg-[#f1f8e9]">
      {/* Progress */}
      <View className="bg-white px-5 py-3.5 border-b border-gray-300">
        <View className="h-2 bg-gray-300 rounded overflow-hidden mb-2">
          <View
            className="h-full bg-ayurveda-primary rounded"
            style={{ width: `${progress}%` }}
          />
        </View>
        <Text className="text-[13px] text-gray-600 text-center">
          Question {current + 1} of {PRAKRITI_QUESTIONS.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        {/* Question Card */}
        <View className="bg-white rounded-[14px] p-5 mb-5 shadow-md">
          <Text className="text-lg font-semibold text-[#1b5e20] leading-7">
            {question.question}
          </Text>
        </View>

        {/* Options */}
        {question.options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            className={`bg-white rounded-xl p-4 flex-row items-center mb-3 border-2 shadow-sm ${
              answers[question.id] === opt.value
                ? "border-ayurveda-primary bg-[#f1f8e9]"
                : "border-gray-300"
            }`}
            onPress={() => handleAnswer(question.id, opt.value)}
            activeOpacity={0.7}
          >
            <View className="flex-1">
              <Text
                className={`text-[15px] leading-5 ${
                  answers[question.id] === opt.value
                    ? "font-semibold text-[#1b5e20]"
                    : "text-gray-800"
                }`}
              >
                {opt.label}
              </Text>
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: DOSHA_COLORS[opt.value] }}
            >
              <Text className="text-xs font-bold text-white">{opt.dosha}</Text>
            </View>
            {answers[question.id] === opt.value && (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color="#2d5016"
                style={{ marginLeft: 8 }}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Back Button */}
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
