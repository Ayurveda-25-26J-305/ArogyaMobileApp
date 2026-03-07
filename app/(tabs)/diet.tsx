import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  leaf:        "#22543d",
  leafMid:     "#276749",
  sage:        "#48bb78",
  sagePale:    "#d4edda",
  gold:        "#b7791f",
  goldPale:    "#fefcbf",
  parchment:   "#faf7f0",
  cream:       "#fffff0",
  bark:        "#744210",
  inkDark:     "#1a202c",
  inkMid:      "#2d3748",
  inkLight:    "#718096",
  border:      "#e2e8f0",
  borderGreen: "#9ae6b4",
  white:       "#ffffff",
  redSoft:     "#fc8181",
  redPale:     "#fff5f5",
  errorRed:    "#c53030",
  bg:          "#f1f8e9",
};

// ─── BMI-ADJUSTED GRAM CALCULATION ───────────────────────────────────────────
function calcBMIAdjustedMealGrams({
  age, gender, weight_kg, height_cm, bmiCategory, mealCategory, mealCalories,
}: {
  age: number; gender: string; weight_kg: number; height_cm: number;
  bmiCategory: string; mealCategory: string; mealCalories: number;
}): number {
  const bmr =
    gender.toLowerCase() === "male"
      ? 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
      : 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;

  const tdee = bmr * 1.2;
  const adj: Record<string, number> = { underweight: 1.15, normal: 1.0, overweight: 0.9, obese: 0.8 };
  const adjustedTDEE = tdee * (adj[bmiCategory?.toLowerCase()] ?? 1.0);
  const fractions: Record<string, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.3 };
  const budget = adjustedTDEE * (fractions[mealCategory?.toLowerCase()] ?? 0.3);
  const kcalPerGram = mealCalories > 0 ? mealCalories / 500 : 1.0;
  return Math.min(Math.max(Math.round(budget / kcalPerGram), 150), 1200);
}

function portionToGrams(pct: number, totalGrams: number): number {
  return Math.round((pct / 100) * totalGrams);
}

function cleanDishName(name: string): string {
  return name.replace(/\s*\(.*?\)\s*/g, "").trim();
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
type FormData = {
  age: string; gender: string; weight: string; height: string;
  disease: string; mealCategory: string; foodPreference: string;
};

type MealItem = { dish: string; portion_pct: number };

type ResultData = {
  user_bmi: number;
  predicted_bmi_category: string;
  meal_category: string;
  diet_preference: string;
  disease: string;
  foods_to_avoid: string;
  meal_plan: MealItem[];
  totals: { calories_kcal: number; protein_g: number; carbs_g: number; fats_g: number };
};

// ─── SELECT OPTIONS ───────────────────────────────────────────────────────────
const DISEASES   = ["diabetes", "migraine", "arthritis", "asthma", "gastritis", "hypertension", "obesity"];
const MEALS      = ["breakfast", "lunch", "dinner"];
const PREFS      = ["veg", "non-veg"];
const GENDERS    = ["male", "female"];
const ALL_RASAS  = ["sweet", "sour", "salty", "pungent", "bitter", "astringent"];

const rasaLabel: Record<string, string> = {
  sweet: "Sweet (Madhura)", sour: "Sour (Amla)", salty: "Salty (Lavana)",
  pungent: "Pungent (Katu)", bitter: "Bitter (Tikta)", astringent: "Astringent (Kashaya)",
};

// Taste matching (same logic as web)
function tasteToKey(taste: string): string {
  const x = taste.toLowerCase();
  if (x.includes("sweet"))      return "sweet";
  if (x.includes("sour"))       return "sour";
  if (x.includes("salty"))      return "salty";
  if (x.includes("pungent"))    return "pungent";
  if (x.includes("bitter"))     return "bitter";
  if (x.includes("astringent")) return "astringent";
  return "unknown";
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

function SectionLabel({ icon, children }: { icon: string; children: string }) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionLabelIcon}>{icon}</Text>
      <Text style={styles.sectionLabelText}>{children}</Text>
    </View>
  );
}

