import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import Swiper from "react-native-deck-swiper";
import { auth } from "../../firebase";
import { ensureMatchIfMutualLike, getUserProfile, listUsers, writeSwipe } from "../../lib/firestore";
import { UserProfile } from "../../lib/types";
import { milesBetween } from "../../lib/utils";
import { router } from "expo-router";

// Theme Constants
const BLUE = "#1E5BFF";
const BG = "#071022";
const CARD = "#0D1A36";
const BORDER = "rgba(255,255,255,0.10)";
const TEXT = "rgba(255,255,255,0.92)";
const MUTED = "rgba(255,255,255,0.65)";

function toIdSet(arr: any[]) {
  return new Set((arr || []).map((x) => String(x).toLowerCase().trim()).filter(Boolean));
}

function percentMatch(me: UserProfile, u: UserProfile) {
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

export default function Swipe() {
  const uid = auth.currentUser?.uid!;
  const swiperRef = useRef<any>(null);

  const [me, setMe] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  
  // State for the Match Celebration Modal
  const [matchData, setMatchData] = useState<{ name: string; matchId: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const mine = await getUserProfile(uid);
        setMe(mine);
        const all = await listUsers(uid);
        setUsers(all);
      } catch (err) {
        console.error("Error loading swipe data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [uid]);

  const candidates = useMemo(() => {
    if (!me) return [];
    const r = me.radiusMiles || 25;

    return users
      .map((u) => {
        const d = milesBetween(me.lat || 0, me.lng || 0, u.lat || 0, u.lng || 0);
        const pct = percentMatch(me, u);
        return { ...u, distanceMiles: d, matchPct: pct };
      })
      .filter((u) => (me.lat && me.lng && u.lat && u.lng ? u.distanceMiles <= r : true))
      .sort((a, b) => b.matchPct - a.matchPct || a.distanceMiles - b.distanceMiles);
  }, [me, users]);

  const doSwipe = async (index: number, direction: "like" | "pass") => {
    const current = candidates[index];
    if (!current || !me) return;

    setBusy(true);
    try {
      await writeSwipe(uid, current.uid, direction);

      if (direction === "like") {
        const matchId = await ensureMatchIfMutualLike(uid, current.uid);
        if (matchId) {
          // Trigger the Match Modal UI
          setMatchData({ name: current.name, matchId: matchId });
        }
      }
    } catch (e) {
      console.error("Swipe failed:", e);
    } finally {
      setBusy(false);
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

  if (!me) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Profile Incomplete</Text>
        <Text style={styles.mutedText}>Update your skills and location in the Profile tab.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Skill Swap</Text>
          <Text style={styles.headerSubtitle}>Phoenix, AZ</Text>
        </View>
        <View style={styles.radiusBadge}>
          <Text style={styles.radiusText}>{me.radiusMiles || 25} mi</Text>
        </View>
      </View>

      {/* Cards Area */}
      <View style={{ flex: 1 }}>
        {candidates.length > 0 ? (
          <Swiper
            key={candidates.length}
            ref={swiperRef}
            cards={candidates}
            cardIndex={0}
            stackSize={3}
            stackSeparation={14}
            backgroundColor={"transparent"}
            disableTopSwipe
            disableBottomSwipe
            onSwipedLeft={(idx) => doSwipe(idx, "pass")}
            onSwipedRight={(idx) => doSwipe(idx, "like")}
            renderCard={(u: any) => (
              <View style={styles.card}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardName} numberOfLines={1}>{u.name}</Text>
                  <View style={styles.pctBadge}>
                    <Text style={styles.pctText}>{u.matchPct}%</Text>
                  </View>
                </View>

                <Text style={styles.bioText} numberOfLines={3}>{u.bio || "No bio yet."}</Text>
                
                <View style={styles.divider} />

                <Text style={styles.label}>OFFERING</Text>
                <Text style={styles.skills} numberOfLines={2}>{u.skillsOffer?.join(" • ") || "None"}</Text>

                <Text style={[styles.label, { color: "#FFAC1C", marginTop: 15 }]}>WANTING</Text>
                <Text style={styles.skills} numberOfLines={2}>{u.skillsWant?.join(" • ") || "None"}</Text>

                <View style={styles.cardFooter}>
                   <Text style={styles.distanceText}>📍 {u.distanceMiles?.toFixed(1)} miles away</Text>
                </View>
              </View>
            )}
          />
        ) : (
          <View style={styles.centered}>
            <Text style={styles.title}>No more people nearby</Text>
            <Text style={styles.mutedText}>Try increasing your search radius!</Text>
          </View>
        )}
      </View>

      {/* Bottom Buttons */}
      <View style={styles.actionRow}>
        <Pressable disabled={busy} onPress={() => swiperRef.current?.swipeLeft()} style={styles.passBtn}>
          <Text style={styles.btnText}>Pass</Text>
        </Pressable>
        <Pressable disabled={busy} onPress={() => swiperRef.current?.swipeRight()} style={styles.likeBtn}>
          <Text style={styles.btnTextWhite}>Swap Skills</Text>
        </Pressable>
      </View>

      {/* Match Modal Overlay */}
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 40 },
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
  modal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(7, 16, 34, 0.98)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalTitle: { color: BLUE, fontSize: 48, fontWeight: '900', textAlign: 'center' },
  modalBody: { marginVertical: 40, alignItems: 'center' },
  modalName: { color: TEXT, fontSize: 22, fontWeight: '700' },
  modalSub: { color: MUTED, fontSize: 16, marginTop: 4 },
  modalBtn: { backgroundColor: BLUE, paddingHorizontal: 40, paddingVertical: 20, borderRadius: 20, width: '85%', alignItems: 'center' },
  keepExploring: { color: MUTED, fontWeight: '700', fontSize: 16 }
});