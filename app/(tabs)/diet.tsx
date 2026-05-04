typescript

/**
 
 * Arogya — Ayurvedic Dietary Recommendation Module
 *
 * HOW THIS SCREEN WORKS:
 *  1. User fills 4 steps: Personal → Health → Meal Preferences → Review
 *  2. On "Generate Plan", we POST to the Flask /predict_diet API
 *  3. The API returns meal options with dish names, rasa, guna, nutrition etc.
 *  4. The FRONTEND calculates gram portions per dish using:
 *       - Mifflin-St Jeor BMR formula
 *       - Activity multiplier → TDEE
 *       - BMI category adjustment factor
 *       - Meal category allocation (Breakfast 25%, Lunch 40%, Dinner 30%)
 *       - Each dish's portion_pct from the dataset
 *  5. Results are displayed with Ayurvedic classifications + nutrition + grams
 *  6. User can download a full PDF report
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Platform, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { DIET_API_URL } from "../../config";
import { userService, authService } from "../../services/supabase";
import typescript from "react-native-reanimated";
import { Linking } from "react-native";

// ─── Design Tokens ────────────────────────────────────────────────────────────
// Centralised color palette — all colors referenced from here for consistency
const T = {
  forest:    "#1a3a2a",   // darkest green — used for headers, PDF banner
  leaf:      "#2d6a4f",   // primary green — buttons, accents
  sage:      "#52b788",   // lighter green — dots, indicators
  sagePale:  "#d8f3dc",   // very light green — pill backgrounds, info boxes
  gold:      "#b08d57",   // warm gold — secondary accent
  goldPale:  "#f5f0e8",   // light gold — dosha info box background
  parchment: "#faf8f4",   // off-white — card backgrounds, inputs
  bark:      "#6b4c2a",   // brown — fats color, guna tags
  inkDark:   "#1a1a1a",   // near-black — primary text
  inkMid:    "#3a3a3a",   // dark grey — secondary text
  inkLight:  "#7a7a7a",   // medium grey — labels, hints
  border:    "#e4e0d8",   // warm grey — card borders
  borderG:   "#a8d5b5",   // green-tinted border — selected states
  white:     "#ffffff",
  redSoft:   "#e07070",   // soft red — avoid pill borders
  redPale:   "#fff0f0",   // light red — avoid pill backgrounds
  errorRed:  "#b03030",   // strong red — error text, avoid labels
  bg:        "#f4f1eb",   // screen background — warm off-white
  surface:   "#ffffff",   // card surface
};

// ─── Types ────────────────────────────────────────────────────────────────────
// DishInfo: what the API returns for each dish in a meal option
type DishInfo = {
  dish: string;         // dish name e.g. "Boiled rice (Uble chawal)"
  rasa: string;         // Ayurvedic taste e.g. "Sweet/Madhura"
  guna: string;         // Ayurvedic quality e.g. "Light; Oily; Cold"
  portion_pct: number;  // percentage of total meal e.g. 35 (means 35%)
};

// MealOption: one complete meal recommendation
type MealOption = {
  option_number: number;      // 1, 2, 3, or 4
  is_top: boolean;            // true if this is the top recommended meal
  suitability_score: number;  // 0-100 score from our scoring function
  dishes: DishInfo[];         // list of 3-4 dishes
  calories: number;           // total meal calories in kcal
  protein: number;            // total protein in grams
  carbs: number;              // total carbohydrates in grams
  fats: number;               // total fats in grams
  reasons: string[];          // why this meal is recommended (top meal only)
};

// ResultData: full response from the Flask API
type ResultData = {
  bmi: number;               // calculated BMI value
  bmi_category: string;      // Underweight / Normal / Overweight / Obese
  tdee: number;              // Total Daily Energy Expenditure in kcal
  target_calories: number;   // target calories for this specific meal
  disease: string;           // user's disease condition
  dosha: string;             // user's dominant dosha
  meal_category: string;     // Breakfast / Lunch / Dinner
  diet_preference: string;   // Vegetarian / Non-Vegetarian
  foods_to_avoid: string[];  // list of foods to avoid for this disease
  meal_options: MealOption[]; // 3-4 meal options ranked by suitability
};

// FormData: what the user fills in across the 4 steps
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

//Constants
const DISEASES   = ["Diabetes", "Gastritis", "Migraine", "Asthma", "Arthritis"];
const DOSHAS     = ["Vata", "Pitta", "Kapha"];
const MEALS      = ["Breakfast", "Lunch", "Dinner"];
const PREFS      = ["Vegetarian", "Non-Vegetarian"];
const GENDERS    = ["Male", "Female"];
const ACTIVITIES = ["Low", "Moderate", "High"];

// Color coding for each Ayurvedic taste (Rasa) — used in RasaTag component
const RASA_COLOR: Record<string, string> = {
  "Sweet/Madhura":      "#b08d57",
  "Sour/Amla":          "#c0533a",
  "Salty/Lavana":       "#3a6fa8",
  "Pungent/Katu":       "#8b3a3a",
  "Bitter/Tikta":       "#2d6a4f",
  "Astringent/Kashaya": "#6a4a8a",
  "Neutral/Mild":       "#7a7a7a",
};

// Short description for each dosha shown after the user selects one
const DOSHA_DESC: Record<string, string> = {
  Vata:  "Warm, moist, grounding foods recommended",
  Pitta: "Cooling, mildly spiced foods recommended",
  Kapha: "Light, warm, stimulating foods recommended",
};

const DISH_TRANSLATIONS: Record<string, string> = {
  "Uble chawal": "Boiled rice",
  "Dal tadka": "Spiced lentil curry",
  "Sabzi": "Vegetable curry",
};

// Smart partial match (handles long names)
const getEnglishName = (dish: string) => {
  const key = Object.keys(DISH_TRANSLATIONS).find(k =>
    dish.toLowerCase().includes(k.toLowerCase())
  );
  return key ? DISH_TRANSLATIONS[key] : null;
};

// ─── TDEE and Gram Calculation (Frontend Logic) ───────────────────────────────
/**
 * calculateBMR
 * Uses the Mifflin-St Jeor equation to estimate calories burned at rest.
 * Male:   BMR = (10 x weight) + (6.25 x height) - (5 x age) + 5
 * Female: BMR = (10 x weight) + (6.25 x height) - (5 x age) - 161
 * This is referenced in report as [8] Frankenfield et al. (2005).
 */
function calculateBMR(
  age: number,
  gender: string,
  weightKg: number,
  heightCm: number
): number {
  if (gender.toLowerCase() === "male") {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  }
  return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
}

/**
 * calculateTDEE
 * Multiplies BMR by an activity factor to get total daily calorie need.
 * Low (sedentary) x1.2 | Moderate (light exercise) x1.55 | High (active) x1.725
 */
function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    Low:      1.2,
    Moderate: 1.55,
    High:     1.725,
  };
  return Math.round(bmr * (multipliers[activityLevel] ?? 1.2));
}

/**
 * calculateTotalMealGrams
 * Converts the user's TDEE into a gram weight for one meal.
 *
 * Steps:
 *   1. Meal calorie budget = TDEE x meal allocation %
 *      (Breakfast 25%, Lunch 40%, Dinner 30%)
 *   2. Apply BMI adjustment factor:
 *      Underweight x1.15 | Normal x1.0 | Overweight x0.9 | Obese x0.8
 *   3. Convert calories to grams: average Indian meal is ~2 kcal per gram
 *   4. Clamp result between 200g (minimum) and 800g (maximum)
 *
 * This logic is entirely in the frontend — no changes to the pkl model needed.
 */
