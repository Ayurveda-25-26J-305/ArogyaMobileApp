import { authService, userService } from "@/services/supabase";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MedicineForm } from "../utils/medicinep";

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  leaf: "#22543d",
  leafMid: "#276749",
  sage: "#48bb78",
  sagePale: "#d4edda",
  gold: "#b7791f",
  goldPale: "#fefcbf",
  parchment: "#faf7f0",
  inkDark: "#1a202c",
  inkMid: "#2d3748",
  inkLight: "#718096",
  border: "#e2e8f0",
  borderGreen: "#9ae6b4",
  white: "#ffffff",
  bg: "#f1f8e9",
  redSoft: "#fc8181",
  blueSoft: "#90cdf4",
  amber: "#f6ad55",
};

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface MedicineStep2Props {
  form: MedicineForm;
  update: (key: keyof MedicineForm, value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

type AgniKey = "Sama Agni" | "Vishama Agni" | "Tikshna Agni" | "Manda Agni";

type AgniOption = {
  key: AgniKey;
  label: string;
  sanskrit: string;
  icon: string;
  dosha: string;
  color: string;
  bgColor: string;
  description: string;
  signs: string[];
};

// ─── AGNI DATA ────────────────────────────────────────────────────────────────
const AGNI_OPTIONS: AgniOption[] = [
  {
    key: "Sama Agni",
    label: "සම අග්නි",
    sanskrit: "Sama Agni",
    icon: "⚖️",
    dosha: "Balanced",
    color: T.leaf,
    bgColor: T.sagePale,
    description: "I get hungry at normal times and food digests well.",
    signs: [
      "Regular appetite",
      "No bloating",
      "Steady energy",
      "Good elimination",
    ],
  },
  {
    key: "Vishama Agni",
    label: "විෂම අග්නි",
    sanskrit: "Vishama Agni",
    icon: "💨",
    dosha: "",
    color: "#5a67d8",
    bgColor: "#ebf4ff",
    description:
      "Some days I digest anything, other days even light food feels heavy",
    signs: [
      "Irregular hunger",
      "Gas & bloating",
      "Constipation",
      "Anxiety after meals",
    ],
  },
  {
    key: "Tikshna Agni",
    label: "තික්ෂ්ණ අග්නි",
    sanskrit: "Tikshna Agni",
    icon: "🔥",
    dosha: "",
    color: "#c05621",
    bgColor: "#fffaf0",
    description: "If I don’t eat on time, I get angry or weak quickly.",
    signs: [
      "Strong appetite",
      "Acid reflux",
      "Burning sensation",
      "Irritability after meals",
    ],
  },
  {
    key: "Manda Agni",
    label: "මන්ද අග්නි",
    sanskrit: "manda agni",
    icon: "🌊",
    dosha: "",
    color: "#2c7a7b",
    bgColor: "#e6fffa",
    description: "Even small meals sit heavily for hours.",
    signs: [
      "Slow hunger",
      "Heaviness after meals",
      "Lethargy",
      "Weight gain tendency",
    ],
  },
];

// ─── DOSHA BAR ────────────────────────────────────────────────────────────────
function DoshaBar({
  label,
  icon,
  value,
  max = 10,
  color,
}: {
  label: string;
  icon: string;
  value: number;
  max?: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const displayValue = value.toFixed(1);

  return (
    <View style={doshaStyles.row}>
      <View style={doshaStyles.labelRow}>
        <Text style={doshaStyles.icon}>{icon}</Text>
        <Text style={doshaStyles.label}>{label}</Text>
        <Text style={[doshaStyles.score, { color }]}>{displayValue}</Text>
      </View>
      <View style={doshaStyles.track}>
        <View
          style={[
            doshaStyles.fill,
            { width: `${pct}%` as any, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const doshaStyles = StyleSheet.create({
  row: { marginBottom: 14 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  icon: { fontSize: 16 },
  label: { flex: 1, fontSize: 13, fontWeight: "600", color: "#2d3748" },
  score: { fontSize: 14, fontWeight: "800" },
  track: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 4 },
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function MedicineStep2({
  form,
  update,
  onBack,
  onNext,
}: MedicineStep2Props) {
  const [expanded, setExpanded] = useState<AgniKey | null>(null);
  const [doshaLoading, setDoshaLoading] = useState(false);
  const [doshaError, setDoshaError] = useState<string | null>(null);
  const [doshaScores, setDoshaScores] = useState<{
    vata: number;
    pitta: number;
    kapha: number;
  } | null>(null);

  // Fetch dosha scores when disease or gender changes
  useEffect(() => {
    if (!form.disease) return;

    const fetchDosha = async () => {
      setDoshaLoading(true);
      setDoshaError(null);
      try {
        const currentUser = await authService.currentUser();
        if (!currentUser) throw new Error("Not logged in");

        const prakriti = await userService.getPrakriti(currentUser.id);
        if (!prakriti) throw new Error("No dosha data found");

        const vata = parseFloat(prakriti.vata) * 10;
        const pitta = parseFloat(prakriti.pitta) * 10;
        const kapha = parseFloat(prakriti.kapha) * 10;

        setDoshaScores({ vata, pitta, kapha });
        update("vata", String(vata));
        update("pitta", String(pitta));
        update("kapha", String(kapha));
      } catch {
        setDoshaError("Could not fetch dosha scores. Using defaults.");
        setDoshaScores({ vata: 5, pitta: 5, kapha: 5 });
        update("vata", "5");
        update("pitta", "5");
        update("kapha", "5");
      } finally {
        setDoshaLoading(false);
      }
    };

    fetchDosha();
  }, [form.disease]);

  const selectedAgni = form.agni as AgniKey | "";

  const handleSelectAgni = (key: AgniKey) => {
    update("agni", key);
    setExpanded((prev) => (prev === key ? null : key));
  };

  const isValid = !!selectedAgni;

  return (
    <View>
      {/* ── Agni Card ── */}
      <View style={styles.card}>
        <View style={styles.cardAccent} />
        <View style={styles.cardBody}>
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionIcon}>🔥</Text>
            <View>
              <Text style={styles.sectionText}>Agni — Digestive Fire</Text>
              <Text style={styles.sectionSub}>
                Tap a type to learn more and select
              </Text>
            </View>
          </View>

          {AGNI_OPTIONS.map((opt) => {
            const selected = selectedAgni === opt.key;
            const open = expanded === opt.key;

            return (
              <View key={opt.key} style={{ marginBottom: 10 }}>
                {/* Row */}
                <TouchableOpacity
                  onPress={() => handleSelectAgni(opt.key)}
                  activeOpacity={0.8}
                  style={[
                    styles.agniRow,
                    selected && {
                      backgroundColor: opt.bgColor,
                      borderColor: opt.color,
                    },
                  ]}
                >
                  {/* Indicator */}
                  <View
                    style={[
                      styles.agniIndicator,
                      {
                        backgroundColor: selected ? opt.color : T.border,
                      },
                    ]}
                  />

                  <Text style={styles.agniIcon}>{opt.icon}</Text>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.agniLabel,
                        selected && { color: opt.color },
                      ]}
                    >
                      {opt.sanskrit}
                    </Text>
                    <Text style={styles.agniSublabel}>
                      {opt.label} · {opt.dosha}
                    </Text>
                  </View>

                  <Text style={[styles.chevron, { color: opt.color }]}>
                    {open ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>

                {/* Expanded detail */}
                {open && (
                  <View
                    style={[
                      styles.agniDetail,
                      { borderColor: opt.color, backgroundColor: opt.bgColor },
                    ]}
                  >
                    <Text
                      style={[styles.agniDescription, { color: opt.color }]}
                    >
                      {opt.description}
                    </Text>
                    <View style={styles.signsList}>
                      {opt.signs.map((sign) => (
                        <View key={sign} style={styles.signRow}>
                          <Text style={[styles.signDot, { color: opt.color }]}>
                            •
                          </Text>
                          <Text style={styles.signText}>{sign}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Dosha Scores Card ── */}
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: "#b7791f" }]} />
        <View style={styles.cardBody}>
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionIcon}></Text>
            <View>
              <Text style={styles.sectionText}>Your Dosha Profile</Text>
              <Text style={styles.sectionSub}>
                Based on your condition:{" "}
                <Text style={{ fontWeight: "700", color: T.leaf }}>
                  {form.disease || "—"}
                </Text>
              </Text>
            </View>
          </View>

          {doshaLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={T.leaf} />
              <Text style={styles.loadingText}>Fetching dosha scores…</Text>
            </View>
          ) : doshaError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {doshaError}</Text>
            </View>
          ) : doshaScores ? (
            <View>
              <DoshaBar
                label="Vata"
                icon=""
                value={doshaScores.vata}
                color="#2c7a7b"
              />
              <DoshaBar
                label="Pitta"
                icon=""
                value={doshaScores.pitta}
                color="#2c7a7b"
              />
              <DoshaBar
                label="Kapha"
                icon=""
                value={doshaScores.kapha}
                color="#2c7a7b"
              />
              <View style={styles.infoNote}>
                <Text style={styles.infoNoteText}>
                  These scores reflect typical Ayurvedic dosha imbalances
                  associated with your condition
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.loadingText}>Select a condition first</Text>
          )}
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.8}
          style={styles.backBtn}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNext}
          activeOpacity={0.85}
          disabled={!isValid}
          style={[styles.nextBtn, !isValid && styles.nextBtnDisabled]}
        >
          <Text style={styles.nextBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: T.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAccent: {
    height: 4,
    backgroundColor: T.leaf,
  },
  cardBody: {
    padding: 20,
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 18,
  },
  sectionIcon: { fontSize: 22, marginTop: 1 },
  sectionText: {
    fontSize: 16,
    fontWeight: "700",
    color: T.inkDark,
    letterSpacing: 0.3,
  },
  sectionSub: {
    fontSize: 12,
    color: T.inkLight,
    marginTop: 2,
  },
  agniRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.bg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: T.border,
    padding: 14,
    gap: 10,
  },
  agniIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  agniIcon: { fontSize: 22 },
  agniLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: T.inkDark,
  },
  agniSublabel: {
    fontSize: 11,
    color: T.inkLight,
    marginTop: 2,
  },
  chevron: {
    fontSize: 11,
    color: T.inkLight,
  },
  agniDetail: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 14,
    marginTop: -4,
  },
  agniDescription: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
    marginBottom: 10,
  },
  signsList: { gap: 6 },
  signRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  signDot: { fontSize: 14, lineHeight: 20 },
  signText: { fontSize: 12, color: T.inkMid, lineHeight: 20, flex: 1 },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 13,
    color: T.inkLight,
    fontStyle: "italic",
  },
  errorBox: {
    backgroundColor: "#fff5f5",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fed7d7",
  },
  errorText: {
    fontSize: 13,
    color: "#c53030",
  },
  infoNote: {
    marginTop: 12,
    backgroundColor: T.sagePale,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: T.borderGreen,
  },
  infoNoteText: {
    fontSize: 12,
    color: T.leafMid,
    lineHeight: 18,
  },
  navRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  backBtn: {
    flex: 1,
    backgroundColor: T.sagePale,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: T.borderGreen,
  },
  backBtnText: {
    color: T.leaf,
    fontWeight: "700",
    fontSize: 15,
  },
  nextBtn: {
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
  nextBtnDisabled: {
    backgroundColor: "#a0b5a3",
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    color: T.white,
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
