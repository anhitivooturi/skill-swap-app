import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, Image, ActivityIndicator } from "react-native";
import { auth, db } from "../../firebase";
import { getUserProfile } from "../../lib/firestore";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BLUE = "#1E5BFF";
const BG = "#071022";
const CARD = "#0D1A36";
const BORDER = "rgba(255,255,255,0.10)";
const TEXT = "rgba(255,255,255,0.92)";
const MUTED = "rgba(255,255,255,0.65)";

// Helper for distance calculation using the Haversine formula
function milesBetween(lat1: any, lon1: any, lat2: any, lon2: any) {
  // Use Number() to prevent math errors if strings were stored in DB
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (!nLat1 || !nLon1 || !nLat2 || !nLon2) return null;

  const R = 3958.8; // Radius of Earth in miles
  const dLat = (nLat2 - nLat1) * Math.PI / 180;
  const dLon = (nLon2 - nLon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(nLat1 * Math.PI / 180) * Math.cos(nLat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function ChatList() {
  const uid = auth.currentUser?.uid!;
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [usersById, setUsersById] = useState<Record<string, any>>({});
  const [me, setMe] = useState<any>(null);

  // 1. Fetch MY profile data
  useEffect(() => {
    async function getMe() {
      const myProfile = await getUserProfile(uid);
      setMe(myProfile);
    }
    getMe();
  }, [uid]);

  // 2. Real-time listener for Matches
  useEffect(() => {
    const q = query(
      collection(db, "matches"),
      where("users", "array-contains", uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const ms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Get all partner IDs
      const otherIds = Array.from(new Set(
        ms.map((m: any) => m.users.find((x: string) => x !== uid)).filter(Boolean)
      ));

      // Batch fetch missing profiles
      const newUsersMap = { ...usersById };
      let updated = false;

      await Promise.all(otherIds.map(async (id: any) => {
        if (!newUsersMap[id]) {
          const profile = await getUserProfile(id);
          if (profile) {
            newUsersMap[id] = profile;
            updated = true;
          }
        }
      }));

      if (updated) setUsersById(newUsersMap);
      setMatches(ms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, justifyContent: 'center' }}>
        <ActivityIndicator color={BLUE} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40, paddingTop: 60 }}>
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 32, fontWeight: "900", color: TEXT }}>Messages</Text>
          <Text style={{ color: MUTED, fontSize: 14 }}>Connect with your skill partners</Text>
        </View>

        {matches.length === 0 ? (
          <View style={{ marginTop: 100, alignItems: 'center' }}>
            <Ionicons name="chatbubbles-outline" size={64} color={MUTED} />
            <Text style={{ color: MUTED, fontWeight: "700", fontSize: 16, marginTop: 16 }}>No matches yet.</Text>
            <Text style={{ color: MUTED, textAlign: 'center', marginTop: 8 }}>Keep swiping to find local experts!</Text>
          </View>
        ) : null}

        {matches.map((m) => {
          const otherId = m.users.find((x: string) => x !== uid);
          const other = otherId ? usersById[otherId] : null;
          
          // Calculate distance using my lat/lng vs their lat/lng
          const dist = (me?.lat && other?.lat) 
            ? milesBetween(me.lat, me.lng, other.lat, other.lng) 
            : null;

          return (
            <Pressable
              key={m.id}
              onPress={() => router.push(`/chat/${m.id}`)}
              style={({ pressed }) => ({
                backgroundColor: CARD,
                borderWidth: 1,
                borderColor: BORDER,
                borderRadius: 20,
                padding: 16,
                flexDirection: "row",
                gap: 14,
                alignItems: "center",
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }]
              })}
            >
              <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: "rgba(30,91,255,0.1)", overflow: "hidden", borderWidth: 1, borderColor: BORDER }}>
                {other?.photoUrl ? (
                  <Image source={{ uri: other.photoUrl }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: BLUE, fontWeight: "900", fontSize: 20 }}>
                      {(other?.name || "?").slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontWeight: "900", fontSize: 18, color: TEXT }} numberOfLines={1}>
                    {other?.name || "Skill Partner"}
                  </Text>
                  {/* Distance rendering fixed here */}
                  {dist !== null && (
                    <Text style={{ color: BLUE, fontWeight: "800", fontSize: 12 }}>
                      {dist.toFixed(1)} mi away
                    </Text>
                  )}
                </View>

                <Text 
                  style={{ color: m.lastMessageText ? MUTED : BLUE, fontWeight: m.lastMessageText ? "500" : "800" }} 
                  numberOfLines={1}
                >
                  {m.lastMessageText || "New Match! Say hello 👋"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}