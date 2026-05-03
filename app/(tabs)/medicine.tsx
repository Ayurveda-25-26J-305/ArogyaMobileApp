import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import MedicineResults from "../../components/MedicineResults";
import MedicineStep1 from "../../components/MedicineStep1";
import MedicineStep2 from "../../components/MedicineStep2";
import MedicineStep3 from "../../components/MedicineStep3";
import { MedicineForm, PredictedHerbs } from "../../utils/medicinep";

const T = {
  leaf: "#22543d",
  leafMid: "#276749",
  inkDark: "#1a202c",
  inkLight: "#718096",
  white: "#ffffff",
  bg: "#f1f8e9",
  border: "#e2e8f0",
  sage: "#48bb78",
};

const STEPS = ["Personal", "Dosha", "Symptoms"];

export default function MedicineScreen() {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState<MedicineForm>({
    disease: "",
    agni: "",
    region: "western",
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

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key as keyof MedicineForm]: value }));
  };

  const predictHerbs = async () => {
    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        return (
          <MedicineStep1
            form={form}
            update={update}
            onNext={() => setStep(2)}
          />
        );
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
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconRing}>
          <Text style={styles.headerEmoji}>🌿</Text>
        </View>
        <Text style={styles.headerTitle}>Herb Recommendation</Text>
        <Text style={styles.headerSub}>
          AI-assisted herb guidance based on Ayurvedic principles
        </Text>
      </View>

      {/* Step indicator */}
      <View style={styles.stepRow}>
        {STEPS.map((label, i) => {
          const idx = i + 1;
          const done = step > idx;
          const active = step === idx;
          return (
            <React.Fragment key={label}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    done && styles.stepCircleDone,
                    active && styles.stepCircleActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNum,
                      (done || active) && { color: T.white },
                    ]}
                  >
                    {done ? "✓" : idx}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    active && { color: T.leaf, fontWeight: "700" },
                    done && { color: T.leafMid },
                  ]}
                >
                  {label}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    step > i + 1 && { backgroundColor: T.sage },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Step content */}
      {renderStep()}

      {/* Results (shown after predict on step 3) */}
      {step === 3 && predictedHerbs && (
        <MedicineResults predictedHerbs={predictedHerbs} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: T.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.white,
    borderWidth: 2,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerEmoji: { fontSize: 34 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: T.inkDark,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: T.inkLight,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  stepItem: {
    alignItems: "center",
    gap: 5,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.white,
    borderWidth: 2,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
    backgroundColor: T.leaf,
    borderColor: T.leaf,
  },
  stepCircleDone: {
    backgroundColor: T.leafMid,
    borderColor: T.leafMid,
  },
  stepNum: {
    fontSize: 13,
    fontWeight: "700",
    color: T.inkLight,
  },
  stepLabel: {
    fontSize: 10,
    color: T.inkLight,
    fontWeight: "500",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: T.border,
    marginBottom: 16,
    marginHorizontal: 4,
  },
});
