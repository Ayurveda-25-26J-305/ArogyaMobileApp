import { fetchHerbTreatment, HerbTreatment } from "@/services/supabase";
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
import { PredictedHerbs } from "../utils/medicinep";

// ─── THEME ────────────────────────────────────────────────────────────────────
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
  gold: "#b7791f",
  teal: "#2c7a7b",
  amber: "#c8860a",
  amberPale: "#fef9e7",
};

const RANK_CONFIG = [
  {
    label: "Primary",
    badge: "1st",
    icon: "🌿",
    color: T.leaf,
    bg: T.sagePale,
    border: T.borderGreen,
  },
  {
    label: "Secondary",
    badge: "2nd",
    icon: "🍃",
    color: T.gold,
    bg: "#fef9e7",
    border: "#f6d860",
  },
  {
    label: "Tertiary",
    badge: "3rd",
    icon: "🌱",
    color: T.teal,
    bg: "#e6fffa",
    border: "#81e6d9",
  },
];

// ─── PROPS ────────────────────────────────────────────────────────────────────
interface HerbResultsProps {
  predictedHerbs: PredictedHerbs;
  error: string | null;
  onBack: () => void;
  onRestart: () => void;
}

// ─── SINGLE HERB CARD ─────────────────────────────────────────────────────────
function HerbCard({
  herbName,
  rank,
  expanded,
  onToggle,
}: {
  herbName: string;
  rank: (typeof RANK_CONFIG)[number];
  expanded: boolean;
  onToggle: () => void;
}) {
  const [herb, setHerb] = useState<HerbTreatment | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState(false);

  useEffect(() => {
    if (!herbName || herbName === "—") return;
    setLoading(true);
    setFetchErr(false);

    fetchHerbTreatment(herbName)
      .then((result) => {
        console.log("→ Result for", herbName, ":", JSON.stringify(result));
        if (result) setHerb(result);
        else setFetchErr(true);
      })
      .catch((e) => {
        console.error("→ Catch error for", herbName, ":", e.message);
        setFetchErr(true);
      })
      .finally(() => setLoading(false));
  }, [herbName]);

  const isBefore = herb?.when_to_use === "before";

  return (
    <View style={[styles.card, { borderColor: rank.border }]}>
      {/* Accent stripe */}
      <View style={[styles.cardStripe, { backgroundColor: rank.color }]} />

      {/* ── Collapsed header — always visible ── */}
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.8}
        style={[
          styles.cardHeader,
          { backgroundColor: expanded ? rank.bg : T.white },
        ]}
      >
        <View style={[styles.badge, { backgroundColor: rank.color }]}>
          <Text style={styles.badgeText}>{rank.badge}</Text>
        </View>
        <Text style={styles.rankIcon}>{rank.icon}</Text>
        <View style={{ flex: 1 }}>
          {loading ? (
            <ActivityIndicator size="small" color={rank.color} />
          ) : (
            <>
              <Text style={[styles.sinhalaName, { color: rank.color }]}>
                {herb?.sinhala_name ?? herbName.replace(/_/g, " ")}
              </Text>
              <Text style={styles.englishName}>
                {herb?.english_name ?? herbName.replace(/_/g, " ")}
              </Text>
            </>
          )}
        </View>
        <Text style={[styles.chevron, { color: rank.color }]}>
          {expanded ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>

      {/* ── Expanded body ── */}
      {expanded && (
        <View>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={rank.color} />
              <Text style={styles.loadingText}>Loading herb details…</Text>
            </View>
          ) : fetchErr || !herb ? (
            <View style={styles.errBox}>
              <Text style={styles.errText}>
                ⚠️ Could not load details for "{herbName.replace(/_/g, " ")}".
              </Text>
            </View>
          ) : (
            <>
              {/* Image */}
              <Image
                source={{ uri: herb.image_url }}
                style={styles.herbImage}
                resizeMode="cover"
              />

              <View style={styles.cardBody}>
                {/* Sanskrit name */}
                <Text style={styles.sanskritLabel}>{herb.sanskrit_name}</Text>

                {/* Benefit box */}
                <View
                  style={[
                    styles.benefitBox,
                    { borderColor: rank.border, backgroundColor: rank.bg },
                  ]}
                >
                  <Text style={[styles.benefitText, { color: rank.color }]}>
                    {herb.benefit}
                  </Text>
                </View>

                {/* Treatment form pill */}
                <View style={styles.formPill}>
                  <Text style={styles.formPillText}>
                    🧪 Treatment: {herb.treatment_form}
                  </Text>
                </View>

                <View style={styles.divider} />

                {/* When to use */}
                <Text style={styles.sectionTitle}>⏰ When to Use</Text>
                <View
                  style={[
                    styles.whenBadge,
                    {
                      backgroundColor: isBefore ? T.sagePale : T.amberPale,
                      borderColor: isBefore ? T.borderGreen : "#f6d860",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.whenText,
                      { color: isBefore ? T.leaf : T.amber },
                    ]}
                  >
                    {isBefore ? "🍽️  Before Meals" : "🍽️  After Meals"}
                  </Text>
                </View>
                <Text style={styles.mealTip}>{herb.meal_tip}</Text>

                <View style={styles.divider} />

                {/* Directions */}
                <Text style={styles.sectionTitle}>📖 How to Use</Text>
                {(herb.directions ?? []).map((item) => (
                  <View key={item.step} style={styles.stepRow}>
                    <View
                      style={[
                        styles.stepCircle,
                        { backgroundColor: rank.color },
                      ]}
                    >
                      <Text style={styles.stepNum}>{item.step}</Text>
                    </View>
                    <Text style={styles.stepText}>{item.text}</Text>
                  </View>
                ))}

                <View style={styles.divider} />

                {/* Dosage */}
                <View style={styles.dosageRow}>
                  <Text style={styles.dosageIcon}>💊</Text>
                  <View>
                    <Text style={styles.dosageLabel}>Recommended Dosage</Text>
                    <Text style={styles.dosageValue}>{herb.dosage}</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function HerbResults({
  predictedHerbs,
  error,
  onBack,
  onRestart,
}: HerbResultsProps) {
  const [expanded, setExpanded] = useState<number>(0);

  // ── Error state ───────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Prediction Failed</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        <TouchableOpacity onPress={onBack} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>← Go Back & Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const herbNames = [
    predictedHerbs?.primary ?? "—",
    predictedHerbs?.secondary ?? "—",
    predictedHerbs?.tertiary ?? "—",
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerIconRing}>
          <Text style={styles.headerEmoji}>🌿</Text>
        </View>
        <Text style={styles.headerTitle}>Your Herb Recommendations</Text>
        <Text style={styles.headerSub}>
          Based on your dosha profile, agni state, and symptom assessment
        </Text>
      </View>

      {/* ── Info banner ── */}
      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>📋</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Ayurvedic Analysis Complete</Text>
          <Text style={styles.bannerSub}>
            Tap each card to see full details. Consult an Ayurvedic practitioner
            before use.
          </Text>
        </View>
      </View>

      {/* ── 3 Herb Cards ── */}
      {RANK_CONFIG.map((rank, i) => (
        <HerbCard
          key={rank.badge}
          herbName={herbNames[i]}
          rank={rank}
          expanded={expanded === i}
          onToggle={() => setExpanded((prev) => (prev === i ? -1 : i))}
        />
      ))}

      {/* ── Disclaimer ── */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerIcon}>⚕️</Text>
        <Text style={styles.disclaimerText}>
          AI-generated recommendations based on Ayurvedic data. Always consult a
          qualified Ayurvedic physician before starting any herbal treatment.
        </Text>
      </View>

      {/* ── Navigation ── */}
      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.8}
          style={styles.backBtn}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onRestart}
          activeOpacity={0.85}
          style={styles.restartBtn}
        >
          <Text style={styles.restartBtnText}>🔄 New Assessment</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  content: { padding: 20, paddingBottom: 48 },

  // Error full screen
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: T.bg,
  },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: T.inkDark,
    marginBottom: 8,
  },
  errorMsg: {
    fontSize: 14,
    color: T.inkLight,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: T.leaf,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  retryBtnText: { color: T.white, fontWeight: "700", fontSize: 15 },

  // Header
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
    letterSpacing: 0.3,
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

  // Banner
  banner: {
    backgroundColor: T.leaf,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  bannerIcon: { fontSize: 20, marginTop: 1 },
  bannerTitle: {
    color: T.white,
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 3,
  },
  bannerSub: { color: T.borderGreen, fontSize: 12, lineHeight: 18 },

  // Card shell
  card: {
    backgroundColor: T.white,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardStripe: { height: 4 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: T.white, fontSize: 11, fontWeight: "800" },
  rankIcon: { fontSize: 20 },
  sinhalaName: { fontSize: 17, fontWeight: "800", letterSpacing: 0.3 },
  englishName: { fontSize: 11, color: T.inkLight, marginTop: 1 },
  chevron: { fontSize: 11, color: T.inkLight },

  // Loading / error inside card
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 20,
  },
  loadingText: { fontSize: 13, color: T.inkLight, fontStyle: "italic" },
  errBox: { padding: 16 },
  errText: { fontSize: 13, color: "#c53030" },

  // Card expanded body
  herbImage: { width: "100%", height: 190 },
  cardBody: { padding: 18 },

  sanskritLabel: {
    fontSize: 12,
    color: T.inkLight,
    fontStyle: "italic",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  benefitBox: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  benefitText: { fontSize: 13, lineHeight: 20, fontWeight: "500" },

  formPill: {
    alignSelf: "flex-start",
    backgroundColor: T.cream,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: T.border,
  },
  formPillText: { fontSize: 12, color: T.inkMid, fontWeight: "600" },

  divider: { height: 1, backgroundColor: T.border, marginVertical: 16 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: T.inkDark,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  whenBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 10,
  },
  whenText: { fontSize: 14, fontWeight: "700" },
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
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNum: { color: T.white, fontSize: 12, fontWeight: "800" },
  stepText: { flex: 1, fontSize: 13, color: T.inkMid, lineHeight: 20 },

  dosageRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  dosageIcon: { fontSize: 22 },
  dosageLabel: {
    fontSize: 12,
    color: T.inkLight,
    fontWeight: "600",
    marginBottom: 3,
  },
  dosageValue: { fontSize: 14, fontWeight: "700", color: T.inkDark },

  // Disclaimer
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

  // Navigation
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
