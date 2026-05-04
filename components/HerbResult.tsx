import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { fetchHerbTreatment, HerbTreatment } from "../services/supabase";

const T = {
  leaf: "#22543d",
  leafMid: "#276749",
  sagePale: "#d4edda",
  inkDark: "#1a202c",
  inkMid: "#2d3748",
  inkLight: "#718096",
  border: "#e2e8f0",
  borderGreen: "#9ae6b4",
  white: "#ffffff",
  bg: "#f1f8e9",
  cream: "#faf7f0",
  amber: "#c8860a",
  amberPale: "#fef9e7",
  blue: "#3182ce",
  bluePale: "#ebf8ff",
};

interface HerbResultsProps {
  predictedHerbs: {
    primary: {
      name: string;
      sanskrit: string;
      description: string;
      confidence: number;
      treatmentForm: string;
      treatmentDesc: string;
      treatmentConf: number;
    };
    secondary: { name: string; sanskrit: string; confidence: number } | null;
    tertiary: { name: string; sanskrit: string; confidence: number } | null;
  } | null;
  error: string | null;
  onBack: () => void;
  onRestart: () => void;
}

export default function HerbResults({
  predictedHerbs,
  error,
  onBack,
  onRestart,
}: HerbResultsProps) {
  const [record, setRecord] = useState<HerbTreatment | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // fetch from Supabase when prediction arrives
  useEffect(() => {
    if (!predictedHerbs?.primary) return;
    const { name, treatmentForm } = predictedHerbs.primary;

    const load = async () => {
      setLoading(true);
      setDbError(null);
      const data = await fetchHerbTreatment(name, treatmentForm);
      if (!data) {
        setDbError(`No data found for ${name} + ${treatmentForm}`);
      } else {
        setRecord(data);
      }
      setLoading(false);
    };
    load();
  }, [predictedHerbs?.primary?.name, predictedHerbs?.primary?.treatmentForm]);

  // ── Error from API ────────────────────────────────────────────
  if (error) {
    return (
      <View style={s.centerBox}>
        <Text style={s.errorIcon}>⚠️</Text>
        <Text style={s.errorTitle}>Could not get recommendation</Text>
        <Text style={s.errorMsg}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={onBack}>
          <Text style={s.retryText}>← Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── No prediction ─────────────────────────────────────────────
  if (!predictedHerbs) {
    return (
      <View style={s.centerBox}>
        <Text style={s.errorMsg}>No prediction available.</Text>
        <TouchableOpacity style={s.retryBtn} onPress={onBack}>
          <Text style={s.retryText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Loading from Supabase ─────────────────────────────────────
  if (loading) {
    return (
      <View style={s.centerBox}>
        <ActivityIndicator size="large" color={T.leaf} />
        <Text style={s.loadingText}>Loading herb details…</Text>
      </View>
    );
  }

  // ── Supabase error ────────────────────────────────────────────
  if (dbError || !record) {
    return (
      <View style={s.centerBox}>
        <Text style={s.errorIcon}>🌿</Text>
        <Text style={s.errorTitle}>
          {predictedHerbs.primary.name.replace(/_/g, " ")}
        </Text>
        <Text style={s.errorMsg}>
          {dbError ?? "Herb details not found in database."}
        </Text>
        <TouchableOpacity style={s.retryBtn} onPress={onRestart}>
          <Text style={s.retryText}> New Assessment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pred = predictedHerbs.primary;
  const isBefore = record.when_to_use === "before";

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerIconRing}>
          <Text style={s.headerEmoji}>🌿</Text>
        </View>
        <Text style={s.headerTitle}>Recommended Herb</Text>
        <Text style={s.headerSub}>
          Based on your dosha profile, agni state, and symptom assessment
        </Text>
      </View>

      {/* ── Main Card ─────────────────────────────────────────── */}
      <View style={s.card}>
        <View style={s.cardStripe} />

        {/* Image from Supabase storage */}
        <Image
          source={{ uri: record.image_url }}
          style={s.herbImage}
          resizeMode="cover"
        />

        {/* Names */}
        <View style={s.nameBlock}>
          <Text style={s.sinhalaName}>{record.sinhala_name}</Text>
          <Text style={s.englishName}>{record.english_name}</Text>
          <Text style={s.sanskrit}>Sanskrit: {record.sanskrit_name}</Text>

          {/* Confidence bar — from model */}

          {/* Benefit — from Supabase */}
        </View>

        <View style={s.divider} />

        {/* Treatment form — model + Supabase dosage */}
        <View style={s.section}>
          <Text style={s.sectionTitle}> Treatment Form</Text>
          <View style={s.treatRow}>
            <View style={s.treatBadge}>
              <Text style={s.treatBadgeText}>
                {pred.treatmentForm.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={s.dosage}> {record.dosage}</Text>
        </View>

        <View style={s.divider} />

        {/* When to use — from Supabase */}
        <View style={s.section}>
          <Text style={s.sectionTitle}> When to Use</Text>
          <Text style={s.whenText}>
            {isBefore ? "Take before meals" : "Take after meals"}
          </Text>
          <Text style={s.mealTip}>{record.meal_tip}</Text>
        </View>

        {/* Directions — specific to herb+treatment combo from Supabase */}
        <View style={s.section}>
          <Text style={s.sectionTitle}> How to Use</Text>
          {record.directions.map((item) => (
            <View key={item.step} style={s.stepRow}>
              <View style={s.stepCircle}>
                <Text style={s.stepNum}>{item.step}</Text>
              </View>
              <Text style={s.stepText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Alternatives — from model */}
      {(predictedHerbs.secondary || predictedHerbs.tertiary) && (
        <View style={s.altCard}>
          <Text style={s.altTitle}>Alternative Herbs</Text>
          <Text style={s.altSub}>Other herbs that may suit your profile</Text>
          {[predictedHerbs.secondary, predictedHerbs.tertiary].map((alt, i) =>
            alt ? (
              <View key={i} style={s.altRow}>
                <View style={s.altRank}>
                  <Text style={s.altRankText}>{i + 2}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.altName}>{alt.name.replace(/_/g, " ")}</Text>
                  <Text style={s.altSanskrit}>{alt.sanskrit}</Text>
                </View>
              </View>
            ) : null,
          )}
        </View>
      )}

      {/* Disclaimer */}
      <View style={s.disclaimer}>
        <Text style={s.disclaimerIcon}></Text>
        <Text style={s.disclaimerText}>
          This recommendation is generated by an AI model trained on Ayurvedic
          data. Always consult a qualified Ayurvedic physician before starting
          any herbal treatment.
        </Text>
      </View>

      {/* Buttons */}
      <View style={s.navRow}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.8}
          style={s.backBtn}
        >
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onRestart}
          activeOpacity={0.85}
          style={s.restartBtn}
        >
          <Text style={s.restartBtnText}> New Assessment</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  content: { padding: 20, paddingBottom: 48 },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: { marginTop: 16, fontSize: 14, color: T.inkLight },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: T.inkDark,
    marginBottom: 8,
  },
  errorMsg: {
    fontSize: 13,
    color: T.inkLight,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: T.sagePale,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: T.borderGreen,
  },
  retryText: { color: T.leaf, fontWeight: "700", fontSize: 14 },
  header: { alignItems: "center", marginBottom: 20 },
  headerIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.white,
    borderWidth: 2,
    borderColor: T.borderGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: T.leaf,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  headerEmoji: { fontSize: 34 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: T.inkDark,
    textAlign: "center",
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 13,
    color: T.inkLight,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: T.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: T.borderGreen,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardStripe: { height: 5, backgroundColor: T.leaf },
  herbImage: { width: "100%", height: 200 },
  nameBlock: { padding: 20, paddingBottom: 16 },
  sinhalaName: {
    fontSize: 30,
    fontWeight: "800",
    color: T.leaf,
    marginBottom: 4,
  },
  englishName: {
    fontSize: 17,
    fontWeight: "700",
    color: T.inkDark,
    marginBottom: 2,
  },
  sanskrit: {
    fontSize: 13,
    color: T.inkLight,
    fontStyle: "italic",
    marginBottom: 12,
  },
  confRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  confLabel: { fontSize: 12, color: T.inkLight },
  confPct: { fontSize: 12, fontWeight: "700", color: T.leaf },
  confTrack: {
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 14,
  },
  confFill: { height: "100%", backgroundColor: T.leaf, borderRadius: 3 },
  benefitBox: {
    backgroundColor: T.sagePale,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: T.borderGreen,
  },
  benefitText: { fontSize: 13, color: T.leafMid, lineHeight: 20 },
  divider: { height: 1, backgroundColor: T.border, marginHorizontal: 20 },
  section: { padding: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: T.inkDark,
    marginBottom: 12,
  },
  treatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  treatBadge: {
    backgroundColor: T.bluePale,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#bee3f8",
  },
  treatBadgeText: { fontSize: 14, fontWeight: "800", color: T.blue },
  treatConf: { fontSize: 12, color: T.inkLight },
  dosage: { fontSize: 13, fontWeight: "600", color: T.inkDark },
  whenBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 10,
  },
  whenBadgeText: { fontSize: 14, fontWeight: "700" },
  mealTip: { fontSize: 13, color: T.inkMid, lineHeight: 20 },
  stepRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    alignItems: "flex-start",
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.leaf,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNum: { color: T.white, fontSize: 12, fontWeight: "800" },
  stepText: { flex: 1, fontSize: 13, color: T.inkMid, lineHeight: 20 },
  altCard: {
    backgroundColor: T.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  altTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: T.inkDark,
    marginBottom: 4,
  },
  altSub: { fontSize: 12, color: T.inkLight, marginBottom: 14 },
  altRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: T.border,
  },
  altRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.sagePale,
    alignItems: "center",
    justifyContent: "center",
  },
  altRankText: { fontSize: 13, fontWeight: "700", color: T.leaf },
  altName: { fontSize: 14, fontWeight: "600", color: T.inkDark },
  altSanskrit: { fontSize: 12, color: T.inkLight, fontStyle: "italic" },
  altConf: { fontSize: 13, fontWeight: "700", color: T.leaf },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: T.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    marginBottom: 20,
  },
  disclaimerIcon: { fontSize: 16, marginTop: 1 },
  disclaimerText: { flex: 1, fontSize: 12, color: T.inkLight, lineHeight: 18 },
  navRow: { flexDirection: "row", gap: 10 },
  backBtn: {
    flex: 1,
    backgroundColor: T.sagePale,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: T.borderGreen,
  },
  whenText: {
    fontSize: 14,
    fontWeight: "600",
    color: T.white,
    marginBottom: 6,
  },
  backBtnText: { color: T.leaf, fontWeight: "700", fontSize: 15 },
  restartBtn: {
    flex: 2,
    backgroundColor: T.leaf,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: T.leaf,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  restartBtnText: { color: T.white, fontWeight: "700", fontSize: 15 },
});