function CardShell({ children, accentColor = T.leaf }: { children: React.ReactNode; accentColor?: string }) {
  return (
    <View style={styles.cardShell}>
      <View style={[styles.cardAccentBar, { backgroundColor: accentColor }]} />
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function SelectPill({
  label, value, options, onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
        <View style={styles.pillRow}>
          {options.map((opt) => {
            const selected = value === opt;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => onChange(opt)}
                style={[styles.pill, selected && styles.pillSelected]}
              >
                <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function InputField({
  label, value, onChange, keyboardType = "default", placeholder = "",
}: { label: string; value: string; onChange: (v: string) => void; keyboardType?: any; placeholder?: string }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={T.inkLight}
      />
    </View>
  );
}

// Step indicator dots
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.stepDots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < current ? styles.dotDone : i === current ? styles.dotActive : styles.dotIdle,
          ]}
        />
      ))}
    </View>
  );
}

// Table header row
function TableHeader({ cols }: { cols: string[] }) {
  return (
    <View style={styles.tableHeader}>
      {cols.map((c) => (
        <Text key={c} style={[styles.tableHeaderText, c === "Dish" || c === "Taste" ? { flex: 2 } : { flex: 1 }]}>{c}</Text>
      ))}
    </View>
  );
}

// Gram pill
function GramPill({ grams }: { grams: number }) {
  return (
    <View style={styles.gramPill}>
      <Text style={styles.gramPillText}>{grams} g</Text>
    </View>
  );
}

