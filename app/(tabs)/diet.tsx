import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Platform, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { DIET_API_URL } from "../../config";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  forest:   "#1a3a2a",
  leaf:     "#2d6a4f",
  sage:     "#52b788",
  sagePale: "#d8f3dc",
  gold:     "#b08d57",
  goldPale: "#f5f0e8",
  parchment:"#faf8f4",
  bark:     "#6b4c2a",
  inkDark:  "#1a1a1a",
  inkMid:   "#3a3a3a",
  inkLight: "#7a7a7a",
  border:   "#e4e0d8",
  borderG:  "#a8d5b5",
  white:    "#ffffff",
  redSoft:  "#e07070",
  redPale:  "#fff0f0",
  errorRed: "#b03030",
  bg:       "#f4f1eb",
  surface:  "#ffffff",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type DishInfo = {
  dish: string;
  rasa: string;
  guna: string;
  portion_pct: number;
};

type MealOption = {
  option_number: number;
  is_top: boolean;
  suitability_score: number;
  dishes: DishInfo[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  reasons: string[];
};

type ResultData = {
  bmi: number;
  bmi_category: string;
  tdee: number;
  target_calories: number;
  disease: string;
  dosha: string;
  meal_category: string;
  diet_preference: string;
  foods_to_avoid: string[];
  meal_options: MealOption[];
};

type FormData = {
  age: string;
  gender: string;
  weight: string;
  height: string;
  activity_level: string;
  disease: string;
  dosha: string;
  meal_category: string;
  diet_preference: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const DISEASES   = ["Diabetes","Gastritis","Migraine","Asthma","Arthritis"];
const DOSHAS     = ["Vata","Pitta","Kapha"];
const MEALS      = ["Breakfast","Lunch","Dinner"];
const PREFS      = ["Vegetarian","Non-Vegetarian"];
const GENDERS    = ["Male","Female"];
const ACTIVITIES = ["Low","Moderate","High"];

const RASA_COLOR: Record<string,string> = {
  "Sweet/Madhura":       "#b08d57",
  "Sour/Amla":           "#c0533a",
  "Salty/Lavana":        "#3a6fa8",
  "Pungent/Katu":        "#8b3a3a",
  "Bitter/Tikta":        "#2d6a4f",
  "Astringent/Kashaya":  "#6a4a8a",
  "Neutral/Mild":        "#7a7a7a",
};

const DOSHA_DESC: Record<string,string> = {
  Vata:  "Warm, moist, grounding foods recommended",
  Pitta: "Cooling, mildly spiced foods recommended",
  Kapha: "Light, warm, stimulating foods recommended",
};

// ─── Small Components ─────────────────────────────────────────────────────────
function SectionLabel({ icon, children }: { icon: string; children: string }) {
  return (
    <View style={s.sl}>
      <Text style={s.sli}>{icon}</Text>
      <Text style={s.slt}>{children}</Text>
    </View>
  );
}

function Card({ children, accent = T.leaf }: { children: React.ReactNode; accent?: string }) {
  return (
    <View style={s.card}>
      <View style={[s.cardBar, { backgroundColor: accent }]} />
      <View style={s.cardBody}>{children}</View>
    </View>
  );
}

function SelectPill({
  label, value, options, onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <View style={s.fg}>
      <Text style={s.fl}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
        <View style={s.pr}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt} onPress={() => onChange(opt)}
              style={[s.pill, value === opt && s.pillOn]}
            >
              <Text style={[s.pt, value === opt && s.ptOn]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function InputField({
  label, value, onChange, keyboardType = "default", placeholder = "",
}: { label: string; value: string; onChange: (v: string) => void; keyboardType?: any; placeholder?: string }) {
  return (
    <View style={s.fg}>
      <Text style={s.fl}>{label}</Text>
      <TextInput
        style={s.inp} value={value} onChangeText={onChange}
        keyboardType={keyboardType} placeholder={placeholder}
        placeholderTextColor={T.inkLight}
      />
    </View>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={s.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[s.dot, i < current ? s.dDone : i === current ? s.dActive : s.dIdle]} />
      ))}
    </View>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? T.leaf : score >= 50 ? T.gold : T.redSoft;
  return (
    <View style={[s.scoreBadge, { borderColor: color }]}>
      <Text style={[s.scoreNum, { color }]}>{score}</Text>
      <Text style={[s.scoreLabel, { color }]}>/100</Text>
    </View>
  );
}

function RasaTag({ rasa }: { rasa: string }) {
  const color = RASA_COLOR[rasa] ?? T.inkLight;
  return (
    <View style={[s.rasaTag, { borderColor: color }]}>
      <Text style={[s.rasaText, { color }]}>{rasa}</Text>
    </View>
  );
}

function NutrientRow({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={s.nutRow}>
      <View style={[s.nutDot, { backgroundColor: color }]} />
      <Text style={s.nutLabel}>{label}</Text>
      <Text style={s.nutValue}>{value} <Text style={s.nutUnit}>{unit}</Text></Text>
    </View>
  );
}

// ─── PDF Builder ──────────────────────────────────────────────────────────────
function buildPDF(result: ResultData, formData: FormData): string {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const top = result.meal_options.find(m => m.is_top) ?? result.meal_options[0];
  const bmiColor = result.bmi_category === "Normal" ? "#2d6a4f"
    : result.bmi_category === "Underweight" ? "#b08d57"
    : result.bmi_category === "Overweight" ? "#c07a30" : "#b03030";

  const mealOptionsHTML = result.meal_options.map((opt, idx) => `
    <div style="margin-bottom:20px;border:1px solid ${opt.is_top ? "#2d6a4f" : "#e4e0d8"};border-radius:10px;overflow:hidden;${opt.is_top ? "box-shadow:0 2px 8px rgba(45,106,79,0.15)" : ""}">
      <div style="padding:10px 16px;background:${opt.is_top ? "#2d6a4f" : "#f4f1eb"};display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:700;color:${opt.is_top ? "#fff" : "#1a1a1a"};font-size:14px">${opt.is_top ? "⭐ " : ""}Meal Option ${opt.option_number}${opt.is_top ? " — Top Recommendation" : ""}</span>
        <span style="background:${opt.is_top ? "rgba(255,255,255,0.2)" : "#e4e0d8"};color:${opt.is_top ? "#fff" : "#3a3a3a"};padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600">Score: ${opt.suitability_score}/100</span>
      </div>
      <div style="padding:14px 16px">
        <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
          <thead><tr style="background:#f4f1eb">
            <th style="padding:8px;text-align:left;font-size:11px;color:#7a7a7a;text-transform:uppercase;letter-spacing:0.8px">Dish</th>
            <th style="padding:8px;text-align:left;font-size:11px;color:#7a7a7a;text-transform:uppercase;letter-spacing:0.8px">Rasa (Taste)</th>
            <th style="padding:8px;text-align:left;font-size:11px;color:#7a7a7a;text-transform:uppercase;letter-spacing:0.8px">Guna (Quality)</th>
          </tr></thead>
          <tbody>${opt.dishes.map((d, i) => `
            <tr style="background:${i % 2 === 0 ? "#fff" : "#faf8f4"};border-bottom:1px solid #e4e0d8">
              <td style="padding:8px 8px;font-size:13px;color:#1a1a1a;font-weight:500">${d.dish}</td>
              <td style="padding:8px 8px;font-size:12px;color:#2d6a4f">${d.rasa}</td>
              <td style="padding:8px 8px;font-size:12px;color:#6b4c2a">${d.guna}</td>
            </tr>`).join("")}
          </tbody>
        </table>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:${opt.is_top ? "12px" : "0"}">
          ${[{ l: "Calories", v: opt.calories, u: "kcal", c: "#b03030" }, { l: "Protein", v: opt.protein, u: "g", c: "#2d6a4f" }, { l: "Carbs", v: opt.carbs, u: "g", c: "#b08d57" }, { l: "Fats", v: opt.fats, u: "g", c: "#6b4c2a" }].map(({ l, v, u, c }) => `
            <div style="background:${c}12;border:1px solid ${c}40;border-radius:8px;padding:10px;text-align:center">
              <div style="font-size:20px;font-weight:800;color:${c}">${v}</div>
              <div style="font-size:10px;color:#7a7a7a;margin-top:2px">${u} · ${l}</div>
            </div>`).join("")}
        </div>
        ${opt.is_top && opt.reasons.length > 0 ? `
          <div style="background:#f0f7f3;border-left:3px solid #2d6a4f;padding:12px;border-radius:0 8px 8px 0;margin-top:12px">
            <div style="font-size:11px;font-weight:700;color:#2d6a4f;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px">Why we recommend this meal</div>
            ${opt.reasons.map(r => `<div style="font-size:12px;color:#3a3a3a;margin-bottom:4px">• ${r.charAt(0).toUpperCase() + r.slice(1)}</div>`).join("")}
          </div>` : ""}
      </div>
    </div>`).join("");

  const avoidHTML = result.foods_to_avoid.map(f =>
    `<span style="background:#fff0f0;border:1px solid #e07070;color:#b03030;font-size:12px;font-weight:500;padding:4px 12px;border-radius:99px;display:inline-block;margin:3px">${f}</span>`
  ).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,serif;background:#faf8f4;color:#1a1a1a}
  .page{max-width:820px;margin:0 auto}.banner{background:#1a3a2a;padding:36px 44px 32px}
  .accent{height:3px;background:#b08d57;margin-bottom:24px}
  .h1{font-size:28px;color:#faf8f4;font-weight:bold;text-align:center;letter-spacing:-0.5px}
  .sub{font-size:12px;color:#a8d5b5;text-align:center;margin-top:6px;font-style:italic}
  .meta{font-size:10px;color:#6b9a7a;text-align:center;margin-top:4px}
  .content{padding:32px 44px}.sec{margin-bottom:28px}
  .sh{display:flex;align-items:center;gap:8px;margin-bottom:14px}
  .sl{width:3px;height:18px;background:#2d6a4f;border-radius:2px}
  .st{font-size:11px;font-weight:700;color:#2d6a4f;text-transform:uppercase;letter-spacing:1.2px}
  .pgrid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #e4e0d8;border-radius:10px;overflow:hidden}
  .pcol{padding:0}.prow{display:flex;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #e4e0d8}
  .pcol:first-child .prow{border-right:1px solid #e4e0d8}
  .pl{font-size:12px;color:#7a7a7a}.pv{font-size:12px;font-weight:600;color:#1a1a1a}
  .bmi{display:inline-flex;align-items:center;gap:14px;border:2px solid ${bmiColor};border-radius:12px;padding:14px 22px;margin-top:12px;background:${bmiColor}0d}
  .bmin{font-size:40px;font-weight:800;color:${bmiColor};line-height:1}
  .bmiu{font-size:12px;color:#7a7a7a}.bmic{font-size:14px;font-weight:700;color:${bmiColor}}
  .tdee-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:12px}
  .tbox{border:1px solid #e4e0d8;border-radius:8px;padding:12px;text-align:center}
  .tv{font-size:18px;font-weight:700;color:#1a3a2a}.tu{font-size:10px;color:#7a7a7a;margin-top:2px}
  .foot{background:#1a3a2a;color:#6b9a7a;font-size:10px;text-align:center;padding:14px;margin-top:32px}
  </style></head><body><div class="page">
  <div class="banner"><div class="accent"/>
    <div class="h1">Arogya — Ayurvedic Diet Plan Report</div>
    <div class="sub">Personalised Dietary Recommendation · Rooted in Ayurvedic Wisdom</div>
    <div class="meta">Generated on ${date} &nbsp;·&nbsp; Arogya Research System</div>
  </div>
  <div class="content">
    <div class="sec">
      <div class="sh"><div class="sl"></div><span class="st">Patient Profile</span></div>
      <div class="pgrid">
        <div class="pcol">
          ${[["Age", `${formData.age} years`], ["Gender", formData.gender], ["Weight", `${formData.weight} kg`], ["Height", `${formData.height} cm`]].map(([l, v]) => `<div class="prow"><span class="pl">${l}</span><span class="pv">${v}</span></div>`).join("")}
        </div>
        <div class="pcol">
          ${[["Activity Level", formData.activity_level], ["Dosha", formData.dosha], ["Condition", formData.disease], ["Diet", formData.diet_preference]].map(([l, v]) => `<div class="prow"><span class="pl">${l}</span><span class="pv">${v}</span></div>`).join("")}
        </div>
      </div>
    </div>
    <div class="sec">
      <div class="sh"><div class="sl"></div><span class="st">Health Metrics</span></div>
      <div class="bmi">
        <div><span class="bmin">${result.bmi}</span><span class="bmiu"> kg/m²</span></div>
        <div><div class="bmic">${result.bmi_category.toUpperCase()}</div><div style="font-size:11px;color:#7a7a7a;margin-top:2px">BMI Category</div></div>
      </div>
      <div class="tdee-grid">
        <div class="tbox"><div class="tv">${result.tdee}</div><div class="tu">kcal/day · TDEE</div></div>
        <div class="tbox"><div class="tv">${result.target_calories}</div><div class="tu">kcal · ${result.meal_category} Target</div></div>
        <div class="tbox"><div class="tv">${result.dosha}</div><div class="tu">Dominant Dosha</div></div>
      </div>
    </div>
    <div class="sec">
      <div class="sh"><div class="sl"></div><span class="st">Meal Recommendations — ${result.meal_category}</span></div>
      ${mealOptionsHTML}
    </div>
    <div class="sec">
      <div class="sh"><div class="sl"></div><span class="st">Foods to Avoid — ${result.disease}</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${avoidHTML}</div>
    </div>
  </div>
  <div class="foot">This report is for wellness guidance only. Consult a qualified Ayurvedic physician before making dietary changes. · AArogya Research System</div>
  </div></body></html>`;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DietScreen() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    age: "", gender: "", weight: "", height: "", activity_level: "",
    disease: "", dosha: "", meal_category: "", diet_preference: "",
  });
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfDone, setPdfDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormData) => (val: string) => {
    setFormData(f => ({ ...f, [key]: val }));
    setError(null);
  };

  const stepValid = [
    () => !!formData.age && !!formData.gender && !!formData.weight && !!formData.height && !!formData.activity_level,
    () => !!formData.disease && !!formData.dosha,
    () => !!formData.meal_category && !!formData.diet_preference,
    () => true,
  ];

  const handleGenerate = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const payload = {
        age: parseInt(formData.age),
        gender: formData.gender.toLowerCase(),
        weight_kg: parseFloat(formData.weight),
        height_cm: parseFloat(formData.height),
        activity_level: formData.activity_level,
        disease: formData.disease,
        dosha: formData.dosha,
        meal_category: formData.meal_category,
        diet_preference: formData.diet_preference,
      };
      const response = await fetch(`${DIET_API_URL}/predict_diet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        setResult(data.result as ResultData);
        setStep(4);
      } else {
        setError(data.error ?? "Failed to generate meal plan.");
      }
    } catch {
      setError("Could not connect to Arogya service. Make sure Flask API is running.");
    } finally {
      setLoading(false);
    }
  }, [formData]);

  const handleNext = () => {
    if (!stepValid[step]()) { setError("Please fill all required fields."); return; }
    setError(null);
    if (step === 3) { handleGenerate(); return; }
    setStep(n => n + 1);
  };
  const handleBack = () => {
    setError(null);
    if (step === 4) { setStep(3); setResult(null); return; }
    setStep(n => Math.max(n - 1, 0));
  };
  const handleReset = () => {
    setFormData({ age: "", gender: "", weight: "", height: "", activity_level: "", disease: "", dosha: "", meal_category: "", diet_preference: "" });
    setResult(null); setError(null); setStep(0); setPdfDone(false);
  };

  const handleDownloadPDF = useCallback(async () => {
    if (!result) return;
    setPdfLoading(true); setPdfDone(false);
    try {
      const html = buildPDF(result, formData);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Save Arogya Diet Plan" });
        setPdfDone(true);
        setTimeout(() => setPdfDone(false), 4000);
      } else {
        Alert.alert("Saved", `PDF saved to:\n${uri}`);
        setPdfDone(true);
      }
    } catch {
      Alert.alert("Error", "Could not generate PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  }, [result, formData]);

  const topMeal = result?.meal_options.find(m => m.is_top);
  const bmiColor = result?.bmi_category === "Normal" ? T.leaf
    : result?.bmi_category === "Underweight" ? T.gold
    : result?.bmi_category === "Overweight" ? "#c07a30" : T.errorRed;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.sc}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.logoRing}>
          <Ionicons name="leaf" size={32} color={T.leaf} />
        </View>
        <Text style={s.headerTitle}>Arogya</Text>
        <Text style={s.headerSub}>Ayurvedic Dietary Recommendation</Text>
      </View>

      {/* Error */}
      {error && (
        <View style={s.errorBox}>
          <Ionicons name="alert-circle-outline" size={15} color={T.errorRed} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      {/* STEP 0 — Personal Info */}
      {step === 0 && (
        <Card>
          <SectionLabel icon="🧍">Personal Details</SectionLabel>
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <InputField label="Age (years)" value={formData.age} onChange={set("age")} keyboardType="numeric" placeholder="e.g. 30" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <SelectPill label="Gender" value={formData.gender} options={GENDERS} onChange={set("gender")} />
            </View>
          </View>
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <InputField label="Weight (kg)" value={formData.weight} onChange={set("weight")} keyboardType="decimal-pad" placeholder="e.g. 65" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <InputField label="Height (cm)" value={formData.height} onChange={set("height")} keyboardType="decimal-pad" placeholder="e.g. 170" />
            </View>
          </View>
          <SelectPill label="Activity Level" value={formData.activity_level} options={ACTIVITIES} onChange={set("activity_level")} />
          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={14} color={T.leaf} />
            <Text style={s.infoText}>BMI and daily energy requirement (TDEE) are calculated automatically from your inputs.</Text>
          </View>
        </Card>
      )}

      {/* STEP 1 — Health Info */}
      {step === 1 && (
        <Card accent={T.gold}>
          <SectionLabel icon="🩺">Health Profile</SectionLabel>
          <SelectPill label="Disease Condition" value={formData.disease} options={DISEASES} onChange={set("disease")} />
          <SelectPill label="Dominant Dosha" value={formData.dosha} options={DOSHAS} onChange={set("dosha")} />
          {formData.dosha ? (
            <View style={s.doshaBox}>
              <Text style={s.doshaIcon}>
                {formData.dosha === "Vata" ? "🌬️" : formData.dosha === "Pitta" ? "🔥" : "🌊"}
              </Text>
              <Text style={s.doshaDesc}>{DOSHA_DESC[formData.dosha]}</Text>
            </View>
          ) : null}
        </Card>
      )}

      {/* STEP 2 — Meal Preferences */}
      {step === 2 && (
        <Card>
          <SectionLabel icon="🍽️">Meal Preferences</SectionLabel>
          <SelectPill label="Meal Category" value={formData.meal_category} options={MEALS} onChange={set("meal_category")} />
          <SelectPill label="Dietary Preference" value={formData.diet_preference} options={PREFS} onChange={set("diet_preference")} />
          <View style={s.infoBox}>
            <Ionicons name="checkmark-circle-outline" size={14} color={T.leaf} />
            <Text style={s.infoText}>Your meal plan will include Rasa, Guna, and nutritional values for each recommended dish.</Text>
          </View>
        </Card>
      )}

      {/* STEP 3 — Review */}
      {step === 3 && (
        <Card>
          <View style={s.reviewHeader}>
            <View style={s.reviewBar} />
            <Text style={s.reviewTitle}>Review Your Profile</Text>
            <View style={s.stepBadge}><Text style={s.stepBadgeText}>Step 4 of 4</Text></View>
          </View>
          <View style={s.reviewSection}>
            <Text style={s.reviewSectionTitle}>PERSONAL</Text>
            {[["Age", `${formData.age} years`], ["Gender", formData.gender], ["Weight", `${formData.weight} kg`], ["Height", `${formData.height} cm`], ["Activity", formData.activity_level]].map(([l, v]) => (
              <View key={l} style={s.reviewRow}>
                <Text style={s.reviewLabel}>{l}</Text>
                <Text style={s.reviewValue}>{v || "—"}</Text>
              </View>
            ))}
          </View>
          <View style={[s.reviewSection, { marginTop: 10 }]}>
            <Text style={s.reviewSectionTitle}>HEALTH & MEAL</Text>
            {[["Condition", formData.disease], ["Dosha", formData.dosha], ["Meal", formData.meal_category], ["Preference", formData.diet_preference]].map(([l, v]) => (
              <View key={l} style={s.reviewRow}>
                <Text style={s.reviewLabel}>{l}</Text>
                <Text style={s.reviewValue}>{v || "—"}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* STEP 4 — Results */}
      {step === 4 && result && (
        <View>
          <View style={s.resultsHeader}>
            <View style={s.resultsBar} />
            <Text style={s.resultsTitle}>Your Personalised Plan</Text>
          </View>

          {/* Health Metrics */}
          <Card accent={bmiColor}>
            <SectionLabel icon="📊">Health Metrics</SectionLabel>
            <View style={s.bmiRow}>
              <View>
                <Text style={[s.bmiNum, { color: bmiColor }]}>{result.bmi}</Text>
                <Text style={s.bmiUnit}>kg/m²</Text>
              </View>
              <View style={[s.bmiBadge, { borderColor: bmiColor }]}>
                <Text style={[s.bmiCat, { color: bmiColor }]}>{result.bmi_category.toUpperCase()}</Text>
                <Text style={s.bmiVerify}>ML Verified</Text>
              </View>
            </View>
            <View style={s.metricsGrid}>
              {[
                { label: "TDEE", value: `${result.tdee}`, unit: "kcal/day" },
                { label: result.meal_category + " Target", value: `${result.target_calories}`, unit: "kcal" },
                { label: "Dosha", value: result.dosha, unit: "" },
              ].map(({ label, value, unit }) => (
                <View key={label} style={s.metricBox}>
                  <Text style={s.metricValue}>{value}</Text>
                  {unit ? <Text style={s.metricUnit}>{unit}</Text> : null}
                  <Text style={s.metricLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Foods to Avoid */}
          <Card accent={T.errorRed}>
            <SectionLabel icon="🚫">Foods to Avoid — {result.disease}</SectionLabel>
            <View style={s.avoidWrap}>
              {result.foods_to_avoid.map((f, i) => (
                <View key={i} style={s.avoidPill}>
                  <Text style={s.avoidText}>{f}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Meal Options */}
          {result.meal_options.map((opt, idx) => (
            <Card key={idx} accent={opt.is_top ? T.leaf : T.border}>
              <View style={s.mealHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.mealTitle}>
                    {opt.is_top ? "⭐ " : ""}Meal Option {opt.option_number}
                    {opt.is_top ? "  —  Top Recommendation" : ""}
                  </Text>
                </View>
                <ScoreBadge score={opt.suitability_score} />
              </View>

              {/* Dishes */}
              <Text style={s.dishesLabel}>Dishes & Ayurvedic Classification</Text>
              {opt.dishes.map((d, di) => (
                <View key={di} style={[s.dishRow, di % 2 === 0 ? s.dishEven : s.dishOdd]}>
                  <View style={s.dishDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.dishName}>{d.dish}</Text>
                    <View style={s.dishTags}>
                      <RasaTag rasa={d.rasa} />
                      <View style={s.gunaTag}>
                        <Text style={s.gunaText}>{d.guna}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}

              {/* Nutrition */}
              <View style={s.nutSection}>
                <Text style={s.nutTitle}>Nutritional Values</Text>
                <View style={s.nutGrid}>
                  {[
                    { label: "Calories", value: opt.calories, unit: "kcal", color: T.errorRed },
                    { label: "Protein", value: opt.protein, unit: "g", color: T.leaf },
                    { label: "Carbs", value: opt.carbs, unit: "g", color: T.gold },
                    { label: "Fats", value: opt.fats, unit: "g", color: T.bark },
                  ].map(({ label, value, unit, color }) => (
                    <View key={label} style={[s.nutBox, { borderColor: color + "40" }]}>
                      <Text style={[s.nutBoxVal, { color }]}>{value}</Text>
                      <Text style={s.nutBoxUnit}>{unit}</Text>
                      <Text style={s.nutBoxLabel}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Top Recommendation Reasons */}
              {opt.is_top && opt.reasons.length > 0 && (
                <View style={s.reasonBox}>
                  <Text style={s.reasonTitle}>Why we recommend this meal</Text>
                  {opt.reasons.map((r, ri) => (
                    <View key={ri} style={s.reasonRow}>
                      <View style={s.reasonDot} />
                      <Text style={s.reasonText}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          ))}

          {/* PDF Button */}
          <TouchableOpacity
            style={[s.pdfBtn, pdfLoading && s.btnDisabled]}
            onPress={handleDownloadPDF}
            disabled={pdfLoading}
          >
            {pdfLoading
              ? <ActivityIndicator size="small" color={T.white} />
              : pdfDone
                ? <><Ionicons name="checkmark-circle" size={18} color={T.white} /><Text style={s.pdfText}>PDF Ready!</Text></>
                : <><Ionicons name="download-outline" size={18} color={T.white} /><Text style={s.pdfText}>Download Diet Plan PDF</Text></>
            }
          </TouchableOpacity>

          {/* Disclaimer */}
          <View style={s.disclaimer}>
            <Ionicons name="shield-checkmark-outline" size={13} color={T.inkLight} />
            <Text style={s.disclaimerText}>
              This is a supportive dietary recommendation tool only. Consult a qualified healthcare professional before making major dietary changes.
            </Text>
          </View>
        </View>
      )}

      {/* Step Dots */}
      {step < 4 && <StepDots current={step} total={4} />}

      {/* Navigation */}
      <View style={s.nav}>
        {step > 0 && (
          <TouchableOpacity style={s.btnOutline} onPress={handleBack}>
            <Ionicons name="arrow-back" size={15} color={T.leaf} />
            <Text style={s.btnOutlineText}>Back</Text>
          </TouchableOpacity>
        )}
        {step < 4 && (
          <TouchableOpacity
            style={[s.btnPrimary, loading && s.btnDisabled]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size="small" color={T.white} />
              : <>
                  <Text style={s.btnPrimaryText}>{step === 3 ? "Generate Plan" : "Continue"}</Text>
                  <Ionicons name={step === 3 ? "sparkles" : "arrow-forward"} size={15} color={T.white} />
                </>
            }
          </TouchableOpacity>
        )}
        {step === 4 && (
          <TouchableOpacity style={s.btnOutline} onPress={handleReset}>
            <Ionicons name="refresh" size={15} color={T.leaf} />
            <Text style={s.btnOutlineText}>Start Over</Text>
          </TouchableOpacity>
        )}
      </View>

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: T.bg },
  sc:        { padding: 16, paddingBottom: 52 },

  // Header
  header:      { alignItems: "center", marginBottom: 20, paddingTop: 8 },
  logoRing:    { width: 72, height: 72, borderRadius: 36, backgroundColor: T.sagePale, alignItems: "center", justifyContent: "center", marginBottom: 10, borderWidth: 1.5, borderColor: T.borderG },
  headerTitle: { fontSize: 24, fontWeight: "800", color: T.forest, letterSpacing: -0.5 },
  headerSub:   { fontSize: 12, color: T.inkLight, marginTop: 3 },

  // Error
  errorBox:  { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: T.redPale, borderWidth: 1, borderColor: T.redSoft, borderRadius: 10, padding: 10, marginBottom: 12 },
  errorText: { flex: 1, fontSize: 13, color: T.errorRed },

  // Card
  card:     { backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.border, marginBottom: 14, overflow: "hidden", ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 2 } }) },
  cardBar:  { height: 4 },
  cardBody: { padding: 16 },

  // Section Label
  sl:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  sli: { fontSize: 14 },
  slt: { fontSize: 10, fontWeight: "700", color: T.leaf, textTransform: "uppercase", letterSpacing: 1.2 },

  // Form
  fg:   { marginBottom: 14 },
  fl:   { fontSize: 12, fontWeight: "600", color: T.inkMid, marginBottom: 4 },
  inp:  { borderWidth: 1, borderColor: T.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: T.inkDark, backgroundColor: T.parchment },
  pr:   { flexDirection: "row", gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.white },
  pillOn: { borderColor: T.leaf, backgroundColor: T.sagePale },
  pt:   { fontSize: 13, color: T.inkLight, fontWeight: "500" },
  ptOn: { color: T.leaf, fontWeight: "700" },

  row2: { flexDirection: "row", marginBottom: 0 },

  infoBox:  { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: T.sagePale, borderRadius: 8, padding: 10, marginTop: 4 },
  infoText: { flex: 1, fontSize: 12, color: T.leaf, lineHeight: 17 },

  doshaBox:  { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: T.goldPale, borderRadius: 8, padding: 10, marginTop: 4, borderWidth: 1, borderColor: T.gold + "50" },
  doshaIcon: { fontSize: 20 },
  doshaDesc: { flex: 1, fontSize: 12, color: T.bark, lineHeight: 17 },

  // Step Dots
  dots:    { flexDirection: "row", justifyContent: "center", gap: 6, marginVertical: 16 },
  dot:     { width: 7, height: 7, borderRadius: 3.5 },
  dDone:   { backgroundColor: T.sage },
  dActive: { backgroundColor: T.leaf, width: 20, borderRadius: 3.5 },
  dIdle:   { backgroundColor: T.border },

  // Review
  reviewHeader:      { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  reviewBar:         { width: 4, height: 20, borderRadius: 2, backgroundColor: T.leaf },
  reviewTitle:       { fontSize: 15, fontWeight: "700", color: T.inkDark, flex: 1 },
  stepBadge:         { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, backgroundColor: T.sagePale, borderWidth: 1, borderColor: T.borderG },
  stepBadgeText:     { fontSize: 10, fontWeight: "700", color: T.leaf },
  reviewSection:     { borderRadius: 10, borderWidth: 1, borderColor: T.borderG, overflow: "hidden" },
  reviewSectionTitle:{ fontSize: 10, fontWeight: "700", color: T.leaf, letterSpacing: 1.2, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: T.sagePale, borderBottomWidth: 1, borderBottomColor: T.borderG },
  reviewRow:         { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: T.border },
  reviewLabel:       { fontSize: 13, color: T.inkLight },
  reviewValue:       { fontSize: 13, fontWeight: "600", color: T.inkDark },

  // Results
  resultsHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  resultsBar:    { width: 4, height: 26, borderRadius: 2, backgroundColor: T.leaf },
  resultsTitle:  { fontSize: 18, fontWeight: "800", color: T.inkDark },

  // BMI
  bmiRow:    { flexDirection: "row", alignItems: "flex-end", gap: 14, marginBottom: 12 },
  bmiNum:    { fontSize: 44, fontWeight: "800", lineHeight: 48 },
  bmiUnit:   { fontSize: 12, color: T.inkLight, marginBottom: 6 },
  bmiBadge:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1.5 },
  bmiCat:    { fontSize: 12, fontWeight: "700", letterSpacing: 0.8 },
  bmiVerify: { fontSize: 10, color: T.inkLight, marginTop: 2 },

  metricsGrid: { flexDirection: "row", gap: 8 },
  metricBox:   { flex: 1, backgroundColor: T.parchment, borderRadius: 8, padding: 10, alignItems: "center", borderWidth: 1, borderColor: T.border },
  metricValue: { fontSize: 16, fontWeight: "700", color: T.inkDark },
  metricUnit:  { fontSize: 10, color: T.inkLight },
  metricLabel: { fontSize: 10, color: T.inkLight, marginTop: 2, textAlign: "center" },

  // Foods to Avoid
  avoidWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  avoidPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, backgroundColor: T.redPale, borderWidth: 1, borderColor: T.redSoft },
  avoidText: { fontSize: 12, fontWeight: "500", color: T.errorRed },

  // Meal Options
  mealHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  mealTitle:  { fontSize: 14, fontWeight: "700", color: T.inkDark },

  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1.5, alignItems: "center" },
  scoreNum:   { fontSize: 14, fontWeight: "800", lineHeight: 18 },
  scoreLabel: { fontSize: 9, fontWeight: "600" },

  dishesLabel: { fontSize: 10, fontWeight: "700", color: T.inkLight, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  dishRow:     { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: T.border },
  dishEven:    { backgroundColor: T.parchment + "80" },
  dishOdd:     { backgroundColor: T.white },
  dishDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: T.sage, marginTop: 6, flexShrink: 0 },
  dishName:    { fontSize: 13, color: T.inkDark, fontWeight: "500", marginBottom: 4, lineHeight: 18 },
  dishTags:    { flexDirection: "row", flexWrap: "wrap", gap: 4 },

  rasaTag:  { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, borderWidth: 1 },
  rasaText: { fontSize: 10, fontWeight: "600" },
  gunaTag:  { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, backgroundColor: T.goldPale, borderWidth: 1, borderColor: T.gold + "50" },
  gunaText: { fontSize: 10, color: T.bark, fontWeight: "500" },

  nutSection: { marginTop: 12 },
  nutTitle:   { fontSize: 10, fontWeight: "700", color: T.inkLight, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  nutGrid:    { flexDirection: "row", gap: 6 },
  nutBox:     { flex: 1, borderRadius: 8, borderWidth: 1, padding: 8, alignItems: "center", backgroundColor: T.parchment },
  nutBoxVal:  { fontSize: 16, fontWeight: "800" },
  nutBoxUnit: { fontSize: 9, color: T.inkLight },
  nutBoxLabel:{ fontSize: 9, color: T.inkLight, marginTop: 1 },

  nutRow:   { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: T.border },
  nutDot:   { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  nutLabel: { flex: 1, fontSize: 13, color: T.inkMid },
  nutValue: { fontSize: 13, fontWeight: "600", color: T.inkDark },
  nutUnit:  { fontSize: 11, color: T.inkLight, fontWeight: "400" },

  reasonBox:   { backgroundColor: T.sagePale, borderLeftWidth: 3, borderLeftColor: T.leaf, borderRadius: 0 + 8, padding: 12, marginTop: 12 },
  reasonTitle: { fontSize: 10, fontWeight: "700", color: T.leaf, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  reasonRow:   { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 4 },
  reasonDot:   { width: 5, height: 5, borderRadius: 2.5, backgroundColor: T.leaf, marginTop: 5, flexShrink: 0 },
  reasonText:  { flex: 1, fontSize: 12, color: T.inkMid, lineHeight: 18 },

  // PDF
  pdfBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: T.forest, borderRadius: 12, paddingVertical: 14, marginBottom: 12, ...Platform.select({ ios: { shadowColor: T.forest, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 }, android: { elevation: 4 } }) },
  pdfText:     { fontSize: 15, fontWeight: "700", color: T.white },

  // Disclaimer
  disclaimer:     { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: T.parchment, borderRadius: 8, padding: 10, marginBottom: 8 },
  disclaimerText: { flex: 1, fontSize: 11, color: T.inkLight, lineHeight: 16 },

  // Navigation
  nav:           { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 6, marginBottom: 6 },
  btnPrimary:    { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: T.leaf, borderRadius: 12, paddingVertical: 13 },
  btnPrimaryText:{ fontSize: 15, fontWeight: "700", color: T.white },
  btnOutline:    { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: T.leaf, borderRadius: 12, paddingVertical: 13 },
  btnOutlineText:{ fontSize: 15, fontWeight: "600", color: T.leaf },
  btnDisabled:   { opacity: 0.6 },
});