function calculateTotalMealGrams(
  tdee: number,
  bmiCategory: string,
  mealCategory: string
): number {
  // Proportion of daily calories allocated per meal
  const mealAllocation: Record<string, number> = {
    Breakfast: 0.25,
    Lunch:     0.40,  // main meal gets the largest allocation
    Dinner:    0.30,  // lighter in the evening per Ayurvedic principle
  };

  // BMI-based scaling factor — heavier users get smaller portions
  const bmiFactors: Record<string, number> = {
    Underweight: 1.15,  // slightly more food
    Normal:      1.00,  // standard
    Overweight:  0.90,  // slightly less
    Obese:       0.80,  // controlled portion
  };

  const allocation = mealAllocation[mealCategory] ?? 0.33;
  const factor     = bmiFactors[bmiCategory]      ?? 1.00;

  // Calories for this meal after BMI adjustment
  const mealCalories = tdee * allocation * factor;

  // Convert to grams — average Indian meal ~2 kcal per gram
  const caloriesPerGram = 1.8;
  const totalGrams = Math.round(mealCalories /caloriesPerGram);

  // Clamp to a sensible range
  return Math.max(200, Math.min(800, totalGrams));
}

/**
 * getDishGrams
 * Calculates the gram amount for one specific dish.
 * e.g. dish is 35% of a 500g meal -> 175g
 */
function getDishGrams(portionPct: number, totalGrams: number): number {
  return Math.round((portionPct / 100) * totalGrams);
}

//Small UI Components 

/** Section heading with emoji icon and uppercase label */
function SectionLabel({ icon, children }: { icon: string; children: string }) {
  return (
    <View style={s.sl}>
      <Text style={s.sli}>{icon}</Text>
      <Text style={s.slt}>{children}</Text>
    </View>
  );
}

/** White card container with a coloured top accent bar */
function Card({ children, accent = T.leaf }: {
  children: React.ReactNode; accent?: string;
}) {
  return (
    <View style={s.card}>
      <View style={[s.cardBar, { backgroundColor: accent }]} />
      <View style={s.cardBody}>{children}</View>
    </View>
  );
}

/** Horizontal scrollable pill selector for choosing from a list of options */
function SelectPill({
  label, value, options, onChange,
}: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <View style={s.fg}>
      <Text style={s.fl}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
        <View style={s.pr}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt}
              onPress={() => onChange(opt)}
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

/** Labelled text input field */
function InputField({
  label, value, onChange, keyboardType = "default", placeholder = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  keyboardType?: any; placeholder?: string;
}) {
  return (
    <View style={s.fg}>
      <Text style={s.fl}>{label}</Text>
      <TextInput
        style={s.inp}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={T.inkLight}
      />
    </View>
  );
}

/** Animated-style progress dots showing which step the user is on */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={s.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            i < current  ? s.dDone   :
            i === current ? s.dActive :
                            s.dIdle,
          ]}
        />
      ))}
    </View>
  );
}

/** Suitability score badge — color-coded: green >= 70, gold >= 50, red < 50 */
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? T.leaf : score >= 50 ? T.gold : T.redSoft;
  return (
    <View style={[s.scoreBadge, { borderColor: color }]}>
      <Text style={[s.scoreNum, { color }]}>{score}</Text>
      <Text style={[s.scoreLabel, { color }]}>/100</Text>
    </View>
  );
}

/** Coloured pill tag showing the Ayurvedic taste (Rasa) of a dish */
function RasaTag({ rasa }: { rasa: string }) {
  const color = RASA_COLOR[rasa] ?? T.inkLight;
  return (
    <View style={[s.rasaTag, { borderColor: color }]}>
      <Text style={[s.rasaText, { color }]}>{rasa}</Text>
    </View>
  );
}

/** Small green pill showing gram amount — e.g. "175g" */
function GramPill({ grams }: { grams: number }) {
  return (
    <View style={s.gramPill}>
      <Text style={s.gramText}>{grams}g</Text>
    </View>
  );
}

/** Thin horizontal progress bar showing portion percentage visually */
function PortionBar({ pct }: { pct: number }) {
  return (
    <View style={s.barTrack}>
      <View style={[s.barFill, { width: `${Math.min(100, pct)}%` as any }]} />
    </View>
  );
}

// ─── PDF Report Builder ───────────────────────────────────────────────────────
/**
 * buildPDF
 * Generates a complete HTML string for the downloadable PDF report.
 * Called when the user taps "Download Diet Plan PDF".
 * Includes: patient profile, health metrics, meal options with gram portions,
 * Ayurvedic classification (Rasa + Guna), nutritional values, and foods to avoid.
 */
