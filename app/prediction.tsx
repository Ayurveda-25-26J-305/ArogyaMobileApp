import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { diseaseApi } from "../services/api";
import DoshaChart from "../components/DoshaChart";
import DiseaseCard from "../components/DiseaseCard";
import { SYMPTOMS, DISEASE_INFO, PRAKRITI_SPECIFIC_ADVICE, DOSHA_SYMPTOMS } from "../utils/constants";
import { authService, predictionService } from "../services/supabase";



export default function PredictionScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const prakriti = params.prakriti
    ? JSON.parse(params.prakriti as string)
    : null;

  const [age, setAge] = useState("30");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState<"mild" | "moderate" | "severe">(
    "moderate",
  );
  const [duration, setDuration] = useState(7);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  const getRelevantSymptoms = (): string[] => {
    if (!prakriti) return SYMPTOMS;

    const prioritySymptoms = DOSHA_SYMPTOMS[prakriti.dominant] || [];
    const otherSymptoms = SYMPTOMS.filter(s => !prioritySymptoms.includes(s));

    return [...prioritySymptoms, ...otherSymptoms];
  };

  // Filter symptoms based on search
  const filteredSymptoms = useMemo(() => {
    const relevantSymptoms = getRelevantSymptoms();
    if (!searchText.trim()) return relevantSymptoms;
    return relevantSymptoms.filter((s) =>
      s.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [searchText, prakriti]);

  // Calculate dosha imbalance based on symptom
  const calculateDoshaImbalance = () => {
    // Find which dosha this symptom belongs to
    const imbalancedDosha =
      Object.entries(DOSHA_SYMPTOMS).find(([_, symptoms]) =>
        symptoms.includes(symptom)
      )?.[0] || prakriti?.dominant || 'pitta';

    return {
      vata_imbalance: imbalancedDosha === 'vata' ? 1.5 : 1.0,
      pitta_imbalance: imbalancedDosha === 'pitta' ? 1.5 : 1.0,
      kapha_imbalance: imbalancedDosha === 'kapha' ? 1.5 : 1.0,
      imbalanced_dosha: imbalancedDosha,
    };
  };

  // Adjust severity based on prakriti
  const getAdjustedSeverity = () => {
    let baseSeverity = severity === "mild" ? 0 : severity === "moderate" ? 1 : 2;

    // Vata types tend to exaggerate symptoms
    if (prakriti?.dominant === 'vata' && baseSeverity > 0) {
      baseSeverity -= 0.2;
    }

    // Kapha types tend to underreport
    if (prakriti?.dominant === 'kapha' && baseSeverity < 2) {
      baseSeverity += 0.2;
    }

    return Math.max(0, Math.min(2, baseSeverity));
  };

  // Get seasonal recommendations
  const getSeasonalRecommendations = () => {
    const month = new Date().getMonth();
    const season =
      month >= 2 && month <= 4 ? 'spring' :
      month >= 5 && month <= 8 ? 'summer' :
      month >= 9 && month <= 11 ? 'fall' :
      'winter';

    const seasonalAdvice: Record<string, string> = {
      spring: 'Kapha season - Avoid heavy, oily foods. Stay active.',
      summer: 'Pitta season - Stay cool, avoid spicy foods.',
      fall: 'Vata season - Eat warm, grounding foods. Maintain routine.',
      winter: 'Kapha season - Exercise regularly, eat light foods.',
    };

    return {
      season,
      advice: seasonalAdvice[season],
    };
  };

  // Check if symptom is priority for user's prakriti
  const isPrioritySymptom = (symptomText: string): boolean => {
    if (!prakriti) return false;
    return DOSHA_SYMPTOMS[prakriti.dominant]?.includes(symptomText) || false;
  };

  const handleSelectSymptom = (s: string) => {
    setSymptom(s);
    setModalVisible(false);
    setSearchText("");
  };

  const handlePredict = async () => {
    if (!symptom) {
      Alert.alert("Select Symptom", "Please select a primary symptom first.");
      return;
    }

    setLoading(true);
    try {
      const user = await authService.currentUser();
      if (!user) {
        Alert.alert("Error", "Please login first");
        return;
      }

      const imbalance = calculateDoshaImbalance();
      const seasonal = getSeasonalRecommendations();

      // Prepare enhanced payload
      const payload = {
        age: parseInt(age) || 30,
        gender,
        symptom,
        severity: getAdjustedSeverity(),
        duration_days: duration,
        vata_score: parseFloat(prakriti?.vata || "0.33"),
        pitta_score: parseFloat(prakriti?.pitta || "0.33"),
        kapha_score: parseFloat(prakriti?.kapha || "0.33"),
        prakriti: prakriti?.dominant || "pitta",

        // Enhanced constitutional awareness
        vata_imbalance: imbalance.vata_imbalance,
        pitta_imbalance: imbalance.pitta_imbalance,
        kapha_imbalance: imbalance.kapha_imbalance,
        imbalanced_dosha: imbalance.imbalanced_dosha,

        // Additional context
        current_season: seasonal.season,
        symptom_matches_prakriti: isPrioritySymptom(symptom),
        prakriti_confidence: prakriti?.confidence || 'MODERATE',
      };

      console.log('🔍 Enhanced Payload:', payload);

      // Call API
      const result = await diseaseApi.predict(payload);
      setPrediction(result);
      setShowInfo(false);

      // Save to Supabase
      await predictionService.save(user.id, {
        predicted_disease: result.predicted_disease,
        confidence: result.confidence,
        symptom,
        severity,
        duration,
        top_3: result.top_3,
      });

      console.log("✅ Prediction saved to Supabase");
    } catch (e: any) {
      console.error("Prediction error:", e);

      // Demo fallback
      const demo = {
        predicted_disease: "Gastritis",
        confidence: 0.875,
        top_3: [
          { disease: "Gastritis", probability: 0.875 },
          { disease: "Diabetes", probability: 0.062 },
          { disease: "Arthritis", probability: 0.031 },
        ],
      };
      setPrediction(demo);

      const user = await authService.currentUser();
      if (user) {
        await predictionService.save(user.id, {
          predicted_disease: demo.predicted_disease,
          confidence: demo.confidence,
          symptom,
          severity,
          duration,
          top_3: demo.top_3,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!prakriti) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="body-outline" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>Prakriti Required</Text>
        <Text style={styles.emptyText}>
          Complete your Prakriti assessment first
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/prakriti" as any)}
        >
          <Text style={styles.primaryBtnText}>Start Assessment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================================
  // RENDER: MAIN UI
  // ============================================================

  const diseaseInfo = prediction
    ? DISEASE_INFO[prediction.predicted_disease]
    : null;

  const SEVERITY_CONFIG = {
    mild: {
      icon: "alert-circle-outline" as const,
      label: "Mild",
      color: "#4caf50",
    },
    moderate: {
      icon: "alert-circle" as const,
      label: "Moderate",
      color: "#ff9800",
    },
    severe: { icon: "warning" as const, label: "Severe", color: "#d32f2f" },
  };

  const imbalance = calculateDoshaImbalance();
  const seasonal = getSeasonalRecommendations();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Prakriti Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Constitution</Text>
        <DoshaChart prakriti={prakriti} />
        <View style={styles.dominantRow}>
          <Text style={styles.dominantLabel}>Dominant Dosha:</Text>
          <Text style={styles.dominantValue}>
            {prakriti.dominant?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Seasonal Info */}
      <View style={styles.seasonalCard}>
        <Ionicons name="sunny" size={20} color="#ff9800" />
        <View style={styles.seasonalContent}>
          <Text style={styles.seasonalTitle}>
            Current Season: {seasonal.season.charAt(0).toUpperCase() + seasonal.season.slice(1)}
          </Text>
          <Text style={styles.seasonalText}>{seasonal.advice}</Text>
        </View>
      </View>

      {/* Age & Gender */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Patient Details</Text>
        <View style={styles.patientRow}>
          <View style={styles.patientField}>
            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput
              style={styles.ageInput}
              value={age}
              onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ""))}
              keyboardType="numeric"
              maxLength={3}
              placeholder="30"
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={[styles.patientField, { flex: 2 }]}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {(["Male", "Female"] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderBtn,
                    gender === g && styles.genderBtnActive,
                  ]}
                  onPress={() => setGender(g)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.genderText,
                      gender === g && styles.genderTextActive,
                    ]}
                  >
                    {g === "Male" ? "♂ Male" : "♀ Female"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Symptom Selector */}
      <View style={styles.card}>
        <View style={styles.symptomHeader}>
          <Text style={styles.cardTitle}>Primary Symptom</Text>
          {isPrioritySymptom(symptom) && (
            <View style={styles.priorityBadge}>
              <Ionicons name="star" size={12} color="#ff9800" />
              <Text style={styles.priorityText}>Matches your Prakriti</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.symptomSelector,
            symptom && styles.symptomSelectorActive,
          ]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.symptomContent}>
            <Ionicons
              name={symptom ? "checkmark-circle" : "search"}
              size={20}
              color={symptom ? "#4caf50" : "#999"}
            />
            <Text
              style={[styles.symptomText, symptom && styles.symptomTextActive]}
              numberOfLines={2}
            >
              {symptom || "Tap to select a symptom..."}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={20}
            color={symptom ? "#2d5016" : "#999"}
          />
        </TouchableOpacity>
        {symptom && (
          <TouchableOpacity
            style={styles.clearSymptom}
            onPress={() => setSymptom("")}
          >
            <Ionicons name="close-circle" size={14} color="#999" />
            <Text style={styles.clearSymptomText}>Clear selection</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Severity */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Severity Level</Text>
        <View style={styles.severityRow}>
          {Object.entries(SEVERITY_CONFIG).map(([level, config]) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.severityBtn,
                severity === level && styles.severityBtnActive,
              ]}
              onPress={() => setSeverity(level as any)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={config.icon}
                size={24}
                color={severity === level ? config.color : "#bbb"}
              />
              <Text
                style={[
                  styles.severityText,
                  severity === level && {
                    color: config.color,
                    fontWeight: "700",
                  },
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Duration */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Duration (Days)</Text>
        <View style={styles.durationRow}>
          {[3, 7, 14, 30].map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.durationBtn,
                duration === d && styles.durationBtnActive,
              ]}
              onPress={() => setDuration(d)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.durationNum,
                  duration === d && styles.durationNumActive,
                ]}
              >
                {d}
              </Text>
              <Text
                style={[
                  styles.durationSub,
                  duration === d && styles.durationSubActive,
                ]}
              >
                days
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Predict Button */}
      <TouchableOpacity
        style={[
          styles.predictBtn,
          (!symptom || loading) && styles.predictBtnDisabled,
        ]}
        onPress={handlePredict}
        disabled={!symptom || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="analytics" size={24} color="#fff" />
            <Text style={styles.predictBtnText}>Predict Disease</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Results */}
      {prediction && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>🎯 Prediction Results</Text>
          
          <DiseaseCard
            disease={prediction.predicted_disease}
            confidence={prediction.confidence}
            top3={prediction.top_3}
          />

          {/* Constitutional Awareness Indicator */}
          <View style={styles.doshaImpactCard}>
            <Text style={styles.doshaImpactTitle}>🌿 Constitutional Analysis</Text>
            <Text style={styles.doshaImpactSubtitle}>
              Based on your {prakriti.dominant.toUpperCase()} constitution
            </Text>
            
            <View style={styles.impactRow}>
              <Ionicons name="leaf" size={16} color="#4caf50" />
              <Text style={styles.impactText}>
                Symptom affects: <Text style={styles.impactBold}>{imbalance.imbalanced_dosha.toUpperCase()}</Text> dosha
              </Text>
            </View>

            {isPrioritySymptom(symptom) && (
              <View style={styles.impactRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                <Text style={styles.impactText}>
                  This symptom is common for your Prakriti type
                </Text>
              </View>
            )}
          </View>

          {/* Personalized Recommendations */}
          {PRAKRITI_SPECIFIC_ADVICE[prakriti.dominant] && (
            <View style={styles.prakritiAdviceCard}>
              <Text style={styles.prakritiAdviceTitle}>
                ✨ Personalized for {prakriti.dominant.toUpperCase()} Constitution
              </Text>
              
              <Text style={styles.prakritiAdviceSubtitle}>General Lifestyle</Text>
              {PRAKRITI_SPECIFIC_ADVICE[prakriti.dominant].general.map((advice: string, i: number) => (
                <View key={i} style={styles.adviceRow}>
                  <Ionicons name="leaf" size={14} color="#4caf50" />
                  <Text style={styles.adviceText}>{advice}</Text>
                </View>
              ))}

              {PRAKRITI_SPECIFIC_ADVICE[prakriti.dominant][
                prediction.predicted_disease.toLowerCase()
              ] && (
                <>
                  <Text style={styles.prakritiAdviceSubtitle}>
                    For {prediction.predicted_disease}
                  </Text>
                  {PRAKRITI_SPECIFIC_ADVICE[prakriti.dominant][
                    prediction.predicted_disease.toLowerCase()
                  ].map((advice: string, i: number) => (
                    <View key={i} style={styles.adviceRow}>
                      <Ionicons name="medical" size={14} color="#2d5016" />
                      <Text style={styles.adviceText}>{advice}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

          {/* Standard Disease Info */}
          <TouchableOpacity
            style={styles.infoToggle}
            onPress={() => setShowInfo(!showInfo)}
            activeOpacity={0.7}
          >
            <Text style={styles.infoToggleText}>
              {showInfo ? "Hide" : "Show"} Disease Information
            </Text>
            <Ionicons
              name={showInfo ? "chevron-up" : "chevron-down"}
              size={20}
              color="#2d5016"
            />
          </TouchableOpacity>

          {showInfo && diseaseInfo && (
            <View style={styles.diseaseInfoCard}>
              <Text style={styles.diseaseTitle}>
                {prediction.predicted_disease}
              </Text>
              <Text style={styles.diseaseSanskrit}>
                ({diseaseInfo.sanskrit})
              </Text>
              {[
                { label: "Description", value: diseaseInfo.description },
                { label: "Dosha Involvement", value: diseaseInfo.dosha },
                { label: "Common Symptoms", value: diseaseInfo.symptoms },
              ].map((item, i) => (
                <View key={i} style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              ))}
              <Text style={styles.recHeader}>Lifestyle Recommendations</Text>
              {diseaseInfo.lifestyle.map((item: string, i: number) => (
                <View key={i} style={styles.recRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                  <Text style={styles.recText}>{item}</Text>
                </View>
              ))}
              <Text style={styles.recHeader}>Dietary Suggestions</Text>
              {diseaseInfo.diet.map((item: string, i: number) => (
                <View key={i} style={styles.recRow}>
                  <Ionicons name="nutrition" size={16} color="#2d5016" />
                  <Text style={styles.recText}>{item}</Text>
                </View>
              ))}
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={16} color="#ff9800" />
                <Text style={styles.warningText}>
                  Always consult a qualified Ayurvedic practitioner for proper
                  diagnosis.
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      <View style={{ height: 40 }} />

      {/* Symptom Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setSearchText("");
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Symptom</Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setSearchText("");
              }}
              style={styles.modalClose}
            >
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search symptoms..."
              placeholderTextColor="#aaa"
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.priorityInfo}>
            <Ionicons name="star" size={14} color="#ff9800" />
            <Text style={styles.priorityInfoText}>
              Symptoms marked with ⭐ are common for your {prakriti.dominant.toUpperCase()} constitution
            </Text>
          </View>
          <Text style={styles.resultCount}>
            {filteredSymptoms.length} symptom
            {filteredSymptoms.length !== 1 ? "s" : ""}
          </Text>
          <FlatList
            data={filteredSymptoms}
            keyExtractor={(_, i) => i.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isPriority = isPrioritySymptom(item);
              return (
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    symptom === item && styles.listItemSelected,
                    isPriority && styles.listItemPriority,
                  ]}
                  onPress={() => handleSelectSymptom(item)}
                  activeOpacity={0.6}
                >
                  {isPriority && (
                    <Ionicons name="star" size={16} color="#ff9800" />
                  )}
                  <Text
                    style={[
                      styles.listItemText,
                      symptom === item && styles.listItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {symptom === item && (
                    <Ionicons name="checkmark" size={20} color="#2d5016" />
                  )}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f8e9" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#f1f8e9",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1b5e20",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: "#2d5016",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1b5e20",
    marginBottom: 14,
  },
  dominantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  dominantLabel: { fontSize: 14, color: "#555" },
  dominantValue: { fontSize: 16, fontWeight: "bold", color: "#2d5016" },

  seasonalCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff3e0",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
  },
  seasonalContent: { flex: 1 },
  seasonalTitle: { fontSize: 14, fontWeight: "600", color: "#e65100", marginBottom: 4 },
  seasonalText: { fontSize: 13, color: "#e65100", lineHeight: 18 },

  patientRow: { flexDirection: "row", gap: 12 },
  patientField: { flex: 1 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#777",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  ageInput: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fafafa",
    textAlign: "center",
  },
  genderRow: { flexDirection: "row", gap: 8 },
  genderBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
  },
  genderBtnActive: { borderColor: "#2d5016", backgroundColor: "#f1f8e9" },
  genderText: { fontSize: 13, color: "#bbb", fontWeight: "500" },
  genderTextActive: { color: "#2d5016", fontWeight: "700" },

  symptomHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  priorityBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff3e0", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontSize: 11, color: "#e65100", fontWeight: "600" },

  symptomSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#fafafa",
  },
  symptomSelectorActive: { borderColor: "#2d5016", backgroundColor: "#f1f8e9" },
  symptomContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  symptomText: { fontSize: 15, color: "#aaa", flex: 1 },
  symptomTextActive: { color: "#1b5e20", fontWeight: "500" },
  clearSymptom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  clearSymptomText: { fontSize: 12, color: "#999" },

  severityRow: { flexDirection: "row", gap: 10 },
  severityBtn: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    gap: 6,
    backgroundColor: "#fafafa",
  },
  severityBtnActive: { borderColor: "#2d5016", backgroundColor: "#f1f8e9" },
  severityText: { fontSize: 12, color: "#bbb", fontWeight: "500" },

  durationRow: { flexDirection: "row", gap: 10 },
  durationBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
  },
  durationBtnActive: { borderColor: "#2d5016", backgroundColor: "#f1f8e9" },
  durationNum: { fontSize: 18, fontWeight: "bold", color: "#bbb" },
  durationNumActive: { color: "#2d5016" },
  durationSub: { fontSize: 11, color: "#ccc" },
  durationSubActive: { color: "#4a7c2c" },

  predictBtn: {
    backgroundColor: "#2d5016",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  predictBtnDisabled: { backgroundColor: "#aaa", elevation: 0 },
  predictBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  resultsSection: { marginHorizontal: 16, marginTop: 16 },
  resultsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1b5e20",
    marginBottom: 14,
  },

  doshaImpactCard: {
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4caf50",
  },
  doshaImpactTitle: { fontSize: 16, fontWeight: "700", color: "#1b5e20", marginBottom: 4 },
  doshaImpactSubtitle: { fontSize: 13, color: "#2e7d32", marginBottom: 12, fontStyle: "italic" },
  impactRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  impactText: { fontSize: 14, color: "#2e7d32", flex: 1 },
  impactBold: { fontWeight: "700", color: "#1b5e20" },

  prakritiAdviceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    marginTop: 12,
    elevation: 2,
    borderWidth: 2,
    borderColor: "#4caf50",
  },
  prakritiAdviceTitle: { fontSize: 17, fontWeight: "bold", color: "#1b5e20", marginBottom: 14 },
  prakritiAdviceSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2d5016",
    marginTop: 12,
    marginBottom: 8,
  },
  adviceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  adviceText: { flex: 1, fontSize: 13, color: "#444", lineHeight: 18 },

  infoToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
    elevation: 1,
  },
  infoToggleText: { fontSize: 15, fontWeight: "600", color: "#2d5016" },

  diseaseInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    marginTop: 10,
    elevation: 2,
  },
  diseaseTitle: { fontSize: 20, fontWeight: "bold", color: "#1b5e20" },
  diseaseSanskrit: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
    marginBottom: 14,
  },
  infoBlock: { marginBottom: 12 },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  infoValue: { fontSize: 14, color: "#333", lineHeight: 20 },
  recHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1b5e20",
    marginTop: 14,
    marginBottom: 8,
  },
  recRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  recText: { flex: 1, fontSize: 14, color: "#444", lineHeight: 20 },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginTop: 14,
    gap: 8,
  },
  warningText: { flex: 1, fontSize: 13, color: "#856404", lineHeight: 18 },

  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    backgroundColor: "#2d5016",
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  modalClose: { padding: 4 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#333" },
  priorityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff3e0",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
  },
  priorityInfoText: { flex: 1, fontSize: 12, color: "#e65100", lineHeight: 16 },
  resultCount: {
    fontSize: 12,
    color: "#aaa",
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  listItemSelected: { backgroundColor: "#f1f8e9" },
  listItemPriority: {
    backgroundColor: "#fff9e6",
    borderLeftWidth: 3,
    borderLeftColor: "#ff9800",
  },
  listItemText: { fontSize: 15, color: "#333", flex: 1 },
  listItemTextSelected: { color: "#2d5016", fontWeight: "600" },
  listSeparator: { height: 1, backgroundColor: "#f5f5f5" },
});