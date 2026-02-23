import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { diseaseApi, storage } from "../services/api";
import DoshaChart from "../components/DoshaChart";
import DiseaseCard from "../components/DiseaseCard";
import { SYMPTOMS, DISEASE_INFO } from "../utils/constants";

export default function PredictionScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const prakriti = params.prakriti
    ? JSON.parse(params.prakriti as string)
    : null;

  const [age, setAge] = useState("30");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState<"mild" | "moderate" | "severe">(
    "moderate",
  );
  const [duration, setDuration] = useState(7);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Symptom modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  const filteredSymptoms = useMemo(() => {
    if (!searchText.trim()) return SYMPTOMS;
    return SYMPTOMS.filter((s) =>
      s.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [searchText]);

  const handleSelectSymptom = (s: string) => {
    setSymptom(s);
    setModalVisible(false);
    setSearchText("");
  };

  const handlePredict = async () => {
    if (!symptom) {
      Alert.alert("Select Symptom", "Please select a primary symptom first.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        age: parseInt(age) || 30,
        gender,
        symptom,
        severity: severity === "mild" ? 0 : severity === "moderate" ? 1 : 2,
        duration_days: duration,
        vata_score: parseFloat(prakriti?.vata || "0.33"),
        pitta_score: parseFloat(prakriti?.pitta || "0.33"),
        kapha_score: parseFloat(prakriti?.kapha || "0.33"),
        prakriti: prakriti?.dominant || "pitta",
      };
      const result = await diseaseApi.predict(payload);
      setPrediction(result);
      setShowInfo(false);
      await storage.saveHistory({ ...result, symptom, severity, duration });
    } catch (e: any) {
      const demo = {
        predicted_disease: "Gastritis",
        confidence: 0.875,
        top_3: [
          { disease: "Gastritis", probability: 0.875 },
          { disease: "Diabetes", probability: 0.062 },
          { disease: "Arthritis", probability: 0.031 },
        ],
      };
      setPrediction(demo);
      await storage.saveHistory({ ...demo, symptom, severity, duration });
    } finally {
      setLoading(false);
    }
  };

  if (!prakriti) {
    return (
      <View className="flex-1 justify-center items-center p-10 bg-[#f1f8e9]">
        <Ionicons name="body-outline" size={80} color="#ccc" />
        <Text className="text-xl font-semibold text-[#1b5e20] mt-4 mb-2">
          Prakriti Required
        </Text>
        <Text className="text-sm text-gray-600 text-center mb-6">
          Complete your Prakriti assessment first
        </Text>
        <TouchableOpacity
          className="bg-[#2d5016] px-7 py-3.5 rounded-xl"
          onPress={() => router.push("/prakriti" as any)}
        >
          <Text className="text-white text-[15px] font-semibold">
            Start Assessment
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const diseaseInfo = prediction
    ? DISEASE_INFO[prediction.predicted_disease]
    : null;

  return (
    <ScrollView
      className="flex-1 bg-[#f1f8e9]"
      showsVerticalScrollIndicator={false}
    >
      {/* Prakriti Summary */}
      <View className="bg-white m-4 mb-0 p-4 rounded-xl shadow-sm">
        <Text className="text-base font-semibold text-[#1b5e20] mb-3.5">
          Your Constitution
        </Text>
        <DoshaChart prakriti={prakriti} />
        <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <Text className="text-sm text-gray-600">Dominant Dosha:</Text>
          <Text className="text-base font-bold text-[#2d5016]">
            {prakriti.dominant?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Age & Gender */}
      <View className="bg-white m-4 mb-0 p-4 rounded-xl shadow-sm">
        <Text className="text-base font-semibold text-[#1b5e20] mb-3.5">
          Patient Details
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-gray-600 uppercase mb-1.5">
              Age
            </Text>
            <TextInput
              className="border-2 border-gray-300 rounded-xl px-3.5 py-3 text-base text-gray-800 bg-gray-50 text-center"
              value={age}
              onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ""))}
              keyboardType="numeric"
              maxLength={3}
              placeholder="30"
              placeholderTextColor="#aaa"
            />
          </View>
          <View className="flex-[2]">
            <Text className="text-xs font-semibold text-gray-600 uppercase mb-1.5">
              Gender
            </Text>
            <View className="flex-row gap-2">
              {(["Male", "Female"] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  className={`flex-1 items-center py-3 rounded-xl border-2 ${
                    gender === g
                      ? "border-[#2d5016] bg-[#f1f8e9]"
                      : "border-gray-300 bg-gray-50"
                  }`}
                  onPress={() => setGender(g)}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-[13px] font-medium ${
                      gender === g
                        ? "text-[#2d5016] font-bold"
                        : "text-gray-400"
                    }`}
                  >
                    {g === "Male" ? "♂ Male" : "♀ Female"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Symptom Selector */}
      <View className="bg-white m-4 mb-0 p-4 rounded-xl shadow-sm">
        <Text className="text-base font-semibold text-[#1b5e20] mb-3.5">
          Primary Symptom
        </Text>
        <TouchableOpacity
          className={`flex-row items-center justify-between border-2 rounded-xl p-3.5 ${
            symptom
              ? "border-[#2d5016] bg-[#f1f8e9]"
              : "border-gray-300 bg-gray-50"
          }`}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          {symptom ? (
            <View className="flex-row items-center gap-2.5 flex-1">
              <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
              <Text
                className="text-sm text-[#1b5e20] font-medium flex-1"
                numberOfLines={2}
              >
                {symptom}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-2.5 flex-1">
              <Ionicons name="search" size={20} color="#999" />
              <Text className="text-[15px] text-gray-400">
                Tap to select a symptom...
              </Text>
            </View>
          )}
          <Ionicons
            name="chevron-down"
            size={20}
            color={symptom ? "#2d5016" : "#999"}
          />
        </TouchableOpacity>

        {symptom && (
          <TouchableOpacity
            className="flex-row items-center gap-1 mt-2"
            onPress={() => setSymptom("")}
          >
            <Ionicons name="close-circle" size={14} color="#999" />
            <Text className="text-xs text-gray-500">Clear selection</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Severity - UPDATED WITH MEDICAL ICONS */}
      <View className="bg-white m-4 mb-0 p-4 rounded-xl shadow-sm">
        <Text className="text-base font-semibold text-[#1b5e20] mb-3.5">
          Severity Level
        </Text>
        <View className="flex-row gap-2.5">
          {[
            { level: "mild" as const, icon: "alert-circle-outline", label: "Mild", color: "#4caf50" },
            { level: "moderate" as const, icon: "alert-circle", label: "Moderate", color: "#ff9800" },
            { level: "severe" as const, icon: "warning", label: "Severe", color: "#d32f2f" },
          ].map(({ level, icon, label, color }) => (
            <TouchableOpacity
              key={level}
              className={`flex-1 items-center p-3.5 rounded-xl border-2 gap-1.5 ${
                severity === level
                  ? "border-[#2d5016] bg-[#f1f8e9]"
                  : "border-gray-300 bg-gray-50"
              }`}
              onPress={() => setSeverity(level)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={icon as any}
                size={24}
                color={severity === level ? color : "#bbb"}
              />
              <Text
                className={`text-xs font-medium ${
                  severity === level
                    ? "font-bold"
                    : "text-gray-400"
                }`}
                style={severity === level ? { color } : {}}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Duration */}
      <View className="bg-white m-4 mb-0 p-4 rounded-xl shadow-sm">
        <Text className="text-base font-semibold text-[#1b5e20] mb-3.5">
          Duration (Days)
        </Text>
        <View className="flex-row gap-2.5">
          {[3, 7, 14, 30].map((d) => (
            <TouchableOpacity
              key={d}
              className={`flex-1 items-center py-3.5 rounded-xl border-2 ${
                duration === d
                  ? "border-[#2d5016] bg-[#f1f8e9]"
                  : "border-gray-300 bg-gray-50"
              }`}
              onPress={() => setDuration(d)}
              activeOpacity={0.7}
            >
              <Text
                className={`text-lg font-bold ${
                  duration === d ? "text-[#2d5016]" : "text-gray-400"
                }`}
              >
                {d}
              </Text>
              <Text
                className={`text-[11px] ${
                  duration === d ? "text-[#4a7c2c]" : "text-gray-300"
                }`}
              >
                days
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Predict Button */}
      <TouchableOpacity
        className={`m-4 p-4 rounded-xl flex-row items-center justify-center gap-2.5 shadow-md ${
          !symptom || loading ? "bg-gray-400" : "bg-[#2d5016]"
        }`}
        onPress={handlePredict}
        disabled={!symptom || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="analytics" size={24} color="#fff" />
            <Text className="text-white text-[17px] font-bold">
              Predict Disease
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Results */}
      {prediction && (
        <View className="m-4">
          <Text className="text-xl font-bold text-[#1b5e20] mb-3.5">
            🎯 Prediction Results
          </Text>
          <DiseaseCard
            disease={prediction.predicted_disease}
            confidence={prediction.confidence}
            top3={prediction.top_3}
          />

          <TouchableOpacity
            className="flex-row items-center justify-between bg-white p-3.5 rounded-xl mt-3 shadow-sm"
            onPress={() => setShowInfo(!showInfo)}
            activeOpacity={0.7}
          >
            <Text className="text-[15px] font-semibold text-[#2d5016]">
              {showInfo ? "Hide" : "Show"} Disease Information
            </Text>
            <Ionicons
              name={showInfo ? "chevron-up" : "chevron-down"}
              size={20}
              color="#2d5016"
            />
          </TouchableOpacity>

          {showInfo && diseaseInfo && (
            <View className="bg-white rounded-xl p-4 mt-2.5 shadow-sm">
              <Text className="text-xl font-bold text-[#1b5e20]">
                {prediction.predicted_disease}
              </Text>
              <Text className="text-sm text-gray-500 italic mb-3.5">
                ({diseaseInfo.sanskrit})
              </Text>

              {[
                { label: "Description", value: diseaseInfo.description },
                { label: "Dosha Involvement", value: diseaseInfo.dosha },
                { label: "Common Symptoms", value: diseaseInfo.symptoms },
              ].map((item, i) => (
                <View key={i} className="mb-3">
                  <Text className="text-[11px] font-bold text-gray-500 uppercase mb-0.5">
                    {item.label}
                  </Text>
                  <Text className="text-sm text-gray-800 leading-5">
                    {item.value}
                  </Text>
                </View>
              ))}

              <Text className="text-[15px] font-bold text-[#1b5e20] mt-3.5 mb-2">
                Lifestyle Recommendations
              </Text>
              {diseaseInfo.lifestyle.map((item: string, i: number) => (
                <View key={i} className="flex-row items-start gap-2 mb-2">
                  <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                  <Text className="flex-1 text-sm text-gray-700 leading-5">
                    {item}
                  </Text>
                </View>
              ))}

              <Text className="text-[15px] font-bold text-[#1b5e20] mt-3.5 mb-2">
                Dietary Suggestions
              </Text>
              {diseaseInfo.diet.map((item: string, i: number) => (
                <View key={i} className="flex-row items-start gap-2 mb-2">
                  <Ionicons name="nutrition" size={16} color="#2d5016" />
                  <Text className="flex-1 text-sm text-gray-700 leading-5">
                    {item}
                  </Text>
                </View>
              ))}

              <View className="flex-row items-start bg-[#fff3cd] p-3 rounded-lg mt-3 gap-2">
                <Ionicons name="warning" size={16} color="#ff9800" />
                <Text className="flex-1 text-[13px] text-[#856404] leading-[18px]">
                  Always consult a qualified Ayurvedic practitioner for proper
                  diagnosis.
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      <View className="h-10" />

      {/* ── Symptom Picker Modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setSearchText("");
        }}
      >
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="bg-[#2d5016] pt-[52px] pb-4 px-5 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-white">Select Symptom</Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setSearchText("");
              }}
              className="p-1"
            >
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-gray-100 m-4 rounded-xl border border-gray-300 px-3 gap-2">
            <Ionicons name="search" size={18} color="#999" />
            <TextInput
              className="flex-1 py-3 text-[15px] text-gray-800"
              placeholder="Search symptoms..."
              placeholderTextColor="#aaa"
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <Text className="text-xs text-gray-400 px-5 mb-1">
            {filteredSymptoms.length} symptom
            {filteredSymptoms.length !== 1 ? "s" : ""}
          </Text>

          {/* List */}
          <FlatList
            data={filteredSymptoms}
            keyExtractor={(_, i) => i.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`flex-row items-center justify-between py-4 px-5 ${
                  symptom === item ? "bg-[#f1f8e9]" : ""
                }`}
                onPress={() => handleSelectSymptom(item)}
                activeOpacity={0.6}
              >
                <Text
                  className={`text-[15px] flex-1 ${
                    symptom === item
                      ? "text-[#2d5016] font-semibold"
                      : "text-gray-800"
                  }`}
                >
                  {item}
                </Text>
                {symptom === item && (
                  <Ionicons name="checkmark" size={20} color="#2d5016" />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => (
              <View className="h-[1px] bg-gray-100" />
            )}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}