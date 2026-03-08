import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { authService } from '../services/supabase';
import "../global.css";


const HEADER       = { backgroundColor: '#2d5016' };
const HEADER_TITLE = { fontWeight: 'bold' as const };

export default function RootLayout() {
  const router   = useRouter();
  const segments = useSegments();
  const [user, setUser]   = useState<any>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    authService.getSession().then((session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    const sub = authService.onAuthChange((u: any) => setUser(u));
    return () => sub?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inApp      = segments[0] === '(tabs)';
    const onAuthPage = segments[0] === 'login' || segments[0] === 'register';
    if (!user && inApp)      router.replace('/login' as any);
    if (user  && onAuthPage) router.replace('/(tabs)' as any);
  }, [user, ready, segments]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f8e9' }}>
        <ActivityIndicator size="large" color="#2d5016" />
      </View>
    );
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)"   options={{ headerShown: false }} />
        <Stack.Screen name="login"    options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen
          name="prakriti"
          options={{ title: 'Prakriti Assessment', headerStyle: HEADER, headerTintColor: '#fff', headerTitleStyle: HEADER_TITLE }}
        />
        <Stack.Screen
          name="prediction"
          options={{ title: 'Disease Prediction', headerStyle: HEADER, headerTintColor: '#fff', headerTitleStyle: HEADER_TITLE }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}