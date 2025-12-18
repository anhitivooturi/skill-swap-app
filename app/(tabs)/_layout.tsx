import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "../../firebase";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        await signInAnonymously(auth);
      }
      setReady(true);
    });
    return () => unsub();
  }, []);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="chat/[matchId]" 
        options={{ 
          headerShown: true, 
          headerTitle: "Skill Match", 
          headerStyle: { backgroundColor: "#071022" },
          headerTintColor: "#1E5BFF",
          headerTitleStyle: { fontWeight: '900', color: 'white' }
        }} 
      />
    </Stack>
  );
}