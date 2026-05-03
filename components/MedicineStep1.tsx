import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MedicineForm } from "../utils/medicinep";

// ─── THEME (matches DietScreen) ───────────────────────────────────────────────
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
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const DISEASES = ["diabetes", "migraine", "arthritis", "asthma", "gastritis"];
const GENDERS = ["male", "female"];

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface MedicineStep1Props {
  form: MedicineForm;
  update: (key: keyof MedicineForm, value: string) => void;
  onNext: () => void;
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function SectionLabel({ icon, children }: { icon: string; children: string }) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionText}>{children}</Text>
    </View>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardAccent} />
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function SelectPill({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <FieldLabel>{label}</FieldLabel>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 8 }}
      >
        <View style={styles.pillRow}>
          {options.map((opt) => {
            const selected = value === opt;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => onChange(opt)}
                activeOpacity={0.75}
                style={[styles.pill, selected && styles.pillSelected]}
              >
                <Text
                  style={[styles.pillText, selected && styles.pillTextSelected]}
                >
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

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function MedicineStep1({
  form,
  update,
  onNext,
}: MedicineStep1Props) {
  const isValid = !!form.age && !!form.gender && !!form.disease;

  return (
    <View>
      <CardShell>
        <SectionLabel icon="🧍">Personal Information</SectionLabel>

        {/* Age */}
        <View style={styles.fieldGroup}>
          <FieldLabel>Age (years)</FieldLabel>
          <TextInput
            style={styles.input}
            value={form.age}
            onChangeText={(v) => update("age", v)}
            keyboardType="numeric"
            placeholder="e.g. 28"
            placeholderTextColor={T.inkLight}
          />
        </View>

        {/* Gender */}
        <SelectPill
          label="Gender"
          value={form.gender}
          options={GENDERS}
          onChange={(v) => update("gender", v)}
        />

        {/* Disease */}
        <SelectPill
          label="Health Condition"
          value={form.disease}
          options={DISEASES}
          onChange={(v) => update("disease", v)}
        />

        {/* Region — fixed to Western, shown as read-only badge */}
        <View style={styles.fieldGroup}>
          <FieldLabel>Geographic Region</FieldLabel>
          <View style={styles.regionBadge}>
            <Text style={styles.regionIcon}>🌍</Text>
            <View>
              <Text style={styles.regionTitle}>Western</Text>
              <Text style={styles.regionSub}>
                Set as default for this session
              </Text>
            </View>
          </View>
        </View>
      </CardShell>

      {/* Next button */}
      <TouchableOpacity
        onPress={onNext}
        activeOpacity={0.85}
        disabled={!isValid}
        style={[styles.nextBtn, !isValid && styles.nextBtnDisabled]}
      >
        <Text style={styles.nextBtnText}>Continue →</Text>
      </TouchableOpacity>
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
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  sectionIcon: {
    fontSize: 22,
  },
  sectionText: {
    fontSize: 16,
    fontWeight: "700",
    color: T.inkDark,
    letterSpacing: 0.3,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: T.inkMid,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: T.bg,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: T.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: T.inkDark,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 4,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: T.bg,
    borderWidth: 1.5,
    borderColor: T.border,
  },
  pillSelected: {
    backgroundColor: T.leaf,
    borderColor: T.leaf,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: T.inkMid,
  },
  pillTextSelected: {
    color: T.white,
  },
  regionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: T.sagePale,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: T.borderGreen,
    padding: 14,
  },
  regionIcon: {
    fontSize: 24,
  },
  regionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: T.leaf,
  },
  regionSub: {
    fontSize: 11,
    color: T.leafMid,
    marginTop: 2,
  },
  nextBtn: {
    backgroundColor: T.leaf,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 8,
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
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
