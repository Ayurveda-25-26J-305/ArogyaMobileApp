import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function MedicineScreen() {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    disease: "",
    agni: "",
    region: "",
    gender: "",
    age: "",
    vata: "",
    pitta: "",
    kapha: "",
    ama: "",
    mucus: "",
    dryness: "",
    heat: "",
    pain: "",
  });

  const [predictedHerbs, setPredictedHerbs] = useState<any>(null);

  const update = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const predictHerbs = () => {
    const herbs = [
      "Neem",
      "Tulsi",
      "Ashwagandha",
      "Brahmi",
      "Amla",
      "Shatavari",
      "Guggulu",
    ];

    const doshaSum =
      Number(form.vata || 0) +
      Number(form.pitta || 0) +
      Number(form.kapha || 0);

    const index1 = (doshaSum + form.disease.length) % herbs.length;
    const index2 = (index1 + 2) % herbs.length;

    setPredictedHerbs({
      primary: herbs[index1],
      secondary: herbs[index2],
    });
  };

  const Field = ({ label, children }: any) => (
    <View className="mb-4">
      <Text className="text-gray-700 mb-1 text-sm font-medium">{label}</Text>
      {children}
    </View>
  );

  return (
    <ScrollView
      className="flex-1 bg-[#f4fbf2]"
      contentContainerStyle={{ padding: 20 }}
    >
      {/* HEADER */}
      <Text className="text-2xl font-bold text-[#1b5e20] text-center mb-2">
        🌿 Herb Recommendation
      </Text>

      <Text className="text-center text-gray-500 mb-6">Step {step} of 3</Text>

      {/* CARD CONTAINER */}
      <View className="bg-transparent ">
        {/* STEP 1 */}
        {/* STEP 1 */}
        {step === 1 && (
          <View className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 space-y-5">
            {/* Disease */}
            <Field label="Health Condition">
              <Text className="text-gray-400 text-xs mb-2">
                Select the main condition you are experiencing
              </Text>

              <View className="bg-white border border-gray-200 rounded-xl h-[56px] justify-center px-3">
                <Picker
                  style={{ height: 56, backgroundColor: "white" }}
                  dropdownIconColor="#2e7d32"
                  selectedValue={form.disease}
                  onValueChange={(v) => update("disease", v)}
                >
                  <Picker.Item
                    label="Select your condition"
                    value=""
                    color="#9ca3af"
                  />
                  <Picker.Item
                    label="Arthritis"
                    value="arthritis"
                    color="#6b7280"
                  />
                  <Picker.Item
                    label="Gastritis"
                    value="gastritis"
                    color="#6b7280"
                  />
                  <Picker.Item label="Asthma" value="asthma" color="#6b7280" />
                  <Picker.Item
                    label="Migraine"
                    value="migraine"
                    color="#6b7280"
                  />
                  <Picker.Item
                    label="Diabetes"
                    value="diabetes"
                    color="#6b7280"
                  />
                </Picker>
              </View>
            </Field>

            {/* Region */}
            <Field label="Living Region">
              <Text className="text-gray-400 text-xs mb-2">
                Climate and environment affect Ayurvedic treatment
              </Text>

              <View className="bg-white border border-gray-200 rounded-xl h-[56px] justify-center px-3">
                <Picker
                  style={{ height: 56, backgroundColor: "white" }}
                  dropdownIconColor="#2e7d32"
                  selectedValue={form.region}
                  onValueChange={(v) => update("region", v)}
                >
                  <Picker.Item label="Select your region" value="" />
                  <Picker.Item
                    label="Western Region (Humid & Coastal)"
                    value="western"
                  />
                  <Picker.Item
                    label="Eastern Region (Hot & Dry)"
                    value="eastern"
                  />
                  <Picker.Item
                    label="Southern Region (Warm Tropical)"
                    value="southern"
                  />
                </Picker>
              </View>
            </Field>

            {/* Gender */}
            <Field label="Gender">
              <Text className="text-gray-400 text-xs mb-2">
                Helps personalize Ayurvedic recommendations
              </Text>

              <View className="bg-white border border-gray-200 rounded-xl h-[56px] justify-center px-3">
                <Picker
                  style={{ height: 56, backgroundColor: "white" }}
                  dropdownIconColor="#2e7d32"
                  selectedValue={form.gender}
                  onValueChange={(v) => update("gender", v)}
                >
                  <Picker.Item label="Select gender" value="" />
                  <Picker.Item label="Male" value="male" />
                  <Picker.Item label="Female" value="female" />
                </Picker>
              </View>
            </Field>

            {/* Age */}
            <Field label="Age">
              <Text className="text-gray-400 text-xs mb-2"></Text>

              <TextInput
                keyboardType="numeric"
                placeholder="Enter your age"
                className="bg-white border border-gray-200 rounded-xl px-4 h-[56px]"
                onChangeText={(v) => update("age", v)}
              />
            </Field>

            {/* Next Button */}
            <TouchableOpacity
              onPress={() => setStep(2)}
              className="bg-[#2e7d32] py-4 rounded-xl items-center mt-4 shadow"
            >
              <Text className="text-white font-semibold text-base">
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {/* STEP 2 */}
        {/* STEP 2 */}
        {step === 2 && (
          <View className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 space-y-5">
            {/* Title */}
            <Text className="text-lg font-semibold text-gray-800">
              Physiological Balance Assessment
            </Text>

            {/* Agni State */}
            <Field label="Agni State">
              <Text className="text-gray-400 text-xs mb-2">
                Digestive strength according to Ayurvedic principles
              </Text>

              <View className="bg-white border border-gray-200 rounded-xl h-[56px] justify-center px-3">
                <Picker
                  style={{ height: 56, backgroundColor: "white" }}
                  dropdownIconColor="#2e7d32"
                  selectedValue={form.agni}
                  onValueChange={(v) => update("agni", v)}
                >
                  <Picker.Item
                    label="Select Agni State"
                    value=""
                    color="#9ca3af"
                  />
                  <Picker.Item
                    label="Vishama"
                    value="Vishama"
                    color="#6b7280"
                  />
                  <Picker.Item label="Sama" value="Sama" color="#6b7280" />
                  <Picker.Item label="Manda" value="Manda" color="#6b7280" />
                  <Picker.Item
                    label="Tikshna"
                    value="Tikshna"
                    color="#6b7280"
                  />
                </Picker>
              </View>

              {/* Agni Explanation Panel */}
              <View className="bg-gray-50 border border-gray-100 rounded-xl p-4 mt-3 space-y-2">
                <Text className="text-gray-700 font-semibold text-sm">
                  Understanding Agni States
                </Text>

                {[
                  [
                    "Vishama",
                    "Irregular digestion, gas, bloating or unstable appetite",
                  ],
                  ["Sama", "Balanced digestion and healthy metabolism"],
                  [
                    "Manda",
                    "Slow digestion, heaviness after meals, low appetite",
                  ],
                  [
                    "Tikshna",
                    "Very strong digestion, excessive hunger or burning sensation",
                  ],
                ].map(([title, desc]) => (
                  <View key={title} className="flex-row items-start space-x-2">
                    <Text className="text-green-700">•</Text>

                    <View className="flex-1">
                      <Text className="text-gray-800 text-xs font-semibold">
                        {title}
                      </Text>

                      <Text className="text-gray-500 text-xs leading-4">
                        {desc}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Field>

            {/* Dosha Scores */}
            {[
              ["vata", "Vata Score (0-10)"],
              ["pitta", "Pitta Score (0-10)"],
              ["kapha", "Kapha Score (0-10)"],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <Text className="text-gray-400 text-xs mb-2">
                  Enter value between 0 and 10
                </Text>

                <TextInput
                  keyboardType="numeric"
                  placeholder="Enter value"
                  className="bg-white border border-gray-200 rounded-xl px-4 h-[56px]"
                  onChangeText={(v) => update(key, v)}
                />
              </Field>
            ))}

            {/* Navigation Buttons */}
            <View className="flex-row justify-between pt-2">
              <TouchableOpacity
                onPress={() => setStep(1)}
                className="bg-gray-400 py-4 px-6 rounded-xl flex-1 mr-2"
              >
                <Text className="text-white font-semibold text-center">
                  Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStep(3)}
                className="bg-[#2e7d32] py-4 px-6 rounded-xl flex-1 ml-2"
              >
                <Text className="text-white font-semibold text-center">
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3 */}
        {/* STEP 3 */}
        {step === 3 && (
          <View className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 space-y-5">
            {[
              ["ama", "Ama Level (toxins)"],
              ["mucus", "Mucus Severity"],
              ["dryness", "Dryness Severity"],
              ["heat", "Heat Severity"],
              ["pain", "Pain Severity"],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <Text className="text-gray-400 text-xs mb-2">
                  Select severity level (0 = None, 10 = Very severe)
                </Text>

                <TextInput
                  keyboardType="numeric"
                  placeholder="Enter value between 0 and 10"
                  className="bg-white border border-gray-200 rounded-xl px-4 h-[56px]"
                  onChangeText={(v) => update(key, v)}
                />
              </Field>
            ))}

            {/* Navigation Buttons */}
            <View className="flex-row justify-between pt-2">
              <TouchableOpacity
                onPress={() => setStep(2)}
                className="bg-gray-400 py-4 px-6 rounded-xl flex-1 mr-2"
              >
                <Text className="text-white font-semibold text-center">
                  Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={predictHerbs}
                className="bg-[#2e7d32] py-4 px-6 rounded-xl flex-1 ml-2"
              >
                <Text className="text-white font-semibold text-center">
                  Predict
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* RESULT CARD */}
        {predictedHerbs && (
          <View className="bg-white rounded-2xl p-4 mt-5 shadow-sm">
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
          </View>
        )}
      </View>
    </ScrollView>
  );
}