import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MedicineStep3Props {
  form: any;
  update: (key: string, value: string) => void;
  onBack: () => void;
  onPredict: () => void;
}

type Severity = "none" | "mild" | "severe";

type Symptom = {
  label: string;
  max: number;
};

type Category = {
  /** Must match the key used in the parent form state (ama, mucus, dryness, heat, pain) */
  key: string;
  label: string;
  icon: string;
  symptoms: Symptom[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  deepForest: "#1a3d1f",
  forest: "#2d6a35",
  midForest: "#3d8b47",
  softGreen: "#e8f3e9",
  mintLeaf: "#c8e6ca",
  white: "#ffffff",
  textDark: "#1c2b1e",
  textMid: "#4a6050",
  textLight: "#7a9880",
  border: "#b8d9bc",
  scoreBar: "#d0ebd3",
};

/**
 * Severity → fraction of a symptom's max value.
 * none=0, mild=0.5×max, severe=1×max
 */
const SEVERITY_FRACTION: Record<Severity, number> = {
  none: 0,
  mild: 0.5,
  severe: 1,
};

const SEVERITY_OPTIONS: { value: Severity; label: string; emoji: string }[] = [
  { value: "none", label: "None", emoji: "○" },
  { value: "mild", label: "Mild", emoji: "◑" },
  { value: "severe", label: "Severe", emoji: "●" },
];

/**
 * CATEGORIES — keys must exactly match the parent FormState keys:
 *   ama | mucus | dryness | heat | pain
 *
 * Normalization per category:
 *   raw     = Σ (SEVERITY_FRACTION[severity] × symptom.max)
 *   maxRaw  = Σ symptom.max
 *   score   = (raw / maxRaw) × 10
 */
const CATEGORIES: Category[] = [
  {
    key: "ama",
    label: "Ama",
    icon: "🫁",
    symptoms: [
      { label: "Coated tongue", max: 3 },
      { label: "Digestive heaviness", max: 3 },
      { label: "Tired after eating", max: 3 },
      { label: "Bad breath through the day", max: 2 },
    ],
    // maxRaw = 11 → severe all = 10.00
  },
  {
    key: "mucus",
    label: "Mucus",
    icon: "🌬️",
    symptoms: [
      { label: "Nasal congestion", max: 3 },
      { label: "Chest heaviness", max: 3 },
    ],
    // maxRaw = 6
  },
  {
    key: "dryness",
    label: "Dryness",
    icon: "🍂",
    symptoms: [
      { label: "Dry skin", max: 3 },
      { label: "Dry cough", max: 3 },
    ],
    // maxRaw = 6
  },
  {
    key: "heat",
    label: "Heat",
    icon: "🔥",
    symptoms: [
      { label: "Burning sensation", max: 4 },
      { label: "Acidity", max: 3 },
    ],
    // maxRaw = 7
  },
  {
    key: "pain",
    label: "Pain",
    icon: "⚡",
    symptoms: [
      { label: "Pain intensity", max: 5 },
      { label: "Stiffness", max: 3 },
    ],
    // maxRaw = 8
  },
];

// ─── Score computation ────────────────────────────────────────────────────────

/**
 * Returns a normalized 0–10 score (2 decimal places) for a category.
 * values.length must equal symptoms.length.
 */
const computeScore = (symptoms: Symptom[], values: Severity[]): string => {
  const raw = symptoms.reduce(
    (sum, s, i) => sum + SEVERITY_FRACTION[values[i] ?? "none"] * s.max,
    0
  );
  const maxRaw = symptoms.reduce((sum, s) => sum + s.max, 0);
  if (maxRaw === 0) return "0.00";
  return ((raw / maxRaw) * 10).toFixed(2);
};

// ─── SeverityPicker ───────────────────────────────────────────────────────────

const SeverityPicker = ({
  symptom,
  selected,
  onSelect,
}: {
  symptom: Symptom;
  selected: Severity;
  onSelect: (v: Severity) => void;
}) => (
  <View style={{ marginBottom: 20 }}>
    <Text
      style={{
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textDark,
        marginBottom: 10,
      }}
    >
      {symptom.label}
    </Text>

    <View style={{ flexDirection: "row", gap: 8 }}>
      {SEVERITY_OPTIONS.map(({ value, label, emoji }) => {
        const active = selected === value;
        const bg =
          active && value === "none"
            ? COLORS.midForest
            : active && value === "mild"
            ? "#c8860a"
            : active && value === "severe"
            ? "#a93226"
            : COLORS.softGreen;

        return (
          <TouchableOpacity
            key={value}
            onPress={() => onSelect(value)}
            activeOpacity={0.75}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: bg,
              borderWidth: active ? 0 : 1.5,
              borderColor: COLORS.border,
              alignItems: "center",
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 16 }}>{emoji}</Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: active ? COLORS.white : COLORS.textMid,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// ─── CategoryCard ─────────────────────────────────────────────────────────────

const CategoryCard = ({
  category,
  isOpen,
  score,
  values,
  onToggle,
  onSelect,
}: {
  category: Category;
  isOpen: boolean;
  score: string;
  values: Severity[];
  onToggle: () => void;
  onSelect: (index: number, v: Severity) => void;
}) => {
  const isDone = values.some((v) => v !== "none");
  const scoreNum = parseFloat(score);
  const barColor =
    scoreNum < 3.5 ? COLORS.midForest : scoreNum < 6.5 ? "#c8860a" : "#a93226";

  return (
    <View
      style={{
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: isOpen ? COLORS.forest : COLORS.border,
        backgroundColor: COLORS.white,
        marginBottom: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          backgroundColor: isOpen ? COLORS.softGreen : COLORS.white,
        }}
      >
        <Text style={{ fontSize: 24, marginRight: 12 }}>{category.icon}</Text>

        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 15, fontWeight: "800", color: COLORS.deepForest }}
          >
            {category.label}
          </Text>
          <Text style={{ fontSize: 11, color: COLORS.textLight, marginTop: 2 }}>
            {category.symptoms.map((s) => s.label).join(" · ")}
          </Text>
        </View>

        {/* Score pill shown when collapsed and at least one answer given */}
        {!isOpen && isDone && (
          <View
            style={{
              backgroundColor: COLORS.mintLeaf,
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 4,
              marginRight: 10,
            }}
          >
            <Text
              style={{ fontSize: 12, fontWeight: "700", color: COLORS.deepForest }}
            >
              {score}
            </Text>
          </View>
        )}

        <Text style={{ fontSize: 12, color: COLORS.forest }}>
          {isOpen ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>

      {/* Expanded body */}
      {isOpen && (
        <View
          style={{
            padding: 18,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
          }}
        >
          {category.symptoms.map((symptom, i) => (
            <SeverityPicker
              key={symptom.label}
              symptom={symptom}
              selected={values[i] ?? "none"}
              onSelect={(v) => onSelect(i, v)}
            />
          ))}

          {/* Live score bar */}
          <View
            style={{
              backgroundColor: COLORS.softGreen,
              borderRadius: 10,
              padding: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <Text
                style={{ fontSize: 12, color: COLORS.textMid, fontWeight: "600" }}
              >
                {category.label} Score
              </Text>
              <Text
                style={{ fontSize: 13, fontWeight: "800", color: COLORS.deepForest }}
              >
                {score}
                <Text style={{ fontWeight: "400", color: COLORS.textLight }}>
                  {" "}/ 10
                </Text>
              </Text>
            </View>
            <View
              style={{
                height: 7,
                backgroundColor: COLORS.scoreBar,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${Math.min(scoreNum * 10, 100)}%`,
                  height: "100%",
                  backgroundColor: barColor,
                  borderRadius: 4,
                }}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MedicineStep3({
  form,
  update,
  onBack,
  onPredict,
}: MedicineStep3Props) {
  const [openCategory, setOpenCategory] = useState<string>("ama");

  // Severity[] per category — index matches category.symptoms index
  const [allValues, setAllValues] = useState<Record<string, Severity[]>>(() =>
    Object.fromEntries(
      CATEGORIES.map((cat) => [
        cat.key,
        cat.symptoms.map((): Severity => "none"),
      ])
    )
  );

  /**
   * Whenever any severity changes, recompute ALL category scores and push
   * them into the parent form so predictHerbs always has fresh values.
   */
  useEffect(() => {
    CATEGORIES.forEach((cat) => {
      const score = computeScore(cat.symptoms, allValues[cat.key]);
      update(cat.key, score);
    });
  }, [allValues]);

  const handleSelect = (categoryKey: string, index: number, value: Severity) => {
    setAllValues((prev) => {
      const updated = [...prev[categoryKey]];
      updated[index] = value;
      return { ...prev, [categoryKey]: updated };
    });
  };

  const getScore = (cat: Category) =>
    computeScore(cat.symptoms, allValues[cat.key]);

  const completedCount = CATEGORIES.filter((cat) =>
    allValues[cat.key].some((v) => v !== "none")
  ).length;

  return (
    <View>
      {/* Instruction banner */}
      <View
        style={{
          backgroundColor: COLORS.deepForest,
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 20 }}>📋</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: COLORS.white,
              fontWeight: "700",
              fontSize: 14,
              marginBottom: 3,
            }}
          >
            Rate your symptoms
          </Text>
          <Text style={{ color: COLORS.mintLeaf, fontSize: 12, lineHeight: 18 }}>
            Tap each category and select None, Mild, or Severe for each
            symptom. Scores are calculated automatically.
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 16,
          gap: 8,
        }}
      >
        <View style={{ flex: 1, flexDirection: "row", gap: 4 }}>
          {CATEGORIES.map((cat) => (
            <View
              key={cat.key}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: allValues[cat.key].some((v) => v !== "none")
                  ? COLORS.forest
                  : COLORS.scoreBar,
              }}
            />
          ))}
        </View>
        <Text style={{ fontSize: 11, color: COLORS.textLight }}>
          {completedCount}/{CATEGORIES.length}
        </Text>
      </View>

      {/* Accordion */}
      {CATEGORIES.map((cat) => (
        <CategoryCard
          key={cat.key}
          category={cat}
          isOpen={openCategory === cat.key}
          score={getScore(cat)}
          values={allValues[cat.key]}
          onToggle={() =>
            setOpenCategory((prev) => (prev === cat.key ? "" : cat.key))
          }
          onSelect={(idx, v) => handleSelect(cat.key, idx, v)}
        />
      ))}

      {/* Navigation */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.8}
          style={{
            flex: 1,
            backgroundColor: COLORS.mintLeaf,
            paddingVertical: 15,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: COLORS.deepForest, fontWeight: "700", fontSize: 15 }}
          >
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPredict}
          activeOpacity={0.8}
          style={{
            flex: 1,
            backgroundColor: COLORS.deepForest,
            paddingVertical: 15,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: COLORS.white, fontWeight: "700", fontSize: 15 }}>
            Predict Herbs
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
