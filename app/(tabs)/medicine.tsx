import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MedicineStep1 from "../../components/MedicineStep1";
import MedicineStep2 from "../../components/MedicineStep2";
import MedicineStep3 from "../../components/MedicineStep3";
import MedicineResults from "../../components/MedicineResults";

export default function MedicineScreen() {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState<FormData>({
    disease: "",
    agni: "",
    region: "",
    gender: "male",
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

  const [predictedHerbs, setPredictedHerbs] = useState<PredictedHerbs>(null);

  const update = (key: keyof FormData, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const predictHerbs = async () => {
    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          disease_category: form.disease,
          agni_state: form.agni,
          geographic_region: form.region,
          gender: form.gender,
          age: form.age,
          vata_score: Number(form.vata || 0),
          pitta_score: Number(form.pitta || 0),
          kapha_score: Number(form.kapha || 0),
          ama_level: Number(form.ama || 0),
          mucus_level: Number(form.mucus || 0),
          dryness_level: Number(form.dryness || 0),
          heat_level: Number(form.heat || 0),
          pain_level: Number(form.pain || 0),
        }),
      });
      const data = await response.json();
      setPredictedHerbs({
        primary: data.top_3_labels[0],
        secondary: data.top_3_labels[1],
        tertiary: data.top_3_labels[2],
      });
    } catch (error) {
      console.error("Error predicting herbs:", error);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <MedicineStep1 form={form} update={update} onNext={() => setStep(2)} />;
      case 2:
        return (
          <MedicineStep2
            form={form}
            update={update}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        );
      case 3:
        return (
          <MedicineStep3
            form={form}
            update={update}
            onBack={() => setStep(2)}
            onPredict={predictHerbs}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-[#e6f1e8]"
      contentContainerStyle={{ padding: 20 }}
    >
      {/* HEADER */}
      <Text className="text-2xl font-bold text-[#1b5e20] text-center mb-3">
        🌿 Herb Recommendation
      </Text>
      <Text className="text-center text-gray-600 mb-6">
        Step {step} of 3
      </Text>

      {renderStep()}

      {step === 3 && <MedicineResults predictedHerbs={predictedHerbs} />}
    </ScrollView>
  );
}
