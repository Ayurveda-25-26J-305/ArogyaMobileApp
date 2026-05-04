import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import HerbResults from "../../components/HerbResult";
import MedicineStep1 from "../../components/MedicineStep1";
import MedicineStep2 from "../../components/MedicineStep2";
import MedicineStep3 from "../../components/MedicineStep3";
import { MedicineForm, PredictedHerbs } from "../../utils/medicinep";

// ── Replace with your machine's IPv4 from ipconfig ────────────
const API_URL = "http://192.168.1.12:5000";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictedHerbs, setPredictedHerbs] = useState<PredictedHerbs>(null);

  const [form, setForm] = useState<MedicineForm>({
    disease: "",
    agni: "",
    region: "Western",
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

  const update = (key: keyof MedicineForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRestart = () => {
    setForm({
      disease: "",
      agni: "",
      region: "Western",
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
    setPredictedHerbs(null);
    setError(null);
    setStep(1);
  };

  const predictHerbs = async () => {
    setLoading(true);
    setError(null);
    try {
      const body = {
        disease_category: form.disease || "diabetes",
        agni_state: form.agni || "Manda Agni",
        geographic_region: form.region || "Western",
        gender: form.gender || "male",
        age: Number(form.age) || 30,
        vata_score: Number(form.vata) || 5,
        pitta_score: Number(form.pitta) || 5,
        kapha_score: Number(form.kapha) || 5,
        ama_level: Number(form.ama) || 0,
        mucus_level: Number(form.mucus) || 0,
        dryness_level: Number(form.dryness) || 0,
        heat_level: Number(form.heat) || 0,
        pain_level: Number(form.pain) || 0,
      };

      console.log("→ Sending:", JSON.stringify(body, null, 2));

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log("← Status:", response.status);

      const data = await response.json();
      console.log("← Data:", JSON.stringify(data, null, 2));

      if (!data.success) throw new Error(data.error ?? "Prediction failed");

      setPredictedHerbs({
        primary: data.top_3_labels[0],
        secondary: data.top_3_labels[1],
        tertiary: data.top_3_labels[2],
      });
    } catch (e: any) {
      console.error("Predict error:", e.message);
      const msg = e.message || "Could not reach server.";
      setError(msg);
      Alert.alert("Connection Error", msg);
    } finally {
      setLoading(false);
      setStep(4);
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
      case 4:
        return (
          <HerbResults
            predictedHerbs={predictedHerbs}
            error={error}
            onBack={() => {
              setStep(3);
              setError(null);
            }}
            onRestart={handleRestart}
          />
        );
      default:
        return null;
    }
  };

  const showHeader = step !== 4;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={showHeader ? styles.content : styles.contentFull}
      showsVerticalScrollIndicator={false}
    >
      {showHeader && (
        <>
          <View style={styles.header}>
            <View style={styles.headerIconRing}>
              <Text style={styles.headerEmoji}>🌿</Text>
            </View>
            <Text style={styles.headerTitle}>Herb Recommendation</Text>
            <Text style={styles.headerSub}>
              AI-assisted herb guidance based on Ayurvedic principles
            </Text>
          </View>

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
        </>
      )}

      {renderStep()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  content: { padding: 20, paddingBottom: 48 },
  contentFull: { flexGrow: 1 },

  header: { alignItems: "center", marginBottom: 24 },
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
  stepItem: { alignItems: "center", gap: 5 },
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
  stepCircleActive: { backgroundColor: T.leaf, borderColor: T.leaf },
  stepCircleDone: { backgroundColor: T.leafMid, borderColor: T.leafMid },
  stepNum: { fontSize: 13, fontWeight: "700", color: T.inkLight },
  stepLabel: { fontSize: 10, color: T.inkLight, fontWeight: "500" },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: T.border,
    marginBottom: 16,
    marginHorizontal: 4,
  },
});
