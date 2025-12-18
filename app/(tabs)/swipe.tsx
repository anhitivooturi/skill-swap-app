import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import Swiper from "react-native-deck-swiper";
import { auth } from "../../firebase";
import { ensureMatchIfMutualLike, getUserProfile, listUsers, writeSwipe } from "../../lib/firestore";
import { UserProfile } from "../../lib/types";
import { milesBetween } from "../../lib/utils";
import { router } from "expo-router";

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
  const pct = Math.round(((a + b) / denom) * 100);
  return Math.max(0, Math.min(100, pct));
}

export default function Swipe() {
  const uid = auth.currentUser?.uid!;
  const swiperRef = useRef<any>(null);

  const [me, setMe] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const mine = await getUserProfile(uid);
      setMe(mine);
      const all = await listUsers(uid);
      setUsers(all);
    })();
  }, [uid]);

  const candidates = useMemo(() => {
    if (!me) return [];
    const r = me.radiusMiles || 25;

    return users
      .map((u) => {
        const d = milesBetween(me.lat || 0, me.lng || 0, u.lat || 0, u.lng || 0);
        const pct = percentMatch(me, u);
        return { ...u, distanceMiles: d, matchPct: pct } as any;
      })
      .filter((u: any) => (me.lat && me.lng && u.lat && u.lng ? u.distanceMiles <= r : true))
      .sort((a: any, b: any) => b.matchPct - a.matchPct || a.distanceMiles - b.distanceMiles);
  }, [me, users]);

  const doSwipe = async (index: number, direction: "like" | "pass") => {
    if (!me) return;
    const current: any = candidates[index];
    if (!current) return;

    setBusy(true);
    try {
      await writeSwipe(uid, current.uid, direction);

      if (direction === "like") {
        const matchId = await ensureMatchIfMutualLike(uid, current.uid);
        if (matchId) {
          router.push(`/chat/${matchId}`);
          return;
        }
      }
    } finally {
      setBusy(false);
    }
  };

  if (!me) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, padding: 16, justifyContent: "center" }}>
        <Text style={{ color: TEXT, fontSize: 18, fontWeight: "900" }}>Load your profile first</Text>
        <Text style={{ color: MUTED, marginTop: 8, fontWeight: "700" }}>Go to Profile, save your name, skills, and tap Use GPS.</Text>
      </View>
    );
  }

  if (!candidates.length) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, padding: 16, justifyContent: "center", gap: 10 }}>
        <Text style={{ color: TEXT, fontSize: 22, fontWeight: "900" }}>No more candidates</Text>
        <Text style={{ color: MUTED, fontWeight: "700" }}>Increase radius, add skills, or create more users.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG, padding: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ color: TEXT, fontSize: 24, fontWeight: "900" }}>Swipe</Text>
        <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "rgba(30,91,255,0.55)", backgroundColor: "rgba(30,91,255,0.12)" }}>
          <Text style={{ color: TEXT, fontWeight: "800", fontSize: 12 }}>{me.radiusMiles || 25} mi radius</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Swiper
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
          overlayLabels={{
            left: {
              title: "PASS",
              style: { label: { color: "rgba(255,255,255,0.92)", fontWeight: "900" }, wrapper: { flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-start", marginTop: 30, marginLeft: -30 } },
            },
            right: {
              title: "LIKE",
              style: { label: { color: "rgba(255,255,255,0.92)", fontWeight: "900" }, wrapper: { flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", marginTop: 30, marginLeft: 30 } },
            },
          }}
          renderCard={(u: any) => {
            if (!u) return <View />;
            return (
              <View style={{ flex: 1, borderRadius: 22, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD, padding: 16, gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <Text style={{ color: TEXT, fontSize: 20, fontWeight: "900", flex: 1 }} numberOfLines={1}>
                    {u.name || "Unnamed"}
                  </Text>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(30,91,255,0.12)", borderWidth: 1, borderColor: "rgba(30,91,255,0.55)" }}>
                    <Text style={{ color: TEXT, fontWeight: "900", fontSize: 12 }}>{u.matchPct}%</Text>
                  </View>
                </View>

                <Text style={{ color: MUTED, fontWeight: "700" }} numberOfLines={3}>
                  {u.bio || ""}
                </Text>

                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                  <Text style={{ color: MUTED, fontWeight: "800" }} numberOfLines={1}>
                    {u.locationName || ""}
                  </Text>
                  <Text style={{ color: MUTED, fontWeight: "800" }}>
                    {u.distanceMiles != null && isFinite(u.distanceMiles) ? `${u.distanceMiles.toFixed(1)} mi` : ""}
                  </Text>
                </View>

                <View style={{ height: 1, backgroundColor: BORDER }} />

                <Text style={{ color: TEXT, fontWeight: "900" }}>Offers</Text>
                <Text style={{ color: MUTED, fontWeight: "700" }} numberOfLines={3}>
                  {(u.skillsOffer || []).join(", ")}
                </Text>

                <Text style={{ color: TEXT, fontWeight: "900" }}>Wants</Text>
                <Text style={{ color: MUTED, fontWeight: "700" }} numberOfLines={3}>
                  {(u.skillsWant || []).join(", ")}
                </Text>

                {busy ? (
                  <View style={{ marginTop: 8, paddingVertical: 10, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center" }}>
                    <Text style={{ color: MUTED, fontWeight: "800" }}>Saving...</Text>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
        <Pressable
          disabled={busy}
          onPress={() => swiperRef.current?.swipeLeft()}
          style={{ flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: BORDER, backgroundColor: "rgba(0,0,0,0.18)", alignItems: "center" }}
        >
          <Text style={{ color: TEXT, fontWeight: "900" }}>Pass</Text>
        </Pressable>

        <Pressable
          disabled={busy}
          onPress={() => swiperRef.current?.swipeRight()}
          style={{ flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: "rgba(30,91,255,0.55)", backgroundColor: "rgba(30,91,255,0.12)", alignItems: "center" }}
        >
          <Text style={{ color: TEXT, fontWeight: "900" }}>Like</Text>
        </Pressable>
      </View>
    </View>
  );
}
