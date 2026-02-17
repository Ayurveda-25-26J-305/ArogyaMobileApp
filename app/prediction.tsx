import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
  TextInput, Modal, FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { diseaseApi, storage } from '../services/api';
import DoshaChart from '../components/DoshaChart';
import DiseaseCard from '../components/DiseaseCard';
import { SYMPTOMS, DISEASE_INFO } from '../utils/constants';

export default function PredictionScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const prakriti = params.prakriti ? JSON.parse(params.prakriti as string) : null;

  const [age, setAge] = useState('30');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [symptom, setSymptom] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [duration, setDuration] = useState(7);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Symptom modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredSymptoms = useMemo(() => {
    if (!searchText.trim()) return SYMPTOMS;
    return SYMPTOMS.filter(s =>
      s.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText]);

  const handleSelectSymptom = (s: string) => {
    setSymptom(s);
    setModalVisible(false);
    setSearchText('');
  };

  const handlePredict = async () => {
    if (!symptom) { Alert.alert('Select Symptom', 'Please select a primary symptom first.'); return; }
    setLoading(true);
    try {
      const payload = {
        age: parseInt(age) || 30,
        gender,
        symptom,
        severity: severity === 'mild' ? 0 : severity === 'moderate' ? 1 : 2,
        duration_days: duration,
        vata_score: parseFloat(prakriti?.vata || '0.33'),
        pitta_score: parseFloat(prakriti?.pitta || '0.33'),
        kapha_score: parseFloat(prakriti?.kapha || '0.33'),
        prakriti: prakriti?.dominant || 'pitta',
      };
      const result = await diseaseApi.predict(payload);
      setPrediction(result);
      setShowInfo(false);
      await storage.saveHistory({ ...result, symptom, severity, duration });
    } catch (e: any) {
      // Demo mode when API not available
      const demo = {
        predicted_disease: 'Gastritis',
        confidence: 0.875,
        top_3: [
          { disease: 'Gastritis', probability: 0.875 },
          { disease: 'Diabetes', probability: 0.062 },
          { disease: 'Arthritis', probability: 0.031 },
        ],
      };
      setPrediction(demo);
      await storage.saveHistory({ ...demo, symptom, severity, duration });
    } finally {
      setLoading(false);
    }
  };

  if (!prakriti) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="body-outline" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>Prakriti Required</Text>
        <Text style={styles.emptyText}>Complete your Prakriti assessment first</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/prakriti' as any)}>
          <Text style={styles.primaryBtnText}>Start Assessment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const diseaseInfo = prediction ? DISEASE_INFO[prediction.predicted_disease] : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Prakriti Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Constitution</Text>
        <DoshaChart prakriti={prakriti} />
        <View style={styles.dominantRow}>
          <Text style={styles.dominantLabel}>Dominant Dosha:</Text>
          <Text style={styles.dominantValue}>{prakriti.dominant?.toUpperCase()}</Text>
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
              onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              maxLength={3}
              placeholder="30"
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={[styles.patientField, { flex: 2 }]}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {(['Male', 'Female'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                  onPress={() => setGender(g)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                    {g === 'Male' ? '♂ Male' : '♀ Female'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Symptom Selector */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Primary Symptom</Text>
        <TouchableOpacity
          style={[styles.symptomSelector, symptom ? styles.symptomSelectorSelected : null]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          {symptom ? (
            <View style={styles.selectorInner}>
              <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
              <Text style={styles.symptomSelectedText} numberOfLines={2}>{symptom}</Text>
            </View>
          ) : (
            <View style={styles.selectorInner}>
              <Ionicons name="search" size={20} color="#999" />
              <Text style={styles.symptomPlaceholder}>Tap to select a symptom...</Text>
            </View>
          )}
          <Ionicons name="chevron-down" size={20} color={symptom ? '#2d5016' : '#999'} />
        </TouchableOpacity>

        {symptom && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setSymptom('')}>
            <Ionicons name="close-circle" size={14} color="#999" />
            <Text style={styles.clearBtnText}>Clear selection</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Severity */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Severity Level</Text>
        <View style={styles.severityRow}>
          {([
            { level: 'mild' as const, icon: 'sunny', label: 'Mild' },
            { level: 'moderate' as const, icon: 'partly-sunny', label: 'Moderate' },
            { level: 'severe' as const, icon: 'thunderstorm', label: 'Severe' },
          ]).map(({ level, icon, label }) => (
            <TouchableOpacity
              key={level}
              style={[styles.severityBtn, severity === level && styles.severityActive]}
              onPress={() => setSeverity(level)}
              activeOpacity={0.7}
            >
              <Ionicons name={icon as any} size={24} color={severity === level ? '#2d5016' : '#bbb'} />
              <Text style={[styles.severityText, severity === level && styles.severityTextActive]}>
                {label}
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
              style={[styles.durationBtn, duration === d && styles.durationActive]}
              onPress={() => setDuration(d)}
              activeOpacity={0.7}
            >
              <Text style={[styles.durationNum, duration === d && styles.durationNumActive]}>{d}</Text>
              <Text style={[styles.durationSub, duration === d && styles.durationSubActive]}>days</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Predict Button */}
      <TouchableOpacity
        style={[styles.predictBtn, (!symptom || loading) && styles.predictBtnDisabled]}
        onPress={handlePredict}
        disabled={!symptom || loading}
        activeOpacity={0.8}
      >
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <>
              <Ionicons name="analytics" size={24} color="#fff" />
              <Text style={styles.predictBtnText}>Predict Disease</Text>
            </>
        }
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

          <TouchableOpacity
            style={styles.infoToggle}
            onPress={() => setShowInfo(!showInfo)}
            activeOpacity={0.7}
          >
            <Text style={styles.infoToggleText}>
              {showInfo ? 'Hide' : 'Show'} Disease Information
            </Text>
            <Ionicons name={showInfo ? 'chevron-up' : 'chevron-down'} size={20} color="#2d5016" />
          </TouchableOpacity>

          {showInfo && diseaseInfo && (
            <View style={styles.diseaseInfoCard}>
              <Text style={styles.diseaseTitle}>{prediction.predicted_disease}</Text>
              <Text style={styles.diseaseSanskrit}>({diseaseInfo.sanskrit})</Text>

              {[
                { label: 'Description', value: diseaseInfo.description },
                { label: 'Dosha Involvement', value: diseaseInfo.dosha },
                { label: 'Common Symptoms', value: diseaseInfo.symptoms },
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
                  Always consult a qualified Ayurvedic practitioner for proper diagnosis.
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      <View style={{ height: 40 }} />

      {/* ── Symptom Picker Modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => { setModalVisible(false); setSearchText(''); }}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Symptom</Text>
            <TouchableOpacity
              onPress={() => { setModalVisible(false); setSearchText(''); }}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Search */}
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
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.resultCount}>
            {filteredSymptoms.length} symptom{filteredSymptoms.length !== 1 ? 's' : ''}
          </Text>

          {/* List */}
          <FlatList
            data={filteredSymptoms}
            keyExtractor={(_, i) => i.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.listItem, symptom === item && styles.listItemSelected]}
                onPress={() => handleSelectSymptom(item)}
                activeOpacity={0.6}
              >
                <Text style={[styles.listItemText, symptom === item && styles.listItemTextSelected]}>
                  {item}
                </Text>
                {symptom === item && <Ionicons name="checkmark" size={20} color="#2d5016" />}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#f1f8e9' },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1b5e20', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#777', textAlign: 'center', marginBottom: 24 },
  primaryBtn: { backgroundColor: '#2d5016', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  card: {
    backgroundColor: '#fff', margin: 16, marginBottom: 0, padding: 18, borderRadius: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1b5e20', marginBottom: 14 },
  dominantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  dominantLabel: { fontSize: 14, color: '#555' },
  dominantValue: { fontSize: 16, fontWeight: 'bold', color: '#2d5016' },

  symptomSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 10, padding: 14, backgroundColor: '#fafafa',
  },
  symptomSelectorSelected: { borderColor: '#2d5016', backgroundColor: '#f1f8e9' },
  selectorInner: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  symptomPlaceholder: { fontSize: 15, color: '#aaa' },
  symptomSelectedText: { fontSize: 14, color: '#1b5e20', fontWeight: '500', flex: 1 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  clearBtnText: { fontSize: 12, color: '#999' },

  severityRow: { flexDirection: 'row', gap: 10 },
  severityBtn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: 2, borderColor: '#e0e0e0', gap: 6, backgroundColor: '#fafafa' },
  severityActive: { borderColor: '#2d5016', backgroundColor: '#f1f8e9' },
  severityText: { fontSize: 12, color: '#bbb', fontWeight: '500' },
  severityTextActive: { color: '#2d5016', fontWeight: '700' },

  durationRow: { flexDirection: 'row', gap: 10 },
  durationBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 10, borderWidth: 2, borderColor: '#e0e0e0', backgroundColor: '#fafafa' },
  durationActive: { borderColor: '#2d5016', backgroundColor: '#f1f8e9' },
  durationNum: { fontSize: 18, fontWeight: 'bold', color: '#bbb' },
  durationNumActive: { color: '#2d5016' },
  durationSub: { fontSize: 11, color: '#ccc' },
  durationSubActive: { color: '#4a7c2c' },

  predictBtn: {
    backgroundColor: '#2d5016', margin: 16, padding: 18, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  predictBtnDisabled: { backgroundColor: '#aaa', elevation: 0 },
  predictBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  resultsSection: { margin: 16 },
  resultsTitle: { fontSize: 20, fontWeight: 'bold', color: '#1b5e20', marginBottom: 14 },
  infoToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 14, borderRadius: 10, marginTop: 12, elevation: 1 },
  infoToggleText: { fontSize: 15, fontWeight: '600', color: '#2d5016' },
  diseaseInfoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 18, marginTop: 10, elevation: 2 },
  diseaseTitle: { fontSize: 20, fontWeight: 'bold', color: '#1b5e20' },
  diseaseSanskrit: { fontSize: 14, color: '#888', fontStyle: 'italic', marginBottom: 14 },
  infoBlock: { marginBottom: 12 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 3 },
  infoValue: { fontSize: 14, color: '#333', lineHeight: 20 },
  recHeader: { fontSize: 15, fontWeight: '700', color: '#1b5e20', marginTop: 14, marginBottom: 8 },
  recRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  recText: { flex: 1, fontSize: 14, color: '#444', lineHeight: 20 },
  warningBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff3cd', padding: 12, borderRadius: 8, marginTop: 14, gap: 8 },
  warningText: { flex: 1, fontSize: 13, color: '#856404', lineHeight: 18 },

  // Patient details
  patientRow: { flexDirection: 'row', gap: 12 },
  patientField: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#777', textTransform: 'uppercase', marginBottom: 6 },
  ageInput: {
    borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
    color: '#333', backgroundColor: '#fafafa', textAlign: 'center',
  },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10,
    borderWidth: 2, borderColor: '#e0e0e0', backgroundColor: '#fafafa',
  },
  genderBtnActive: { borderColor: '#2d5016', backgroundColor: '#f1f8e9' },
  genderText: { fontSize: 13, color: '#bbb', fontWeight: '500' },
  genderTextActive: { fontSize: 13, color: '#2d5016', fontWeight: '700' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    backgroundColor: '#2d5016', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  modalCloseBtn: { padding: 4 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5',
    margin: 16, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0',
    paddingHorizontal: 12, gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#333' },
  resultCount: { fontSize: 12, color: '#aaa', paddingHorizontal: 20, marginBottom: 4 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20 },
  listItemSelected: { backgroundColor: '#f1f8e9' },
  listItemText: { fontSize: 15, color: '#333', flex: 1 },
  listItemTextSelected: { color: '#2d5016', fontWeight: '600' },
  listSeparator: { height: 1, backgroundColor: '#f5f5f5' },
});