// Portion bar
function PortionBar({ pct }: { pct: number }) {
  return (
    <View style={styles.portionBarTrack}>
      <View style={[styles.portionBarFill, { width: `${Math.min(100, pct)}%` as any }]} />
    </View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function DietScreen() {
  const [step, setStep]               = useState(0);
  const [formData, setFormData]       = useState<FormData>({ age:"", gender:"", weight:"", height:"", disease:"", mealCategory:"", foodPreference:"" });
  const [result, setResult]           = useState<ResultData | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const set = (key: keyof FormData) => (val: string) => {
    setFormData((f) => ({ ...f, [key]: val }));
    setError(null);
  };

  const totalMealGrams = result
    ? calcBMIAdjustedMealGrams({
        age: parseFloat(formData.age) || 25,
        gender: formData.gender || "female",
        weight_kg: parseFloat(formData.weight) || 60,
        height_cm: parseFloat(formData.height) || 165,
        bmiCategory: result.predicted_bmi_category || "normal",
        mealCategory: result.meal_category || "lunch",
        mealCalories: result.totals?.calories_kcal || 500,
      })
    : 500;

  // Shad Rasa grouping — without CSV on mobile, we attempt simple taste matching
  // by checking dish names against common taste keywords; falls back to "unknown"
  const rasaGrouped = (() => {
    const g: Record<string, MealItem[]> = { sweet:[], sour:[], salty:[], pungent:[], bitter:[], astringent:[], unknown:[] };
    (result?.meal_plan ?? []).forEach((item) => {
      // Simple keyword match on dish name — matches common dataset patterns
      const name = item.dish.toLowerCase();
      let matched = "unknown";
      if (name.includes("sweet") || name.includes("halwa") || name.includes("kheer") || name.includes("ladoo") || name.includes("payasam")) matched = "sweet";
      else if (name.includes("tamarind") || name.includes("lemon") || name.includes("curd") || name.includes("pickle") || name.includes("amla")) matched = "sour";
      else if (name.includes("salt") || name.includes("pickle") || name.includes("papad")) matched = "salty";
      else if (name.includes("pepper") || name.includes("chilli") || name.includes("ginger") || name.includes("garlic") || name.includes("mustard")) matched = "pungent";
      else if (name.includes("bitter") || name.includes("fenugreek") || name.includes("karela") || name.includes("neem")) matched = "bitter";
      else if (name.includes("astringent") || name.includes("lentil") || name.includes("chickpea") || name.includes("green banana")) matched = "astringent";
      g[matched].push(item);
    });
    return g;
  })();

  // Step validation
  const stepValid = [
    () => !!formData.age && !!formData.gender && !!formData.weight && !!formData.height,
    () => !!formData.disease,
    () => !!formData.mealCategory && !!formData.foodPreference,
    () => true,
  ];

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        age: parseInt(formData.age),
        gender: formData.gender.toLowerCase(),
        weight_kg: parseFloat(formData.weight),
        height_cm: parseFloat(formData.height),
        disease: formData.disease.toLowerCase(),
        meal_category: formData.mealCategory.toLowerCase(),
        diet_preference: formData.foodPreference.toLowerCase(),
      };
      const response = await fetch("http://localhost:5001/api/diet/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        setResult({
          user_bmi: data.user_info.bmi,
          predicted_bmi_category: data.user_info.bmi_category,
          meal_category: data.meal_info.meal_category,
          diet_preference: data.meal_info.diet_preference,
          disease: data.meal_info.disease,
          foods_to_avoid: data.foods_to_avoid,
          meal_plan: data.meal_plan.map((d: any) => ({
            dish: cleanDishName(d.dish),
            portion_pct: d.portion_percent,
          })),
          totals: {
            calories_kcal: data.nutrition.total_calories_kcal,
            protein_g: data.nutrition.protein_g,
            carbs_g: data.nutrition.carbs_g,
            fats_g: data.nutrition.fats_g,
          },
        });
        setStep(4); // results screen
      } else {
        setError(data.error || "Failed to generate meal plan.");
      }
    } catch {
      setError("Could not connect to the diet planning service. Make sure Flask API is running on port 5001.");
    } finally {
      setLoading(false);
    }
  }, [formData]);

  const handleNext = () => {
    if (!stepValid[step]()) { setError("Please fill all required fields."); return; }
    setError(null);
    if (step === 3) { handleGenerate(); return; }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    if (step === 4) { setStep(3); setResult(null); return; }
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleReset = () => {
    setFormData({ age:"", gender:"", weight:"", height:"", disease:"", mealCategory:"", foodPreference:"" });
    setResult(null); setError(null); setStep(0);
  };

  const bmiCat = (result?.predicted_bmi_category || "").toLowerCase();
  const bmiColor = bmiCat === "normal" ? T.sage : bmiCat === "underweight" ? "#d69e2e" : bmiCat === "overweight" ? "#ed8936" : T.errorRed;

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerIconRing}>
          <Ionicons name="restaurant" size={40} color={T.leaf} />
        </View>
        <Text style={styles.headerTitle}>Ayurvedic Meal Planner</Text>
        <Text style={styles.headerSub}>AI-assisted dietary guidance based on Ayurvedic principles</Text>
      </View>

      {/* ── Error banner ── */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={T.errorRed} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ══════════════════════════════════════
          STEP 0 — Personal & Measurements
      ══════════════════════════════════════ */}
      {step === 0 && (
        <CardShell>
          <SectionLabel icon="🧍">Personal & Measurements</SectionLabel>
          <InputField label="Age (years)" value={formData.age} onChange={set("age")} keyboardType="numeric" placeholder="e.g. 28" />
          <SelectPill label="Gender" value={formData.gender} options={GENDERS} onChange={set("gender")} />
          <InputField label="Weight (kg)" value={formData.weight} onChange={set("weight")} keyboardType="decimal-pad" placeholder="e.g. 65" />
          <InputField label="Height (cm)" value={formData.height} onChange={set("height")} keyboardType="decimal-pad" placeholder="e.g. 170" />
          <Text style={styles.fieldHint}>BMI will be calculated automatically after generating the meal plan.</Text>
        </CardShell>
      )}

      {/* ══════════════════════════════════════
          STEP 1 — Health Information
      ══════════════════════════════════════ */}
      {step === 1 && (
        <CardShell>
          <SectionLabel icon="🩺">Health Information</SectionLabel>
          <SelectPill label="Health Condition" value={formData.disease} options={DISEASES} onChange={set("disease")} />
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#2b6cb0" />
            <Text style={styles.infoBoxText}>Foods to avoid will be generated based on your condition.</Text>
          </View>
        </CardShell>
      )}

      {/* ══════════════════════════════════════
          STEP 2 — Meal Preferences
      ══════════════════════════════════════ */}
      {step === 2 && (
        <CardShell accentColor={T.gold}>
          <SectionLabel icon="🍽️">Meal Preferences</SectionLabel>
          <SelectPill label="Meal Category" value={formData.mealCategory} options={MEALS} onChange={set("mealCategory")} />
          <SelectPill label="Food Preference" value={formData.foodPreference} options={PREFS} onChange={set("foodPreference")} />
          <View style={[styles.infoBox, { backgroundColor: "#f0fff4", borderColor: T.borderGreen }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color={T.leaf} />
            <Text style={[styles.infoBoxText, { color: T.leafMid }]}>Output: Full meal + Portion % + Nutrients</Text>
          </View>
        </CardShell>
      )}

      {/* ══════════════════════════════════════
          STEP 3 — Review
      ══════════════════════════════════════ */}
      {step === 3 && (
        <View style={styles.cardShell}>
          {/* Gradient-ish stripe */}
          <View style={[styles.cardAccentBar, { backgroundColor: T.leaf }]} />
          <View style={styles.cardBody}>
            <View style={styles.reviewHeading}>
              <View style={styles.reviewAccentLine} />
              <Text style={styles.reviewTitle}>Review Your Inputs</Text>
              <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>Step 4 of 4</Text></View>
            </View>

            {/* Personal panel */}
            <View style={styles.reviewPanel}>
              <View style={styles.reviewPanelHeader}>
                <Ionicons name="person" size={14} color={T.leaf} />
                <Text style={styles.reviewPanelTitle}>PERSONAL</Text>
              </View>
              {[
                { label: "Age",    value: `${formData.age} years` },
                { label: "Gender", value: formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) },
                { label: "Weight", value: `${formData.weight} kg` },
                { label: "Height", value: `${formData.height} cm` },
              ].map((row) => (
                <View key={row.label} style={styles.reviewRow}>
                  <Text style={styles.reviewRowLabel}>{row.label}</Text>
                  <Text style={styles.reviewRowValue}>{row.value || "—"}</Text>
                </View>
              ))}
            </View>

            {/* Health & Meal panel */}
            <View style={[styles.reviewPanel, { marginTop: 10 }]}>
              <View style={styles.reviewPanelHeader}>
                <Ionicons name="medkit" size={14} color={T.leaf} />
                <Text style={styles.reviewPanelTitle}>HEALTH & MEAL</Text>
              </View>
              {[
                { label: "Condition", value: formData.disease.charAt(0).toUpperCase() + formData.disease.slice(1) },
                { label: "Meal",      value: formData.mealCategory.charAt(0).toUpperCase() + formData.mealCategory.slice(1) },
                { label: "Preference",value: formData.foodPreference === "veg" ? "🌿 Vegetarian" : "🍗 Non-Vegetarian" },
              ].map((row) => (
                <View key={row.label} style={styles.reviewRow}>
                  <Text style={styles.reviewRowLabel}>{row.label}</Text>
                  <Text style={styles.reviewRowValue}>{row.value || "—"}</Text>
                </View>
              ))}
            </View>

            <View style={styles.reviewFootnote}>
              <View style={styles.reviewFootnoteDot} />
              <Text style={styles.reviewFootnoteText}>Your Ayurvedic meal plan will be generated based on these inputs.</Text>
            </View>
          </View>
        </View>
      )}

      {/* ══════════════════════════════════════
          STEP 4 — Results
      ══════════════════════════════════════ */}
      {step === 4 && result && (
        <View>
          {/* Results heading */}
          <View style={styles.resultsHeading}>
            <View style={styles.resultsAccentBar} />
            <Text style={styles.resultsTitle}>🌿 Personalized Results</Text>
          </View>

          {/* ── BMI Card ── */}
          <CardShell accentColor={bmiColor}>
            <SectionLabel icon="📊">BMI Analysis</SectionLabel>
            <View style={styles.bmiRow}>
              <Text style={styles.bmiBig}>{result.user_bmi}</Text>
              <Text style={styles.bmiUnit}>kg/m²</Text>
            </View>
            <View style={[styles.bmiCategoryBadge, { borderColor: bmiColor }]}>
              <View style={[styles.bmiDot, { backgroundColor: bmiColor }]} />
              <Text style={[styles.bmiCategoryText, { color: bmiColor }]}>
                {result.predicted_bmi_category?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.mlNote}>
              <View style={[styles.bmiDot, { backgroundColor: T.sage }]} />
              <Text style={styles.mlNoteText}>Verified by ML classification model</Text>
            </View>
          </CardShell>

          {/* ── Foods to Avoid ── */}
          <CardShell accentColor={T.errorRed}>
            <SectionLabel icon="🚫">Foods to Avoid</SectionLabel>
            <View style={styles.avoidWrap}>
              {(result.foods_to_avoid ? String(result.foods_to_avoid).split(",") : []).map((f, i) => (
                <View key={i} style={styles.avoidPill}>
                  <Text style={styles.avoidPillText}>{f.trim()}</Text>
                </View>
              ))}
            </View>
          </CardShell>

          {/* ── Meal Plan ── */}
          <CardShell>
            <SectionLabel icon="🍽️">Recommended Meal Plan</SectionLabel>
            <TableHeader cols={["Dish", "Portion %", "Amount"]} />
            {result.meal_plan.map((item, i) => {
              const grams = portionToGrams(item.portion_pct, totalMealGrams);
              return (
                <View key={i} style={[styles.tableRow, i % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                  <View style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={styles.dotBullet} />
                    <Text style={styles.dishName}>{item.dish}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.portionPct}>{item.portion_pct}%</Text>
                    <PortionBar pct={item.portion_pct} />
                  </View>
                  <View style={{ flex: 1, alignItems: "flex-start" }}>
                    <GramPill grams={grams} />
                  </View>
                </View>
              );
            })}
            {/* Total row */}
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { flex: 2 }]}>Total</Text>
              <Text style={[styles.totalLabel, { flex: 1 }]}>100%</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.gramPillDark}>
                  <Text style={styles.gramPillDarkText}>{totalMealGrams} g</Text>
                </View>
              </View>
            </View>
            <Text style={styles.tableCaption}>
              Grams are BMI-adjusted via TDEE · Mifflin-St Jeor ({result.predicted_bmi_category}).
            </Text>
          </CardShell>

          {/* ── Nutrient Summary ── */}
          <CardShell accentColor={T.gold}>
            <SectionLabel icon="🧪">Nutrient Summary</SectionLabel>
            {[
              { label: "Calories", value: result.totals.calories_kcal, unit: "kcal", color: "#e53e3e" },
              { label: "Protein",  value: result.totals.protein_g,     unit: "g",    color: T.sage },
              { label: "Carbs",    value: result.totals.carbs_g,        unit: "g",    color: T.gold },
              { label: "Fats",     value: result.totals.fats_g,         unit: "g",    color: T.bark },
            ].map(({ label, value, unit, color }) => (
              <View key={label} style={styles.nutrientRow}>
                <View style={styles.nutrientLeft}>
                  <View style={[styles.nutrientDot, { backgroundColor: color }]} />
                  <Text style={styles.nutrientLabel}>{label}</Text>
                </View>
                <View style={styles.nutrientRight}>
                  <Text style={styles.nutrientValue}>{value ?? "—"}</Text>
                  <Text style={styles.nutrientUnit}> {unit}</Text>
                </View>
              </View>
            ))}

            <View style={styles.divider} />
            <Text style={styles.macroTitle}>Daily Macro Progress</Text>
            {[
              { label: "Protein",  value: result.totals.protein_g,     unit: "g",    max: 50,   color: T.sage },
              { label: "Carbs",    value: result.totals.carbs_g,        unit: "g",    max: 200,  color: T.gold },
              { label: "Calories", value: result.totals.calories_kcal, unit: "kcal", max: 2500, color: "#e53e3e" },
              { label: "Fats",     value: result.totals.fats_g,         unit: "g",    max: 70,   color: T.bark },
            ].map(({ label, value, unit, max, color }) => (
              <View key={label} style={styles.macroRow}>
                <View style={styles.macroRowTop}>
                  <Text style={styles.macroLabel}>{label}</Text>
                  <Text style={styles.macroValue}>{value ?? "—"} {unit}</Text>
                </View>
                <View style={styles.macroTrack}>
                  <View style={[styles.macroFill, { width: `${Math.min(100, Math.round(((value ?? 0) / max) * 100))}%` as any, backgroundColor: color }]} />
                </View>
              </View>
            ))}
          </CardShell>

          {/* ── Shad Rasa Table ── */}
          <CardShell>
            <SectionLabel icon="🌸">Ayurvedic Taste Separation — Shad Rasa</SectionLabel>
            <Text style={styles.rasaSubtitle}>The six tastes and their presence in your personalized meal plan.</Text>
            <TableHeader cols={["Taste", "Dish", "Portion %", "Amount"]} />
            {[...ALL_RASAS, "unknown"].flatMap((rasa) => {
              const items = rasaGrouped[rasa] ?? [];
              const label = rasa === "unknown" ? "Not Defined" : rasaLabel[rasa];
              if (items.length === 0) return [{ label, item: null as MealItem | null }];
              return items.map((item) => ({ label, item }));
            }).map(({ label, item }, i) => {
              const grams = item ? portionToGrams(item.portion_pct, totalMealGrams) : null;
              return (
                <View key={i} style={[styles.tableRow, i % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                  {/* Taste */}
                  <View style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={[styles.dotBullet, !item && { backgroundColor: T.border }]} />
                    <Text style={[styles.dishName, !item && { color: T.inkLight }]}>{label}</Text>
                  </View>
                  {/* Dish */}
                  <View style={{ flex: 2 }}>
                    {item
                      ? <Text style={styles.dishName}>{item.dish}</Text>
                      : <Text style={styles.noMatchText}>No dishes matched</Text>
                    }
                  </View>
                  {/* Portion */}
                  <View style={{ flex: 1 }}>
                    {item ? (
                      <>
                        <Text style={styles.portionPct}>{item.portion_pct}%</Text>
                        <PortionBar pct={item.portion_pct} />
                      </>
                    ) : null}
                  </View>
                  {/* Grams */}
                  <View style={{ flex: 1, alignItems: "flex-start" }}>
                    {item && grams !== null ? <GramPill grams={grams} /> : null}
                  </View>
                </View>
              );
            })}
          </CardShell>

          {/* ── Author card ── */}
          <View style={styles.authorCard}>
            <Ionicons name="person-circle" size={36} color={T.leafMid} />
            <View style={{ flex: 1 }}>
              <Text style={styles.authorName}>Dias W A N M</Text>
              <Text style={styles.authorId}>IT22899910</Text>
              <Text style={styles.authorModule}>Ayurvedic Dietary Recommendation Module</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Step dots (forms only) ── */}
      {step < 4 && <StepDots current={step} total={4} />}

      {/* ── Navigation buttons ── */}
      <View style={styles.navRow}>
        {step > 0 && (
          <TouchableOpacity style={styles.btnOutline} onPress={handleBack}>
            <Ionicons name="arrow-back" size={16} color={T.leaf} />
            <Text style={styles.btnOutlineText}>Back</Text>
          </TouchableOpacity>
        )}

        {step < 4 && (
          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={T.white} />
            ) : (
              <>
                <Text style={styles.btnPrimaryText}>{step === 3 ? "Generate Plan" : "Next"}</Text>
                <Ionicons name={step === 3 ? "sparkles" : "arrow-forward"} size={16} color={T.white} />
              </>
            )}
          </TouchableOpacity>
        )}

        {step === 4 && (
          <TouchableOpacity style={styles.btnOutline} onPress={handleReset}>
            <Ionicons name="refresh" size={16} color={T.leaf} />
            <Text style={styles.btnOutlineText}>Start Over</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.disclaimer}>
        For wellness guidance only. Consult a qualified Ayurvedic physician before making dietary changes.
      </Text>
    </ScrollView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: T.bg },
  screenContent:   { padding: 16, paddingBottom: 48 },

  // Header
  header:          { alignItems: "center", marginBottom: 20 },
  headerIconRing:  { width: 80, height: 80, borderRadius: 40, backgroundColor: "#e8f5e9", alignItems: "center", justifyContent: "center", marginBottom: 12, borderWidth: 2, borderColor: T.borderGreen },
  headerTitle:     { fontSize: 22, fontWeight: "800", color: T.leaf, textAlign: "center", letterSpacing: -0.3 },
  headerSub:       { fontSize: 13, color: T.inkLight, textAlign: "center", marginTop: 4, lineHeight: 18 },

  // Error
  errorBanner:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: T.redPale, borderWidth: 1, borderColor: T.redSoft, borderRadius: 10, padding: 10, marginBottom: 12 },
  errorText:       { flex: 1, fontSize: 13, color: T.errorRed },

  // Card shell
  cardShell:       { backgroundColor: T.white, borderRadius: 16, borderWidth: 1, borderColor: T.borderGreen, marginBottom: 14, overflow: "hidden", ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 }, android: { elevation: 3 } }) },
  cardAccentBar:   { height: 5 },
  cardBody:        { padding: 16 },

  // Section label
  sectionLabel:    { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  sectionLabelIcon:{ fontSize: 14 },
  sectionLabelText:{ fontSize: 11, fontWeight: "700", color: T.leafMid, textTransform: "uppercase", letterSpacing: 1.2 },

  // Fields
  fieldGroup:      { marginBottom: 14 },
  fieldLabel:      { fontSize: 12, fontWeight: "600", color: T.inkMid, marginBottom: 4 },
  fieldHint:       { fontSize: 11, color: T.inkLight, marginTop: 6, lineHeight: 16 },
  textInput:       { borderWidth: 1, borderColor: T.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: T.inkDark, backgroundColor: T.parchment },

  // Pills
  pillRow:         { flexDirection: "row", gap: 8 },
  pill:            { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.white },
  pillSelected:    { borderColor: T.leaf, backgroundColor: T.sagePale },
  pillText:        { fontSize: 13, color: T.inkLight, fontWeight: "500" },
  pillTextSelected:{ color: T.leaf, fontWeight: "700" },

  // Info box
  infoBox:         { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#ebf8ff", borderWidth: 1, borderColor: "#63b3ed", borderRadius: 10, padding: 10, marginTop: 10 },
  infoBoxText:     { flex: 1, fontSize: 12, color: "#2b6cb0", lineHeight: 17 },

  // Step dots
  stepDots:        { flexDirection: "row", justifyContent: "center", gap: 6, marginVertical: 16 },
  dot:             { width: 8, height: 8, borderRadius: 4 },
  dotDone:         { backgroundColor: T.sage },
  dotActive:       { backgroundColor: T.leaf, width: 22, borderRadius: 4 },
  dotIdle:         { backgroundColor: T.border },

  // Review
  reviewHeading:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  reviewAccentLine:{ width: 4, height: 22, borderRadius: 2, backgroundColor: T.leaf },
  reviewTitle:     { fontSize: 15, fontWeight: "700", color: T.inkDark, flex: 1 },
  stepBadge:       { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, backgroundColor: T.sagePale, borderWidth: 1, borderColor: T.borderGreen },
  stepBadgeText:   { fontSize: 10, fontWeight: "700", color: T.leaf, letterSpacing: 0.5 },
  reviewPanel:     { borderRadius: 12, borderWidth: 1, borderColor: T.borderGreen, overflow: "hidden" },
  reviewPanelHeader:{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: T.sagePale, borderBottomWidth: 1, borderBottomColor: T.borderGreen },
  reviewPanelTitle:{ fontSize: 10, fontWeight: "700", color: T.leafMid, letterSpacing: 1.2 },
  reviewRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: T.border },
  reviewRowLabel:  { fontSize: 13, color: T.inkLight },
  reviewRowValue:  { fontSize: 13, fontWeight: "600", color: T.inkDark },
  reviewFootnote:  { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  reviewFootnoteDot:{ width: 6, height: 6, borderRadius: 3, backgroundColor: T.sage },
  reviewFootnoteText:{ fontSize: 12, color: T.inkLight, flex: 1, lineHeight: 17 },

  // Results
  resultsHeading:  { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  resultsAccentBar:{ width: 4, height: 28, borderRadius: 2, backgroundColor: T.leaf },
  resultsTitle:    { fontSize: 20, fontWeight: "800", color: T.inkDark },

  // BMI
  bmiRow:          { flexDirection: "row", alignItems: "flex-end", gap: 6, marginBottom: 10 },
  bmiBig:          { fontSize: 44, fontWeight: "800", color: T.leaf, lineHeight: 48 },
  bmiUnit:         { fontSize: 14, color: T.inkLight, marginBottom: 6 },
  bmiCategoryBadge:{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, borderWidth: 1.5, backgroundColor: T.white, marginBottom: 10 },
  bmiDot:          { width: 8, height: 8, borderRadius: 4 },
  bmiCategoryText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8 },
  mlNote:          { flexDirection: "row", alignItems: "center", gap: 6 },
  mlNoteText:      { fontSize: 12, color: T.inkLight },

  // Foods to avoid
  avoidWrap:       { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  avoidPill:       { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, backgroundColor: T.redPale, borderWidth: 1, borderColor: T.redSoft },
  avoidPillText:   { fontSize: 12, fontWeight: "500", color: T.errorRed },

  // Table
  tableHeader:     { flexDirection: "row", backgroundColor: T.sagePale, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginBottom: 2 },
  tableHeaderText: { fontSize: 10, fontWeight: "700", color: T.leafMid, textTransform: "uppercase", letterSpacing: 0.8 },
  tableRow:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.border },
  tableRowEven:    { backgroundColor: "#f8fffe" },
  tableRowOdd:     { backgroundColor: T.white },
  dotBullet:       { width: 6, height: 6, borderRadius: 3, backgroundColor: T.sage, flexShrink: 0 },
  dishName:        { fontSize: 13, color: T.inkDark, fontWeight: "500", flexShrink: 1 },
  noMatchText:     { fontSize: 12, color: T.inkLight, fontStyle: "italic" },
  portionPct:      { fontSize: 12, fontWeight: "700", color: T.leaf, marginBottom: 3 },
  portionBarTrack: { height: 4, borderRadius: 99, backgroundColor: T.border, overflow: "hidden", width: "80%" },
  portionBarFill:  { height: "100%", borderRadius: 99, backgroundColor: T.sage },
  gramPill:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: T.sagePale, borderWidth: 1, borderColor: T.borderGreen, alignSelf: "flex-start" },
  gramPillText:    { fontSize: 11, fontWeight: "700", color: T.leaf },
  gramPillDark:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: T.leaf, alignSelf: "flex-start" },
  gramPillDarkText:{ fontSize: 11, fontWeight: "700", color: T.white },
  totalRow:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 9, backgroundColor: T.sagePale, borderRadius: 8, marginTop: 4 },
  totalLabel:      { fontSize: 12, fontWeight: "700", color: T.leaf },
  tableCaption:    { fontSize: 11, color: T.inkLight, marginTop: 8, lineHeight: 16 },

  // Nutrients
  nutrientRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: T.border },
  nutrientLeft:    { flexDirection: "row", alignItems: "center", gap: 8 },
  nutrientDot:     { width: 8, height: 8, borderRadius: 4 },
  nutrientLabel:   { fontSize: 13, color: T.inkMid, fontWeight: "500" },
  nutrientRight:   { flexDirection: "row", alignItems: "baseline" },
  nutrientValue:   { fontSize: 16, fontWeight: "700", color: T.inkDark },
  nutrientUnit:    { fontSize: 11, color: T.inkLight },
  divider:         { height: 1, backgroundColor: T.border, marginVertical: 14 },
  macroTitle:      { fontSize: 10, fontWeight: "700", color: T.inkLight, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  macroRow:        { marginBottom: 10 },
  macroRowTop:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  macroLabel:      { fontSize: 12, color: T.inkLight, fontWeight: "500" },
  macroValue:      { fontSize: 12, color: T.inkMid, fontWeight: "600" },
  macroTrack:      { height: 6, borderRadius: 99, backgroundColor: T.border, overflow: "hidden" },
  macroFill:       { height: "100%", borderRadius: 99 },

  // Shad Rasa
  rasaSubtitle:    { fontSize: 12, color: T.inkLight, marginBottom: 10, lineHeight: 17 },

  // Author
  authorCard:      { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#e8f5e9", borderRadius: 14, padding: 14, borderLeftWidth: 4, borderLeftColor: T.leaf, marginBottom: 14 },
  authorName:      { fontSize: 14, fontWeight: "700", color: T.leaf },
  authorId:        { fontSize: 11, color: T.inkLight },
  authorModule:    { fontSize: 12, color: T.leafMid, marginTop: 2 },

  // Nav
  navRow:          { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 8, marginBottom: 6 },
  btnPrimary:      { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: T.leaf, borderRadius: 12, paddingVertical: 14 },
  btnDisabled:     { opacity: 0.6 },
  btnPrimaryText:  { fontSize: 15, fontWeight: "700", color: T.white },
  btnOutline:      { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: T.leaf, borderRadius: 12, paddingVertical: 14 },
  btnOutlineText:  { fontSize: 15, fontWeight: "600", color: T.leaf },

  // Disclaimer
  disclaimer:      { fontSize: 11, color: T.inkLight, textAlign: "center", lineHeight: 16, marginTop: 8 },
});