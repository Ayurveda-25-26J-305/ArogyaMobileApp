// app/register.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirm) {
      Alert.alert('Error', 'Please fill in all fields'); return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match'); return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters'); return;
    }
    setLoading(true);
    try {
      await authService.register(email.trim(), password, name.trim());
      Alert.alert(
        'Account Created!',
        'Please check your email to verify your account, then login.',
        [{ text: 'Go to Login', onPress: () => router.replace('/login' as any) }]
      );
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🌿</Text>
          <Text style={styles.appName}>Arogya</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Get Started</Text>
          <Text style={styles.formSub}>Join Arogya for personalized care</Text>

          {/* Name */}
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={20} color="#aaa" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={20} color="#aaa" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color="#aaa" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password (min 6 characters)"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={[
            styles.inputWrap,
            confirm.length > 0 && { borderColor: confirm === password ? '#4caf50' : '#d32f2f' }
          ]}>
            <Ionicons name="lock-closed-outline" size={20} color="#aaa" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Confirm password"
              placeholderTextColor="#aaa"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            {confirm.length > 0 && (
              <Ionicons
                name={confirm === password ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={confirm === password ? '#4caf50' : '#d32f2f'}
              />
            )}
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerBtn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.registerBtnText}>Create Account</Text>
            }
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.loginLinkText}>
              Already have an account?{' '}
              <Text style={styles.loginLinkBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>SLIIT • Project 25-26J-305</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 56, marginBottom: 6 },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#1b5e20', marginBottom: 4 },
  tagline: { fontSize: 14, color: '#777' },
  form: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8,
  },
  formTitle: { fontSize: 22, fontWeight: 'bold', color: '#1b5e20', marginBottom: 4 },
  formSub: { fontSize: 14, color: '#aaa', marginBottom: 20 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12,
    backgroundColor: '#fafafa', marginBottom: 12, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#333' },
  eyeBtn: { padding: 4 },
  registerBtn: {
    backgroundColor: '#2d5016', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink: { marginTop: 16, alignItems: 'center', padding: 8 },
  loginLinkText: { fontSize: 14, color: '#777' },
  loginLinkBold: { color: '#2d5016', fontWeight: '700' },
  footer: { textAlign: 'center', color: '#bbb', fontSize: 12, marginTop: 24 },
});