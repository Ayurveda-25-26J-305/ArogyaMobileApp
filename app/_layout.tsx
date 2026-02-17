// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="prakriti"
          options={{
            title: 'Prakriti Assessment',
            headerStyle: { backgroundColor: '#2d5016' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <Stack.Screen
          name="prediction"
          options={{
            title: 'Disease Prediction',
            headerStyle: { backgroundColor: '#2d5016' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}