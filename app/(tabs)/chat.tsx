import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, Image } from "react-native";
import { auth } from "../../firebase";
import { getUserProfile, listMatchesForUser } from "../../lib/firestore";
import { router } from "expo-router";

const BLUE = "#1E5BFF";
const BG = "#071022";
const CARD = "#0D1A36";
const BORDER = "rgba(255,255,255,0.10)";
const TEXT = "rgba(255,255,255,0.92)";
const MUTED = "rgba(255,255,255,0.65)";

function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 3958.7613;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(s1 + s2)));
  return R * c;
}

export default function Chat() {
  const uid = auth.currentUser?.uid!;
  const [matches, setMatches] = useState<any[]>([]);
  const [usersById, setUsersById] = useState<Record<string, any>>({});
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const myProfile = await getUserProfile(uid);
      setMe(myProfile || null);

      const ms = await listMatchesForUser(uid);
      setMatches(ms);

      const otherIds = Array.from(new Set(ms.map((m) => m.users.find((x: string) => x !== uid)).filter(Boolean)));
      const entries = await Promise.all(otherIds.map(async (id) => [id, await getUserProfile(id)] as const));

      const map: Record<string, any> = {};
      for (const [id, p] of entries) map[id] = p;
      setUsersById(map);
    })();
  }, [uid]);

  const myLat = me?.lat || 0;
  const myLng = me?.lng || 0;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: "900", color: TEXT }}>Matches</Text>

        {matches.length === 0 ? <Text style={{ color: MUTED, fontWeight: "700" }}>No matches yet</Text> : null}

        {matches.map((m) => {
          const otherId = m.users.find((x: string) => x !== uid);
          const other = otherId ? usersById[otherId] : null;

          const otherLat = other?.lat || 0;
          const otherLng = other?.lng || 0;

          const dist =
            myLat && myLng && otherLat && otherLng ? milesBetween(myLat, myLng, otherLat, otherLng) : null;

          return (
            <Pressable
              key={m.id}
              onPress={() => router.push(`/chat/${m.id}`)}
              style={{
                backgroundColor: CARD,
                borderWidth: 1,
                borderColor: BORDER,
                borderRadius: 18,
                padding: 14,
                flexDirection: "row",
                gap: 12,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: BORDER,
                  backgroundColor: "rgba(0,0,0,0.18)",
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {other?.photoUrl ? (
                  <Image source={{ uri: other.photoUrl }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(30,91,255,0.10)",
                    }}
                  >
                    <Text style={{ color: TEXT, fontWeight: "900" }}>
                      {(other?.name || "U").slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <Text style={{ fontWeight: "900", fontSize: 16, color: TEXT }} numberOfLines={1}>
                    {other?.name || otherId}
                  </Text>

                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: "rgba(30,91,255,0.55)",
                      backgroundColor: "rgba(30,91,255,0.12)",
                    }}
                  >
                    <Text style={{ color: TEXT, fontWeight: "800", fontSize: 12 }}>
                      {dist == null ? "Distance n/a" : `${dist.toFixed(1)} mi`}
                    </Text>
                  </View>
                </View>

                <Text style={{ color: MUTED, fontWeight: "700" }} numberOfLines={1}>
                  {m.lastMessageText || "Tap to chat"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
