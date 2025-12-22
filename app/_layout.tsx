import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 1. The main tab bar group */}
      <Stack.Screen name="(tabs)" />
      
      {/* 2. The chat screen - Placing it here allows it to cover the tabs */}
      <Stack.Screen 
        name="chat/[matchId]" 
        options={{ 
          headerShown: false, 
          presentation: 'card',
          animation: 'slide_from_right'
        }} 
      />
    </Stack>
  );
}