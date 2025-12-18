import { db } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { MatchDoc, MessageDoc, SwipeDirection, SwipeDoc, UserProfile } from "./types";
import { matchIdFor, swipeIdFor } from "./utils";

export async function upsertUserProfile(profile: UserProfile) {
  const ref = doc(db, "users", profile.uid);
  const snap = await getDoc(ref);
  const payload = {
    ...profile,
    updatedAt: serverTimestamp(),
    createdAt: snap.exists() ? snap.data().createdAt : serverTimestamp(),
  };
  await setDoc(ref, payload, { merge: true });
}

export async function getUserProfile(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function listUsers(excludeUid: string) {
  const q = query(collection(db, "users"));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as UserProfile)
    .filter((u) => u.uid !== excludeUid);
}

export async function writeSwipe(fromUid: string, toUid: string, direction: SwipeDirection) {
  const swipeRef = doc(db, "swipes", swipeIdFor(fromUid, toUid));
  const swipe: SwipeDoc = { fromUid, toUid, direction, createdAt: serverTimestamp() };
  await setDoc(swipeRef, swipe, { merge: true });
}

export async function getSwipe(fromUid: string, toUid: string) {
  const swipeRef = doc(db, "swipes", swipeIdFor(fromUid, toUid));
  const snap = await getDoc(swipeRef);
  if (!snap.exists()) return null;
  return snap.data() as SwipeDoc;
}

export async function ensureMatchIfMutualLike(a: string, b: string) {
  const otherLike = await getSwipe(b, a);
  if (!otherLike || otherLike.direction !== "like") return null;

  const id = matchIdFor(a, b);
  const ref = doc(db, "matches", id);
  const snap = await getDoc(ref);
  if (snap.exists()) return id;

  const users = [a, b].sort() as [string, string];
  const match: MatchDoc = { users, createdAt: serverTimestamp(), lastMessageAt: serverTimestamp(), lastMessageText: "" };
  await setDoc(ref, match, { merge: true });
  return id;
}

export async function listMatchesForUser(uid: string) {
  const q = query(collection(db, "matches"), where("users", "array-contains", uid), orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as MatchDoc) }));
}

export async function listMessages(matchId: string) {
  const q = query(collection(db, "matches", matchId, "messages"), orderBy("createdAt", "asc"), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as MessageDoc) }));
}

export async function sendMessage(matchId: string, fromUid: string, text: string) {
  const msg: MessageDoc = { fromUid, text, createdAt: serverTimestamp() };
  await addDoc(collection(db, "matches", matchId, "messages"), msg);
  await updateDoc(doc(db, "matches", matchId), { lastMessageAt: serverTimestamp(), lastMessageText: text });
}