function buildPDF(
  result: ResultData,
  formData: FormData,
  totalMealGrams: number
): string {
  const date = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  // BMI badge color in the PDF
  const bmiColor =
    result.bmi_category === "Normal"      ? "#2d6a4f" :
    result.bmi_category === "Underweight" ? "#b08d57" :
    result.bmi_category === "Overweight"  ? "#c07a30" : "#b03030";

  // Build each meal option section
  const mealOptionsHTML = result.meal_options.map(opt => {
    // Dish rows with gram amounts
    const dishRows = opt.dishes.map((d, i) => {
      const grams = getDishGrams(d.portion_pct, totalMealGrams);
      return `
        <tr style="background:${i % 2 === 0 ? "#fff" : "#faf8f4"};
          border-bottom:1px solid #e4e0d8">
          <td style="padding:9px 10px;font-size:13px;font-weight:500">${d.dish}</td>
          <td style="padding:9px 10px;font-size:12px;color:#2d6a4f">${d.rasa}</td>
          <td style="padding:9px 10px;font-size:12px;color:#6b4c2a">${d.guna}</td>
          <td style="padding:9px 10px;text-align:center;font-weight:700;
            color:#2d6a4f;font-size:12px">${d.portion_pct}%</td>
          <td style="padding:9px 10px;text-align:center">
            <span style="background:#d8f3dc;color:#2d6a4f;font-size:11px;
              font-weight:700;padding:2px 8px;border-radius:99px;
              border:1px solid #a8d5b5">${grams}g</span>
          </td>
        </tr>`;
    }).join("");

    // Nutrition boxes
    const nutBoxes = [
      { l: "Calories", v: opt.calories, u: "kcal", c: "#b03030" },
      { l: "Protein",  v: opt.protein,  u: "g",    c: "#2d6a4f" },
      { l: "Carbs",    v: opt.carbs,    u: "g",    c: "#b08d57" },
      { l: "Fats",     v: opt.fats,     u: "g",    c: "#6b4c2a" },
    ].map(({ l, v, u, c }) => `
      <div style="background:${c}10;border:1px solid ${c}40;border-radius:8px;
        padding:10px;text-align:center;flex:1">
        <div style="font-size:20px;font-weight:800;color:${c}">${v}</div>
        <div style="font-size:10px;color:#7a7a7a;margin-top:2px">${u} · ${l}</div>
      </div>`).join("");

    // Reasons box (top meal only)
    const reasonHTML = opt.is_top && opt.reasons.length > 0 ? `
      <div style="background:#f0f7f3;border-left:3px solid #2d6a4f;
        padding:12px;border-radius:0 8px 8px 0;margin-top:14px">
        <div style="font-size:11px;font-weight:700;color:#2d6a4f;
          text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px">
          Why we recommend this meal
        </div>
        ${opt.reasons.map(r =>
          `<div style="font-size:12px;color:#3a3a3a;margin-bottom:5px">
            • ${r.charAt(0).toUpperCase() + r.slice(1)}
          </div>`
        ).join("")}
      </div>` : "";

    return `
      <div style="margin-bottom:22px;
        border:1px solid ${opt.is_top ? "#2d6a4f" : "#e4e0d8"};
        border-radius:10px;overflow:hidden">
        <div style="padding:10px 16px;
          background:${opt.is_top ? "#2d6a4f" : "#f4f1eb"};
          display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:700;
            color:${opt.is_top ? "#fff" : "#1a1a1a"};font-size:14px">
            ${opt.is_top ? "⭐ " : ""}Meal Option ${opt.option_number}
            ${opt.is_top ? " — Top Recommendation" : ""}
          </span>
          <span style="background:${opt.is_top ? "rgba(255,255,255,0.2)" : "#e4e0d8"};
            color:${opt.is_top ? "#fff" : "#3a3a3a"};
            padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600">
            Score: ${opt.suitability_score}/100
          </span>
        </div>
        <div style="padding:14px 16px">
          <table style="width:100%;border-collapse:collapse;margin-bottom:14px">
            <thead>
              <tr style="background:#f4f1eb">
                <th style="padding:8px 10px;text-align:left;font-size:11px;
                  color:#7a7a7a;text-transform:uppercase">Dish</th>
                <th style="padding:8px 10px;text-align:left;font-size:11px;
                  color:#7a7a7a;text-transform:uppercase">Rasa</th>
                <th style="padding:8px 10px;text-align:left;font-size:11px;
                  color:#7a7a7a;text-transform:uppercase">Guna</th>
                <th style="padding:8px 10px;text-align:center;font-size:11px;
                  color:#7a7a7a;text-transform:uppercase">Portion</th>
                <th style="padding:8px 10px;text-align:center;font-size:11px;
                  color:#7a7a7a;text-transform:uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>${dishRows}</tbody>
            <tr style="background:#d8f3dc">
              <td colspan="3" style="padding:9px 10px;font-weight:700;
                color:#2d6a4f;font-size:13px">Total Meal Weight</td>
              <td style="padding:9px 10px;text-align:center;font-weight:700;
                color:#2d6a4f">100%</td>
              <td style="padding:9px 10px;text-align:center">
                <span style="background:#2d6a4f;color:#fff;font-size:11px;
                  font-weight:700;padding:3px 9px;border-radius:99px">
                  ${totalMealGrams}g
                </span>
              </td>
            </tr>
          </table>
          <div style="display:flex;gap:8px;margin-bottom:4px">${nutBoxes}</div>
          ${reasonHTML}
        </div>
      </div>`;
  }).join("");

  // Foods to avoid pills
  const avoidHTML = result.foods_to_avoid.map(f =>
    `<span style="background:#fff0f0;border:1px solid #e07070;color:#b03030;
      font-size:12px;font-weight:500;padding:4px 12px;border-radius:99px;
      display:inline-block;margin:3px">${f}</span>`
  ).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <style>
    * { box-sizing:border-box; margin:0; padding:0 }
    body { font-family:Georgia,serif; background:#faf8f4; color:#1a1a1a }
    .page { max-width:840px; margin:0 auto }
    .banner { background:#1a3a2a; padding:36px 44px 30px }
    .accent { height:3px; background:#b08d57; margin-bottom:22px }
    .h1 { font-size:28px; color:#faf8f4; font-weight:bold; text-align:center }
    .sub { font-size:12px; color:#a8d5b5; text-align:center; margin-top:6px; font-style:italic }
    .meta { font-size:10px; color:#6b9a7a; text-align:center; margin-top:4px }
    .content { padding:30px 44px }
    .sec { margin-bottom:26px }
    .sh { display:flex; align-items:center; gap:8px; margin-bottom:14px }
    .sl { width:3px; height:18px; background:#2d6a4f; border-radius:2px }
    .st { font-size:11px; font-weight:700; color:#2d6a4f;
      text-transform:uppercase; letter-spacing:1.2px }
    .cap { font-size:10px; color:#7a7a7a; margin-top:8px; font-style:italic }
    .foot { background:#1a3a2a; color:#6b9a7a; font-size:10px;
      text-align:center; padding:14px; margin-top:30px }
  </style></head><body>
  <div class="page">
    <div class="banner">
      <div class="accent"></div>
      <div class="h1">Arogya — Ayurvedic Diet Plan Report</div>
      <div class="sub">Personalised Dietary Recommendation · Rooted in Ayurvedic Wisdom</div>
      <div class="meta">Generated on ${date} &nbsp;·&nbsp; Arogya Research System</div>
    </div>
    <div class="content">

      <div class="sec">
        <div class="sh"><div class="sl"></div>
          <span class="st">Patient Profile</span></div>
        <table style="width:100%;border-collapse:collapse;
          border:1px solid #e4e0d8;border-radius:10px;overflow:hidden">
          ${[
            ["Age",            `${formData.age} years`],
            ["Gender",         formData.gender],
            ["Weight",         `${formData.weight} kg`],
            ["Height",         `${formData.height} cm`],
            ["Activity Level", formData.activity_level],
            ["Dosha",          formData.dosha],
            ["Condition",      formData.disease],
            ["Diet",           formData.diet_preference],
          ].map(([l, v], i) => `
            <tr style="background:${i % 2 === 0 ? "#faf8f4" : "#fff"};
              border-bottom:1px solid #e4e0d8">
              <td style="padding:10px 14px;font-size:12px;color:#7a7a7a;width:40%">${l}</td>
              <td style="padding:10px 14px;font-size:12px;font-weight:600">${v}</td>
            </tr>`).join("")}
        </table>
      </div>

      <div class="sec">
        <div class="sh"><div class="sl"></div>
          <span class="st">Health Metrics</span></div>
        <div style="display:inline-flex;align-items:center;gap:14px;
          border:2px solid ${bmiColor};border-radius:12px;padding:14px 22px;
          margin-bottom:14px;background:${bmiColor}0d">
          <span style="font-size:40px;font-weight:800;color:${bmiColor}">${result.bmi}</span>
          <div>
            <div style="font-size:14px;font-weight:700;color:${bmiColor}">
              ${result.bmi_category.toUpperCase()}
            </div>
            <div style="font-size:10px;color:#7a7a7a">kg/m² · ML Verified</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
          ${[
            ["TDEE",                           `${result.tdee} kcal/day`],
            [`${result.meal_category} Target`, `${result.target_calories} kcal`],
            ["Total Meal Weight",              `${totalMealGrams}g`],
            ["Dosha",                          result.dosha],
          ].map(([l, v]) => `
            <div style="border:1px solid #e4e0d8;border-radius:8px;
              padding:12px;text-align:center">
              <div style="font-size:15px;font-weight:700;color:#1a3a2a">${v}</div>
              <div style="font-size:10px;color:#7a7a7a;margin-top:2px">${l}</div>
            </div>`).join("")}
        </div>
        <div class="cap">
          Meal weight is BMI-adjusted via TDEE using the Mifflin-St Jeor equation.
        </div>
      </div>

      <div class="sec">
        <div class="sh"><div class="sl"></div>
          <span class="st">Meal Recommendations — ${result.meal_category}</span></div>
        ${mealOptionsHTML}
      </div>

      <div class="sec">
        <div class="sh"><div class="sl"></div>
          <span class="st">Foods to Avoid — ${result.disease}</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${avoidHTML}</div>
      </div>

    </div>
    <div class="foot">
      For wellness guidance only. Consult a qualified Ayurvedic physician
      before making dietary changes. · Arogya Research System
    </div>
  </div></body></html>`;
}

// Main Screen 
export default function DietScreen() {

  // step: 0=Personal, 1=Health, 2=Meal Preferences, 3=Review, 4=Results
  const [step,           setStep]           = useState(0);
  const [formData,       setFormData]       = useState<FormData>({
    age: "", gender: "", weight: "", height: "", activity_level: "",
    disease: "", dosha: "", meal_category: "", diet_preference: "",
  });
  const [result,         setResult]         = useState<ResultData | null>(null);
  const [loading,        setLoading]        = useState(false);
  const [pdfLoading,     setPdfLoading]     = useState(false);
  const [pdfDone,        setPdfDone]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [prakritiLoaded, setPrakritiLoaded] = useState(false);

  // ── Auto-load dominant dosha from Supabase Prakriti quiz ─────────────────
  // If the user has completed the Prakriti assessment in the app,
  // their dominant dosha is pre-filled here so they don't need to re-select it
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const user     = await authService.currentUser();
          if (!user) return;
          const prakriti = await userService.getPrakriti(user.id);
          if (prakriti?.dominant) {
            const d = prakriti.dominant.charAt(0).toUpperCase()
                    + prakriti.dominant.slice(1);
            if (DOSHAS.includes(d)) {
              setFormData(f => ({ ...f, dosha: d }));
              setPrakritiLoaded(true); // triggers the "From your Prakriti" badge
            }
          }
        } catch {
          // Silently ignore — user can still select their dosha manually
        }
      })();
    }, [])
  );

  // Helper: update one form field and clear any displayed error
  const set = (key: keyof FormData) => (val: string) => {
    setFormData(f => ({ ...f, [key]: val }));
    setError(null);
  };

  // Validation for each step — prevents moving forward with missing fields
  const stepValid = [
    () => !!formData.age && !!formData.gender && !!formData.weight
          && !!formData.height && !!formData.activity_level,
    () => !!formData.disease && !!formData.dosha,
    () => !!formData.meal_category && !!formData.diet_preference,
    () => true, // review step is always passable
  ];

  // Calculate total meal grams from user's profile 
  // This uses the TDEE + BMI adjustment formula defined above

  const totalMealGrams = result
    ? calculateTotalMealGrams(result.tdee, result.bmi_category, result.meal_category)
    : 0;

  // API Call: POST user inputs to Flask backend 
  // The backend returns meal options; calculate gram portions here
  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        age:             parseInt(formData.age),
        gender:          formData.gender.toLowerCase(),
        weight_kg:       parseFloat(formData.weight),
        height_cm:       parseFloat(formData.height),
        activity_level:  formData.activity_level,
        disease:         formData.disease,
        dosha:           formData.dosha,
        meal_category:   formData.meal_category,
        diet_preference: formData.diet_preference,
      };

      const response = await fetch(`${DIET_API_URL}/predict_diet`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result as ResultData);
        setStep(4); // move to results screen
      } else {
        setError(data.error ?? "Failed to generate meal plan.");
      }
    } catch {
      setError("Could not connect to Arogya service. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [formData]);

  const handleNext = () => {
    if (!stepValid[step]()) {
      setError("Please fill all required fields.");
      return;
    }
    setError(null);
    if (step === 3) { handleGenerate(); return; } // step 3 = generate
    setStep(n => n + 1);
  };

  const handleBack = () => {
    setError(null);
    if (step === 4) { setStep(3); setResult(null); return; }
    setStep(n => Math.max(n - 1, 0));
  };

  // Reset form but keep the Prakriti dosha so the user doesn't need to re-select
  const handleReset = () => {
    setFormData(f => ({
      age: "", gender: "", weight: "", height: "", activity_level: "",
      disease: "", meal_category: "", diet_preference: "",
      dosha: f.dosha, // preserve the pre-filled dosha from Prakriti
    }));
    setResult(null);
    setError(null);
    setStep(0);
    setPdfDone(false);
  };

  // ── PDF Download ──────────────────────────────────────────────────────────
  const handleDownloadPDF = useCallback(async () => {
    if (!result) return;
    setPdfLoading(true);
    setPdfDone(false);
    try {
      // Generate HTML string and convert to PDF file
      const html    = buildPDF(result, formData, totalMealGrams);
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType:    "application/pdf",
          dialogTitle: "Save Arogya Diet Plan",
        });
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
  }, [result, formData, totalMealGrams]);

  // BMI badge color — reflects health category with color
  const bmiColor =
    result?.bmi_category === "Normal"      ? T.leaf    :
    result?.bmi_category === "Underweight" ? T.gold    :
    result?.bmi_category === "Overweight"  ? "#c07a30" :
    T.errorRed;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.sc}>

      {/* ── App Header ─────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.logoRing}>
          <Ionicons name="leaf" size={32} color={T.leaf} />
        </View>
        <Text style={s.headerTitle}>Arogya</Text>
        <Text style={s.headerSub}>Personalized Ayurvedic Based Dietary Recommendation</Text>
      </View>

      {/* ── Error Banner ────────────────────────────────────────────────────── */}
      {error && (
        <View style={s.errorBox}>
          <Ionicons name="alert-circle-outline" size={15} color={T.errorRed} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          STEP 0 — Personal Details
          Collects: age, gender, weight, height, activity level
          Activity level is needed to calculate the TDEE multiplier
      ────────────────────────────────────────────────────────────────────── */}
      {step === 0 && (
        <Card>
          <SectionLabel icon="🧍">Personal Details</SectionLabel>

          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <InputField label="Age (years)" value={formData.age}
                onChange={set("age")} keyboardType="numeric" placeholder="e.g. 30" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <SelectPill label="Gender" value={formData.gender}
                options={GENDERS} onChange={set("gender")} />
            </View>
          </View>

          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <InputField label="Weight (kg)" value={formData.weight}
                onChange={set("weight")} keyboardType="decimal-pad" placeholder="e.g. 65" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <InputField label="Height (cm)" value={formData.height}
                onChange={set("height")} keyboardType="decimal-pad" placeholder="e.g. 170" />
            </View>
          </View>

          {/* Activity level — Low/Moderate/High — used in TDEE multiplier */}
          <SelectPill label="Activity Level" value={formData.activity_level}
            options={ACTIVITIES} onChange={set("activity_level")} />

          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={14} color={T.leaf} />
            <Text style={s.infoText}>
              BMI and TDEE are calculated using the Mifflin-St Jeor equation.
              Dish gram portions are then personalised based on your TDEE and BMI category.
            </Text>
          </View>
        </Card>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          STEP 1 — Health Profile
          Collects: disease condition, dominant dosha
          Dosha is auto-filled from Prakriti quiz result if available
      ────────────────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <Card accent={T.gold}>
          <SectionLabel icon="🩺">Health Profile</SectionLabel>

          <SelectPill label="Disease Condition" value={formData.disease}
            options={DISEASES} onChange={set("disease")} />

          {/* Dosha selector — shows badge if pre-filled from Prakriti quiz */}
          <View style={s.fg}>
            <View style={s.doshaLabelRow}>
              <Text style={s.fl}>Dominant Dosha</Text>
              {prakritiLoaded && (
                <View style={s.prakritiTag}>
                  <Ionicons name="checkmark-circle" size={11} color={T.leaf} />
                  <Text style={s.prakritiTagText}>From your Prakriti</Text>
                </View>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={{ marginTop: 6 }}>
              <View style={s.pr}>
                {DOSHAS.map(opt => (
                  <TouchableOpacity key={opt} onPress={() => set("dosha")(opt)}
                    style={[s.pill, formData.dosha === opt && s.pillOn]}>
                    <Text style={[s.pt, formData.dosha === opt && s.ptOn]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Dosha description — shows dietary guideline for the selected dosha */}
          {formData.dosha ? (
            <View style={s.doshaBox}>
              <Text style={s.doshaIcon}>
                {formData.dosha === "Vata" ? "🌬️"
                  : formData.dosha === "Pitta" ? "🔥" : "🌊"}
              </Text>
              <Text style={s.doshaDesc}>{DOSHA_DESC[formData.dosha]}</Text>
            </View>
          ) : null}
        </Card>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          STEP 2 — Meal Preferences
          Meal category determines calorie allocation %:
          Breakfast=25%, Lunch=40%, Dinner=30%
      ────────────────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <Card>
          <SectionLabel icon="🍽️">Meal Preferences</SectionLabel>
          <SelectPill label="Meal Category" value={formData.meal_category}
            options={MEALS} onChange={set("meal_category")} />
          <SelectPill label="Dietary Preference" value={formData.diet_preference}
            options={PREFS} onChange={set("diet_preference")} />
          <View style={s.infoBox}>
            <Ionicons name="checkmark-circle-outline" size={14} color={T.leaf} />
            <Text style={s.infoText}>
              Lunch receives 40% of your TDEE, Breakfast 25%, and Dinner 30%.
              Each dish's gram portion is calculated proportionally from this budget.
            </Text>
          </View>
        </Card>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          STEP 3 — Review
          Displays all collected inputs before making the API call
      ────────────────────────────────────────────────────────────────────── */}
      {step === 3 && (
        <Card>
          <View style={s.reviewHeader}>
            <View style={s.reviewBar} />
            <Text style={s.reviewTitle}>Review Your Profile</Text>
            <View style={s.stepBadge}>
              <Text style={s.stepBadgeText}>Step 4 of 4</Text>
            </View>
          </View>

          <View style={s.reviewSection}>
            <Text style={s.reviewSectionTitle}>PERSONAL</Text>
            {[
              ["Age",      `${formData.age} years`],
              ["Gender",   formData.gender],
              ["Weight",   `${formData.weight} kg`],
              ["Height",   `${formData.height} cm`],
              ["Activity", formData.activity_level],
            ].map(([l, v]) => (
              <View key={l} style={s.reviewRow}>
                <Text style={s.reviewLabel}>{l}</Text>
                <Text style={s.reviewValue}>{v || "—"}</Text>
              </View>
            ))}
          </View>

          <View style={[s.reviewSection, { marginTop: 10 }]}>
            <Text style={s.reviewSectionTitle}>HEALTH & MEAL</Text>
            {[
              ["Condition",  formData.disease],
              ["Dosha",      `${formData.dosha}${prakritiLoaded ? " ✓" : ""}`],
              ["Meal",       formData.meal_category],
              ["Preference", formData.diet_preference],
            ].map(([l, v]) => (
              <View key={l} style={s.reviewRow}>
                <Text style={s.reviewLabel}>{l}</Text>
                <Text style={s.reviewValue}>{v || "—"}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          STEP 4 — Results
          Shows: BMI, TDEE, meal grams, foods to avoid, meal options
          Each meal option shows dishes with rasa, guna, portion %, grams
          Top recommendation is highlighted with reasoning bullets
      ────────────────────────────────────────────────────────────────────── */}
      {step === 4 && result && (
        <View>
          <View style={s.resultsHeader}>
            <View style={s.resultsBar} />
            <Text style={s.resultsTitle}>Your Personalised Plan</Text>
          </View>

          {/* ── Health Metrics Card ───────────────────────────────────────── */}
          <Card accent={bmiColor}>
            <SectionLabel icon="📊">Health Metrics</SectionLabel>

            {/* Large BMI number with category badge */}
            <View style={s.bmiRow}>
              <View>
                <Text style={[s.bmiNum, { color: bmiColor }]}>{result.bmi}</Text>
                <Text style={s.bmiUnit}>kg/m²</Text>
              </View>
              <View style={[s.bmiBadge, { borderColor: bmiColor }]}>
                <Text style={[s.bmiCat, { color: bmiColor }]}>
                  {result.bmi_category.toUpperCase()}
                </Text>
                <Text style={s.bmiVerify}>ML Verified</Text>
              </View>
            </View>

            {/* TDEE, meal target, total grams, dosha — all in one row */}
            <View style={s.metricsGrid}>
              {[
                { label: "TDEE",                            value: `${result.tdee}`,            unit: "kcal/day" },
                { label: `${result.meal_category} Target`,  value: `${result.target_calories}`, unit: "kcal" },
                { label: "Total Meal Weight",               value: `${totalMealGrams}`,         unit: "grams" },
                { label: "Dosha",                           value: result.dosha,                unit: "" },
              ].map(({ label, value, unit }) => (
                <View key={label} style={s.metricBox}>
                  <Text style={s.metricValue}>{value}</Text>
                  {unit ? <Text style={s.metricUnit}>{unit}</Text> : null}
                  <Text style={s.metricLabel}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Explain how the gram figure was derived */}
            <Text style={s.metricCaption}>
              Meal weight calculated via Mifflin-St Jeor TDEE ·{" "}
              {result.bmi_category} BMI adjustment ·{" "}
              {result.meal_category} allocation.
            </Text>
          </Card>

          {/* ── Foods to Avoid ────────────────────────────────────────────── */}
          <Card accent={T.errorRed}>
            <SectionLabel icon="🚫">Food to Avoid — {result.disease}</SectionLabel>
            <View style={s.avoidWrap}>
              {result.foods_to_avoid.map((f, i) => (
                <View key={i} style={s.avoidPill}>
                  <Text style={s.avoidText}>{f}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* ── Meal Option Cards ─────────────────────────────────────────── */}
          {result.meal_options.map((opt, idx) => (
            <Card key={idx} accent={opt.is_top ? T.leaf : T.border}>

              {/* Meal title*/}
              <View style={s.mealHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.mealTitle}>
                    {opt.is_top ? "⭐ " : ""}
                    Meal Option {opt.option_number}
                    {opt.is_top ? "  —  Top Recommendation" : ""}
                  </Text>
                </View>
              </View>

              {/* Column headers for the dish table */}
              <View style={s.dishTableHeader}>
                <Text style={[s.dishHeaderCell, { flex: 3 }]}>Dish</Text>
                <Text style={[s.dishHeaderCell, { flex: 1, textAlign: "center" }]}>Grams</Text>
              </View>

{/* One row per dish — showing rasa, guna, portion %, gram amount */}
{opt.dishes.map((d, di) => {
  
  const dishCount = opt.dishes?.length || 1;

  // smarter weighted distribution (first dish gets more, last gets less)
  const dishWeights = dishCount === 4
    ? [0.4, 0.3, 0.2, 0.1]
    : Array(dishCount)
        .fill(1 / dishCount); // fallback equal split if not 4 dishes

  const weight = dishWeights[di] ?? (1 / dishCount);

  const dishGrams = Math.round(totalMealGrams * weight);

  return (
                  <View key={di}
                    style={[s.dishRow, di % 2 === 0 ? s.dishEven : s.dishOdd]}>

                    {/* Dish info: name, rasa tag, guna tag, portion bar */}
                    <View style={{ flex: 3 }}>
                      <View style={s.dishNameRow}>
                        <View style={s.dishDot} />
                        <TouchableOpacity
                          onPress={() => {
                            const query = encodeURIComponent(d.dish);
                            Linking.openURL(`https://www.google.com/search?q=${query}`);
                          }}
                        >
                        <Text style={s.dishName}>
                          {d.dish}
                          {getEnglishName(d.dish) ? ` (${getEnglishName(d.dish)})` : " 🔍"}
                        </Text>
                      </TouchableOpacity>
                      </View>
                      <View style={s.dishTags}>
                        <RasaTag rasa={d.rasa} />
                        <View style={s.gunaTag}>
                          <Text style={s.gunaText}>{d.guna}</Text>
                        </View>
                      </View>
                      <View style={{ marginTop: 4, paddingLeft: 14 }}>
                        <PortionBar pct={d.portion_pct} />
                      </View>
                    </View>

                    

                    {/* Gram amount — calculated in frontend from TDEE + BMI */}
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                      <GramPill grams={dishGrams} />
                    </View>
                  </View>
                );
              })}

              {/* Total meal weight row */}
              <View style={s.dishTotalRow}>
                <Text style={s.dishTotalLabel}>Total Meal Weight</Text>
                
                <View style={s.dishTotalGram}>
                  <Text style={s.dishTotalGramText}>{totalMealGrams}g</Text>
                </View>
              </View>

              {/* Caption explaining how grams were derived */}
              <Text style={s.portionCaption}>
                Grams are BMI-adjusted via TDEE (Mifflin-St Jeor) ·{" "}
                {result.bmi_category} · {result.meal_category} allocation.
              </Text>

              {/* Nutritional breakdown — calories, protein, carbs, fats */}
              <View style={s.nutSection}>
                <Text style={s.nutTitle}>Nutritional Values</Text>
                <View style={s.nutGrid}>
                  {[
                    { label: "Calories", value: opt.calories, unit: "kcal", color: T.errorRed },
                    { label: "Protein",  value: opt.protein,  unit: "g",    color: T.leaf },
                    { label: "Carbs",    value: opt.carbs,    unit: "g",    color: T.gold },
                    { label: "Fats",     value: opt.fats,     unit: "g",    color: T.bark },
                  ].map(({ label, value, unit, color }) => (
                    <View key={label} style={[s.nutBox, { borderColor: color + "40" }]}>
                      <Text style={[s.nutBoxVal, { color }]}>{value}</Text>
                      <Text style={s.nutBoxUnit}>{unit}</Text>
                      <Text style={s.nutBoxLabel}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Recommendation reasoning — only for the top meal option */}
              {opt.is_top && opt.reasons.length > 0 && (
                <View style={s.reasonBox}>
                  <Text style={s.reasonTitle}>Why we recommend this meal</Text>
                  {opt.reasons.map((r, ri) => (
                    <View key={ri} style={s.reasonRow}>
                      <View style={s.reasonDot} />
                      <Text style={s.reasonText}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          ))}
        {/* ── Ayurvedic Glossary — shown once after all meal options ── */}
<View style={s.glossaryCard}>

  {/* Header */}
  <View style={s.glossaryHeader}>
    <Text style={s.glossaryIcon}>🌿</Text>
    <View>
      <Text style={s.glossaryTitle}>Understanding Your Meal</Text>
      <Text style={s.glossarySubtitle}>Ayurvedic classification guide</Text>
    </View>
  </View>

  <View style={s.glossaryDivider} />

  {/* Rasa */}
  <View style={s.glossarySection}>
    <View style={s.glossarySectionHeader}>
      <View style={[s.glossaryDot, { backgroundColor: "#b08d57" }]} />
      <Text style={s.glossarySectionTitle}>Rasa — Six Tastes</Text>
    </View>
    <Text style={s.glossarySectionDesc}>
      In Ayurveda, every food carries one or more of the six tastes.
      Each taste has a specific effect on the body and dosha balance.
    </Text>
    <View style={s.glossaryGrid}>
      {[
        { taste: "Sweet",       skt: "Madhura", desc: "Nourishing, calming",        color: "#b08d57" },
        { taste: "Sour",        skt: "Amla",    desc: "Stimulates digestion",       color: "#c0533a" },
        { taste: "Salty",       skt: "Lavana",  desc: "Improves appetite",          color: "#3a6fa8" },
        { taste: "Pungent",     skt: "Katu",    desc: "Boosts metabolism",          color: "#8b3a3a" },
        { taste: "Bitter",      skt: "Tikta",   desc: "Detoxifying, light",         color: "#2d6a4f" },
        { taste: "Astringent",  skt: "Kashaya", desc: "Drying, cooling",            color: "#6a4a8a" },
      ].map(({ taste, skt, desc, color }) => (
        <View key={taste} style={[s.glossaryPill, { borderLeftColor: color }]}>
          <Text style={[s.glossaryPillTitle, { color }]}>{taste}</Text>
          <Text style={s.glossaryPillSkt}>{skt}</Text>
          <Text style={s.glossaryPillDesc}>{desc}</Text>
        </View>
      ))}
    </View>
  </View>

  <View style={s.glossaryDivider} />

  {/* Guna */}
  <View style={s.glossarySection}>
    <View style={s.glossarySectionHeader}>
      <View style={[s.glossaryDot, { backgroundColor: "#6b4c2a" }]} />
      <Text style={s.glossarySectionTitle}>Guna — Food Quality</Text>
    </View>
    <Text style={s.glossarySectionDesc}>
      Guna describes the physical nature of food and how it behaves during digestion.
    </Text>
    <View style={s.glossaryRow}>
      {[
        { label: "Light",  desc: "Easy to digest, recommended for weak digestion" },
        { label: "Heavy",  desc: "Provides strength, digests slower" },
        { label: "Oily",   desc: "Lubricating, good for Vata types" },
        { label: "Dry",    desc: "Absorbs moisture, suitable for Kapha" },
        { label: "Hot",    desc: "Heating effect, aids Vata and Kapha" },
        { label: "Cold",   desc: "Cooling effect, balances Pitta" },
        { label: "Mild",   desc: "Gentle on digestion, neutral effect" },
      ].map(({ label, desc }) => (
        <View key={label} style={s.glossaryRowItem}>
          <View style={s.glossaryRowDot} />
          <View style={{ flex: 1 }}>
            <Text style={s.glossaryRowLabel}>{label}</Text>
            <Text style={s.glossaryRowDesc}>{desc}</Text>
          </View>
        </View>
      ))}
    </View>
  </View>

  <View style={s.glossaryDivider} />

  {/* Virya */}
  <View style={s.glossarySection}>
    <View style={s.glossarySectionHeader}>
      <View style={[s.glossaryDot, { backgroundColor: "#2d6a4f" }]} />
      <Text style={s.glossarySectionTitle}>Virya — Potency</Text>
    </View>
    <Text style={s.glossarySectionDesc}>
      Virya refers to the heating or cooling effect a food produces after consumption.
    </Text>
    <View style={s.glossaryTwoCol}>
      <View style={[s.glossaryVirya, { borderColor: "#c0533a" + "60", backgroundColor: "#c0533a" + "08" }]}>
        <Text style={[s.glossaryViryaIcon]}>🔥</Text>
        <Text style={[s.glossaryViryaTitle, { color: "#c0533a" }]}>Heating</Text>
        <Text style={s.glossaryViryaDesc}>
          Boosts digestion and metabolism.
        </Text>
      </View>
      <View style={[s.glossaryVirya, { borderColor: "#3a6fa8" + "60", backgroundColor: "#3a6fa8" + "08" }]}>
        <Text style={[s.glossaryViryaIcon]}>❄️</Text>
        <Text style={[s.glossaryViryaTitle, { color: "#3a6fa8" }]}>Cooling</Text>
        <Text style={s.glossaryViryaDesc}>
          Calms and balances the body.
        </Text>
      </View>
    </View>
  </View>

</View>
          {/* ── PDF Download Button ────────────────────────────────────────── */}
          <TouchableOpacity
            style={[s.pdfBtn, pdfLoading && s.btnDisabled]}
            onPress={handleDownloadPDF}
            disabled={pdfLoading}
          >
            {pdfLoading
              ? <ActivityIndicator size="small" color={T.white} />
              : pdfDone
                ? <><Ionicons name="checkmark-circle" size={18} color={T.white} />
                    <Text style={s.pdfText}>PDF Ready!</Text></>
                : <><Ionicons name="download-outline" size={18} color={T.white} />
                    <Text style={s.pdfText}>Download Diet Plan PDF</Text></>
            }
          </TouchableOpacity>
          

          {/* ── Disclaimer ────────────────────────────────────────────────── */}
          <View style={s.disclaimer}>
            <Ionicons name="shield-checkmark-outline" size={13} color={T.inkLight} />
            <Text style={s.disclaimerText}>
              Supportive guidance only. Consult a qualified healthcare professional
              before making major dietary changes.
            </Text>
          </View>
        </View>
      )}

      {/* Step progress indicator */}
      {step < 4 && <StepDots current={step} total={4} />}

      {/* ── Navigation Buttons ────────────────────────────────────────────── */}
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
                  <Text style={s.btnPrimaryText}>
                    {step === 3 ? "Generate Plan" : "Continue"}
                  </Text>
                  <Ionicons
                    name={step === 3 ? "sparkles" : "arrow-forward"}
                    size={15}
                    color={T.white}
                  />
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
  screen: { flex: 1, backgroundColor: T.bg },
  sc:     { padding: 16, paddingBottom: 52 },

  // App header
  header:      { alignItems: "center", marginBottom: 20, paddingTop: 8 },
  logoRing:    { width: 72, height: 72, borderRadius: 36, backgroundColor: T.sagePale,
                 alignItems: "center", justifyContent: "center", marginBottom: 10,
                 borderWidth: 1.5, borderColor: T.borderG },
  headerTitle: { fontSize: 24, fontWeight: "800", color: T.forest, letterSpacing: -0.5 },
  headerSub:   { fontSize: 12, color: T.inkLight, marginTop: 3 },

  // Error banner
  errorBox:  { flexDirection: "row", alignItems: "center", gap: 8,
               backgroundColor: T.redPale, borderWidth: 1, borderColor: T.redSoft,
               borderRadius: 10, padding: 10, marginBottom: 12 },
  errorText: { flex: 1, fontSize: 13, color: T.errorRed },

  // Card container
  card:     { backgroundColor: T.surface, borderRadius: 14, borderWidth: 1,
              borderColor: T.border, marginBottom: 14, overflow: "hidden",
              ...Platform.select({
                ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
                           shadowOpacity: 0.06, shadowRadius: 8 },
                android: { elevation: 2 },
              }) },
  cardBar:  { height: 4 },
  cardBody: { padding: 16 },

  // Section label
  sl:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  sli: { fontSize: 14 },
  slt: { fontSize: 10, fontWeight: "700", color: T.leaf,
         textTransform: "uppercase", letterSpacing: 1.2 },

  // Form
  fg:  { marginBottom: 14 },
  fl:  { fontSize: 12, fontWeight: "600", color: T.inkMid, marginBottom: 4 },
  inp: { borderWidth: 1, borderColor: T.border, borderRadius: 10,
         paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
         color: T.inkDark, backgroundColor: T.parchment },
  pr:     { flexDirection: "row", gap: 8 },
  pill:   { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99,
            borderWidth: 1.5, borderColor: T.border, backgroundColor: T.white },
  pillOn: { borderColor: T.leaf, backgroundColor: T.sagePale },
  pt:     { fontSize: 13, color: T.inkLight, fontWeight: "500" },
  ptOn:   { color: T.leaf, fontWeight: "700" },
  row2:   { flexDirection: "row", marginBottom: 0 },

  infoBox:  { flexDirection: "row", alignItems: "flex-start", gap: 8,
              backgroundColor: T.sagePale, borderRadius: 8, padding: 10, marginTop: 4 },
  infoText: { flex: 1, fontSize: 12, color: T.leaf, lineHeight: 17 },

  doshaLabelRow:   { flexDirection: "row", alignItems: "center",
                     justifyContent: "space-between" },
  prakritiTag:     { flexDirection: "row", alignItems: "center", gap: 3,
                     backgroundColor: T.sagePale, paddingHorizontal: 8, paddingVertical: 2,
                     borderRadius: 99, borderWidth: 1, borderColor: T.borderG },
  prakritiTagText: { fontSize: 10, color: T.leaf, fontWeight: "600" },
  doshaBox:  { flexDirection: "row", alignItems: "center", gap: 10,
               backgroundColor: T.goldPale, borderRadius: 8, padding: 10, marginTop: 4,
               borderWidth: 1, borderColor: T.gold + "50" },
  doshaIcon: { fontSize: 20 },
  doshaDesc: { flex: 1, fontSize: 12, color: T.bark, lineHeight: 17 },

  // Step dots
  dots:    { flexDirection: "row", justifyContent: "center", gap: 6, marginVertical: 16 },
  dot:     { width: 7, height: 7, borderRadius: 3.5 },
  dDone:   { backgroundColor: T.sage },
  dActive: { backgroundColor: T.leaf, width: 20, borderRadius: 3.5 },
  dIdle:   { backgroundColor: T.border },

  // Review step
  reviewHeader:       { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  reviewBar:          { width: 4, height: 20, borderRadius: 2, backgroundColor: T.leaf },
  reviewTitle:        { fontSize: 15, fontWeight: "700", color: T.inkDark, flex: 1 },
  stepBadge:          { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99,
                        backgroundColor: T.sagePale, borderWidth: 1, borderColor: T.borderG },
  stepBadgeText:      { fontSize: 10, fontWeight: "700", color: T.leaf },
  reviewSection:      { borderRadius: 10, borderWidth: 1, borderColor: T.borderG,
                        overflow: "hidden" },
  reviewSectionTitle: { fontSize: 10, fontWeight: "700", color: T.leaf, letterSpacing: 1.2,
                        paddingHorizontal: 12, paddingVertical: 8, backgroundColor: T.sagePale,
                        borderBottomWidth: 1, borderBottomColor: T.borderG },
  reviewRow:          { flexDirection: "row", justifyContent: "space-between",
                        paddingHorizontal: 12, paddingVertical: 9,
                        borderBottomWidth: 1, borderBottomColor: T.border },
  reviewLabel:        { fontSize: 13, color: T.inkLight },
  reviewValue:        { fontSize: 13, fontWeight: "600", color: T.inkDark },

  // Results header
  resultsHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  resultsBar:    { width: 4, height: 26, borderRadius: 2, backgroundColor: T.leaf },
  resultsTitle:  { fontSize: 18, fontWeight: "800", color: T.inkDark },

  // BMI display
  bmiRow:    { flexDirection: "row", alignItems: "flex-end", gap: 14, marginBottom: 12 },
  bmiNum:    { fontSize: 44, fontWeight: "800", lineHeight: 48 },
  bmiUnit:   { fontSize: 12, color: T.inkLight, marginBottom: 6 },
  bmiBadge:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1.5 },
  bmiCat:    { fontSize: 12, fontWeight: "700", letterSpacing: 0.8 },
  bmiVerify: { fontSize: 10, color: T.inkLight, marginTop: 2 },

  // TDEE + metrics row
  metricsGrid:   { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  metricBox:     { flex: 1, minWidth: "22%", backgroundColor: T.parchment, borderRadius: 8,
                   padding: 10, alignItems: "center", borderWidth: 1, borderColor: T.border },
  metricValue:   { fontSize: 15, fontWeight: "700", color: T.inkDark },
  metricUnit:    { fontSize: 9, color: T.inkLight },
  metricLabel:   { fontSize: 9, color: T.inkLight, marginTop: 2, textAlign: "center" },
  metricCaption: { fontSize: 10, color: T.inkLight, marginTop: 8,
                   lineHeight: 15, fontStyle: "italic" },

  // Foods to avoid
  avoidWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  avoidPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99,
               backgroundColor: T.redPale, borderWidth: 1, borderColor: T.redSoft },
  avoidText: { fontSize: 12, fontWeight: "500", color: T.errorRed },

  // Meal card header
  mealHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  mealTitle:  { fontSize: 14, fontWeight: "700", color: T.inkDark },

  // Score badge
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
                borderWidth: 1.5, alignItems: "center" },
  scoreNum:   { fontSize: 14, fontWeight: "800", lineHeight: 18 },
  scoreLabel: { fontSize: 9, fontWeight: "600" },

  // Dish table header
  dishTableHeader: { flexDirection: "row", backgroundColor: T.sagePale, borderRadius: 6,
                     paddingHorizontal: 8, paddingVertical: 7, marginBottom: 2 },
  dishHeaderCell:  { fontSize: 10, fontWeight: "700", color: T.leaf,
                     textTransform: "uppercase", letterSpacing: 0.8 },

  // Dish rows
  dishRow:     { flexDirection: "row", alignItems: "center", paddingVertical: 10,
                 paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: T.border },
  dishEven:    { backgroundColor: T.parchment + "90" },
  dishOdd:     { backgroundColor: T.white },
  dishNameRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  dishDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: T.sage,
                 marginTop: 5, flexShrink: 0 },
  dishName:    { flex: 1, fontSize: 13, color: T.inkDark, fontWeight: "500", lineHeight: 18 },
  dishTags:    { flexDirection: "row", flexWrap: "wrap", gap: 4,
                 marginTop: 5, paddingLeft: 12 },
  dishesLabel: { fontSize: 10, fontWeight: "700", color: T.inkLight,
                 textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },

  // Rasa + Guna tags
  rasaTag:  { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, borderWidth: 1 },
  rasaText: { fontSize: 10, fontWeight: "600" },
  gunaTag:  { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99,
              backgroundColor: T.goldPale, borderWidth: 1, borderColor: T.gold + "50" },
  gunaText: { fontSize: 10, color: T.bark, fontWeight: "500" },

  // Portion % text
  pctText: { fontSize: 13, fontWeight: "700", color: T.leaf },

  // Gram pill
  gramPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
              backgroundColor: T.sagePale, borderWidth: 1, borderColor: T.borderG },
  gramText: { fontSize: 11, fontWeight: "700", color: T.leaf },

  // Portion bar
  barTrack: { height: 3, borderRadius: 99, backgroundColor: T.border,
              overflow: "hidden", width: "85%" },
  barFill:  { height: "100%", borderRadius: 99, backgroundColor: T.sage },

  // Total row
  dishTotalRow:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 8,
                      paddingVertical: 9, backgroundColor: T.sagePale,
                      borderRadius: 6, marginTop: 4 },
  dishTotalLabel:   { flex: 3, fontSize: 12, fontWeight: "700", color: T.leaf },
  dishTotalPct:     { flex: 1, fontSize: 12, fontWeight: "700", color: T.leaf,
                      textAlign: "center" },
  dishTotalGram:    { flex: 1, alignItems: "center" },
  dishTotalGramText:{ fontSize: 12, fontWeight: "800", color: T.forest,
                      backgroundColor: T.leaf + "20", paddingHorizontal: 8,
                      paddingVertical: 3, borderRadius: 99 },
  portionCaption:   { fontSize: 10, color: T.inkLight, marginTop: 6,
                      lineHeight: 15, fontStyle: "italic" },

  // Nutrition grid
  nutSection:  { marginTop: 12 },
  nutTitle:    { fontSize: 10, fontWeight: "700", color: T.inkLight,
                 textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  nutGrid:     { flexDirection: "row", gap: 6 },
  nutBox:      { flex: 1, borderRadius: 8, borderWidth: 1, padding: 8,
                 alignItems: "center", backgroundColor: T.parchment },
  nutBoxVal:   { fontSize: 16, fontWeight: "800" },
  nutBoxUnit:  { fontSize: 9, color: T.inkLight },
  nutBoxLabel: { fontSize: 9, color: T.inkLight, marginTop: 1 },

  // Reasons box (top meal only)
  reasonBox:   { backgroundColor: T.sagePale, borderLeftWidth: 3, borderLeftColor: T.leaf,
                 borderRadius: 8, padding: 12, marginTop: 12 },
  reasonTitle: { fontSize: 10, fontWeight: "700", color: T.leaf,
                 textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  reasonRow:   { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 4 },
  reasonDot:   { width: 5, height: 5, borderRadius: 2.5, backgroundColor: T.leaf,
                 marginTop: 5, flexShrink: 0 },
  reasonText:  { flex: 1, fontSize: 12, color: T.inkMid, lineHeight: 18 },

  infoContainer: {
  marginTop: 20,
  padding: 15,
  backgroundColor: "#f9f9f9",
  borderRadius: 10,
},

infoTitle: {
  fontSize: 16,
  fontWeight: "bold",
  marginBottom: 10,
},

infoHeading: {
  fontSize: 14,
  fontWeight: "600",
  marginTop: 8,
},

informationText: {
  fontSize: 13,
  color: "#555",
  marginTop: 4,
  lineHeight: 18,
},

  // PDF button
  pdfBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center",
             gap: 10, backgroundColor: T.forest, borderRadius: 12, paddingVertical: 14,
             marginBottom: 12,
             ...Platform.select({
               ios:     { shadowColor: T.forest, shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.25, shadowRadius: 8 },
               android: { elevation: 4 },
             }) },
  pdfText: { fontSize: 15, fontWeight: "700", color: T.white },

  // Disclaimer
  disclaimer:     { flexDirection: "row", alignItems: "flex-start", gap: 8,
                    backgroundColor: T.parchment, borderRadius: 8,
                    padding: 10, marginBottom: 8 },
  disclaimerText: { flex: 1, fontSize: 11, color: T.inkLight, lineHeight: 16 },

  // Navigation
  nav:           { flexDirection: "row", justifyContent: "center", gap: 12,
                   marginTop: 6, marginBottom: 6 },
  btnPrimary:    { flex: 1, flexDirection: "row", alignItems: "center",
                   justifyContent: "center", gap: 8, backgroundColor: T.leaf,
                   borderRadius: 12, paddingVertical: 13 },
  btnPrimaryText:{ fontSize: 15, fontWeight: "700", color: T.white },
  btnOutline:    { flex: 1, flexDirection: "row", alignItems: "center",
                   justifyContent: "center", gap: 8, borderWidth: 1.5,
                   borderColor: T.leaf, borderRadius: 12, paddingVertical: 13 },
  btnOutlineText:{ fontSize: 15, fontWeight: "600", color: T.leaf },
  btnDisabled:   { opacity: 0.6 },

  // Ayurvedic Glossary section
glossaryCard: {
  backgroundColor: "#ffffff",
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "#e4e0d8",
  marginTop: 8,
  marginBottom: 14,
  overflow: "hidden",
  ...Platform.select({
    ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
               shadowOpacity: 0.06, shadowRadius: 8 },
    android: { elevation: 2 },
  }),
},
glossaryHeader: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  padding: 16,
  backgroundColor: "#1a3a2a",
},
glossaryIcon:     { fontSize: 28 },
glossaryTitle:    { fontSize: 15, fontWeight: "800", color: "#faf8f4", letterSpacing: -0.3 },
glossarySubtitle: { fontSize: 11, color: "#a8d5b5", marginTop: 1 },
glossaryDivider:  { height: 1, backgroundColor: "#e4e0d8" },

