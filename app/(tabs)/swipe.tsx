import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Platform } from "react-native";
import Swiper from "react-native-deck-swiper";
import { auth } from "../../firebase";
import { ensureMatchIfMutualLike, getUserProfile, listUsers, writeSwipe } from "../../lib/firestore";
import { UserProfile } from "../../lib/types";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Theme Constants
const BLUE = "#1E5BFF";
const BG = "#071022";
const CARD = "#0D1A36";
const BORDER = "rgba(255,255,255,0.10)";
const TEXT = "rgba(255,255,255,0.92)";
const MUTED = "rgba(255,255,255,0.65)";

// --- HELPERS ---

function toIdSet(arr: any[]) {
  return new Set((arr || []).map((x) => String(x).toLowerCase().trim()).filter(Boolean));
}

function calculateMatchPercentage(me: UserProfile, u: UserProfile) {
  const myOffer = toIdSet(me.skillsOffer);
  const myWant = toIdSet(me.skillsWant);
  const theirOffer = toIdSet(u.skillsOffer);
  const theirWant = toIdSet(u.skillsWant);

  let a = 0;
  for (const s of theirOffer) if (myWant.has(s)) a += 1;
  let b = 0;
  for (const s of theirWant) if (myOffer.has(s)) b += 1;

  const denom = Math.max(1, myWant.size + myOffer.size);
  return Math.max(0, Math.min(100, Math.round(((a + b) / denom) * 100)));
}

