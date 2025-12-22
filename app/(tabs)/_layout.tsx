import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: false,
      tabBarStyle: { backgroundColor: "#0D1A36", borderTopColor: "rgba(255,255,255,0.1)", height: 90 },
      tabBarActiveTintColor: "#1E5BFF",
      tabBarInactiveTintColor: "rgba(255,255,255,0.5)"
    }}>
      <Tabs.Screen name="swipe" options={{ title: "Discover", tabBarIcon: ({ color }) => <Ionicons name="flame" size={24} color={color} /> }} />
      <Tabs.Screen name="chat" options={{ title: "Matches", tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} /> }} />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}