glossarySection:      { padding: 16 },
glossarySectionHeader:{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
glossaryDot:          { width: 8, height: 8, borderRadius: 4 },
glossarySectionTitle: { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
glossarySectionDesc:  { fontSize: 12, color: "#7a7a7a", lineHeight: 17, marginBottom: 12 },

// Rasa grid — 2 columns
glossaryGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
},
glossaryPill: {
  width: "47%",
  backgroundColor: "#faf8f4",
  borderRadius: 8,
  borderLeftWidth: 3,
  padding: 10,
  borderWidth: 1,
  borderColor: "#e4e0d8",
},
glossaryPillTitle: { fontSize: 13, fontWeight: "700" },
glossaryPillSkt:   { fontSize: 10, color: "#7a7a7a", fontStyle: "italic", marginTop: 1 },
glossaryPillDesc:  { fontSize: 11, color: "#3a3a3a", marginTop: 3, lineHeight: 16 },

// Guna list
glossaryRow:      { gap: 8 },
glossaryRowItem:  { flexDirection: "row", alignItems: "flex-start", gap: 8 },
glossaryRowDot:   { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#6b4c2a",
                    marginTop: 5, flexShrink: 0 },
glossaryRowLabel: { fontSize: 12, fontWeight: "700", color: "#1a1a1a" },
glossaryRowDesc:  { fontSize: 11, color: "#7a7a7a", lineHeight: 16 },

// Virya two column
glossaryTwoCol: { flexDirection: "row", gap: 10 },
glossaryVirya: {
  flex: 1,
  borderRadius: 10,
  borderWidth: 1,
  padding: 12,
  alignItems: "center",
},
glossaryViryaIcon:  { fontSize: 22, marginBottom: 6 },
glossaryViryaTitle: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
glossaryViryaDesc:  { fontSize: 11, color: "#3a3a3a", lineHeight: 16, textAlign: "center" },
});