function milesBetween(lat1: any, lon1: any, lat2: any, lon2: any) {
  const nLat1 = Number(lat1); const nLon1 = Number(lon1);
  const nLat2 = Number(lat2); const nLon2 = Number(lon2);
  if (!nLat1 || !nLon1 || !nLat2 || !nLon2) return null;
  
  const R = 3958.8; // Radius of Earth in miles
  const dLat = (nLat2 - nLat1) * Math.PI / 180;
  const dLon = (nLon2 - nLon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(nLat1 * Math.PI / 180) * Math.cos(nLat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// --- MAIN COMPONENT ---

export default function Swipe() {
  const [me, setMe] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState<{ name: string; matchId: string } | null>(null);
  
  const swiperRef = useRef<any>(null);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    async function loadData() {
      if (!uid) return;
      try {
        setLoading(true);
        const mine = await getUserProfile(uid);
        setMe(mine);
        // listUsers should exclude current user
        const all = await listUsers(uid);
        setUsers(all);
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [uid]);

  const candidates = useMemo(() => {
    if (!me) return [];
    
    // Discovery range pulled from Profile state (defaults to 25)
    const range = me.radiusMiles || 25;

    return users
      .map((u) => ({
        ...u,
        distanceMiles: milesBetween(me.lat, me.lng, u.lat, u.lng),
        matchPct: calculateMatchPercentage(me, u)
      }))
      .filter(u => {
        // If distance can't be calculated, show them. Otherwise, check against radius.
        if (u.distanceMiles === null) return true;
        return u.distanceMiles <= range;
      })
      // Sort by best skill match first
      .sort((a, b) => b.matchPct - a.matchPct);
  }, [me, users]);

  const handleSwipe = async (idx: number, dir: "like" | "pass") => {
    const target = candidates[idx];
    if (!target || !uid) return;
    try {
      await writeSwipe(uid, target.uid, dir);
      if (dir === "like") {
        const mId = await ensureMatchIfMutualLike(uid, target.uid);
        if (mId) {
          setMatchData({ name: target.name, matchId: mId });
        }
      }
    } catch (e) {
      console.error("Swipe Action Error:", e);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={BLUE} size="large" />
        <Text style={styles.mutedText}>Finding local experts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Skill Swap</Text>
          <Text style={styles.headerSubtitle}>{me?.address || "Nearby"}</Text>
        </View>
        <View style={styles.radiusBadge}>
          <Text style={styles.radiusText}>{me?.radiusMiles || 25} mi radius</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {candidates.length > 0 ? (
          <Swiper
            ref={swiperRef}
            cards={candidates}
            cardIndex={0}
            stackSize={3}
            stackSeparation={14}
            backgroundColor={"transparent"}
            disableTopSwipe
            disableBottomSwipe
            onSwipedLeft={(i) => handleSwipe(i, "pass")}
            onSwipedRight={(i) => handleSwipe(i, "like")}
            renderCard={(u: any) => {
              if (!u) return <View style={styles.card} />;
              return (
                <View style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardName} numberOfLines={1}>{u.name}</Text>
                    <View style={styles.pctBadge}>
                      <Text style={styles.pctText}>{u.matchPct}% Match</Text>
                    </View>
                  </View>

                  <Text style={styles.bioText} numberOfLines={3}>{u.bio || "No bio yet."}</Text>
                  
                  <View style={styles.divider} />

                  <Text style={styles.label}>OFFERING</Text>
                  <Text style={styles.skills} numberOfLines={2}>{u.skillsOffer?.join(" • ") || "None"}</Text>

                  <Text style={[styles.label, { color: "#FFAC1C", marginTop: 15 }]}>WANTING</Text>
                  <Text style={styles.skills} numberOfLines={2}>{u.skillsWant?.join(" • ") || "None"}</Text>

                  <View style={styles.cardFooter}>
                      <Text style={styles.distanceText}>📍 {u.distanceMiles?.toFixed(1) || "?"} miles away</Text>
                  </View>
                </View>
              );
            }}
          />
        ) : (
          <View style={styles.centered}>
            <Ionicons name="search" size={48} color={MUTED} style={{ marginBottom: 10 }} />
            <Text style={styles.title}>No more people nearby</Text>
            <Text style={styles.mutedText}>Try increasing your search radius in Profile!</Text>
          </View>
        )}
      </View>

      <View style={styles.actionRow}>
        <Pressable onPress={() => swiperRef.current?.swipeLeft()} style={styles.passBtn}>
          <Text style={styles.btnText}>Pass</Text>
        </Pressable>
        <Pressable onPress={() => swiperRef.current?.swipeRight()} style={styles.likeBtn}>
          <Text style={styles.btnTextWhite}>Swap Skills</Text>
        </Pressable>
      </View>

      {matchData && (
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>IT'S A{"\n"}MATCH!</Text>
          <View style={styles.modalBody}>
              <Text style={styles.modalName}>You and {matchData.name}</Text>
              <Text style={styles.modalSub}>are ready to trade skills!</Text>
          </View>
          <Pressable 
            onPress={() => {
              const id = matchData.matchId;
              setMatchData(null);
              router.push(`/chat/${id}`);
            }}
            style={styles.modalBtn}
          >
            <Text style={styles.btnTextWhite}>START CONVERSATION</Text>
          </Pressable>
          <Pressable onPress={() => setMatchData(null)} style={{ marginTop: 25 }}>
            <Text style={styles.keepExploring}>Keep Exploring</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: Platform.OS === 'ios' ? 50 : 20 },
  headerTitle: { color: TEXT, fontSize: 28, fontWeight: "900" },
  headerSubtitle: { color: MUTED, fontWeight: "600" },
  radiusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(30,91,255,0.15)", borderWidth: 1, borderColor: BLUE },
  radiusText: { color: TEXT, fontWeight: "800", fontSize: 12 },
  card: { height: '75%', borderRadius: 24, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD, padding: 24, elevation: 8 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center', marginBottom: 15 },
  cardName: { color: TEXT, fontSize: 24, fontWeight: "900", flex: 1 },
  pctBadge: { backgroundColor: BLUE, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pctText: { color: 'white', fontWeight: "900", fontSize: 14 },
  bioText: { color: TEXT, fontSize: 16, lineHeight: 22, marginBottom: 20 },
  divider: { height: 1, backgroundColor: BORDER, marginBottom: 20 },
  label: { color: BLUE, fontWeight: "900", fontSize: 12, letterSpacing: 1, marginBottom: 4 },
  skills: { color: TEXT, fontWeight: "600", fontSize: 16 },
  cardFooter: { flex: 1, justifyContent: 'flex-end' },
  distanceText: { color: MUTED, fontSize: 12, fontWeight: '700' },
  actionRow: { flexDirection: "row", gap: 15, paddingBottom: 30, paddingHorizontal: 10 },
  passBtn: { flex: 1, backgroundColor: "rgba(255,255,255,0.05)", padding: 18, borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: BORDER },
  likeBtn: { flex: 1, backgroundColor: BLUE, padding: 18, borderRadius: 16, alignItems: "center" },
  btnText: { color: TEXT, fontWeight: "900", fontSize: 16 },
  btnTextWhite: { color: "white", fontWeight: "900", fontSize: 16 },
  title: { color: TEXT, fontSize: 22, fontWeight: "900", textAlign: 'center' },
  mutedText: { color: MUTED, marginTop: 8, textAlign: 'center' },
  modal: { position: 'absolute', inset: 0, backgroundColor: 'rgba(7, 16, 34, 0.98)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalTitle: { color: BLUE, fontSize: 48, fontWeight: '900', textAlign: 'center' },
  modalBody: { marginVertical: 40, alignItems: 'center' },
  modalName: { color: TEXT, fontSize: 22, fontWeight: '700' },
  modalSub: { color: MUTED, fontSize: 16, marginTop: 4 },
  modalBtn: { backgroundColor: BLUE, paddingHorizontal: 40, paddingVertical: 20, borderRadius: 20, width: '85%', alignItems: 'center' },
  keepExploring: { color: MUTED, fontWeight: '700', fontSize: 16 }
});