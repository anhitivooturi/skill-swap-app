import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Modal, FlatList, Image, Platform, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../firebase";
import { getUserProfile, upsertUserProfile } from "../../lib/firestore";
import { UserProfile, UserAvailability } from "../../lib/types";

// Theme Constants
const BLUE = "#1E5BFF";
const BG = "#071022";
const CARD = "#0D1A36";
const BORDER = "rgba(255,255,255,0.10)";
const TEXT = "rgba(255,255,255,0.92)";
const MUTED = "rgba(255,255,255,0.65)";

// --- HELPERS ---

const SKILLS: { id: string; label: string }[] = [
  { id: "python", label: "Python" }, { id: "java", label: "Java" }, { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" }, { id: "react", label: "React" }, { id: "react_native", label: "React Native" },
  { id: "guitar", label: "Guitar" }, { id: "piano", label: "Piano" }, { id: "singing", label: "Singing" },
  { id: "cooking", label: "Cooking" }, { id: "spanish", label: "Spanish" }, { id: "yoga", label: "Yoga" },
  { id: "uiux", label: "UI/UX Design" }, { id: "photography", label: "Photography" }, { id: "math", label: "Math" }
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function pad2(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function buildSlots() {
  const slots: string[] = [];
  for (let h = 6; h <= 22; h++) {
    slots.push(`${pad2(h)}:00`);
    slots.push(`${pad2(h)}:30`);
  }
  return slots;
}
const TIME_SLOTS = buildSlots();

function prettySkillLabel(id: string) {
  const found = SKILLS.find((s) => s.id === id);
  return found?.label ?? id;
}

function defaultProfile(uid: string): UserProfile {
  return {
    uid, name: "", photoUrl: "", bio: "", skillsOffer: [], skillsWant: [],
    availability: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] },
    locationName: "", address: "", lat: 0, lng: 0, radiusMiles: 25,
  };
}

// --- COMPONENTS ---

function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "rgba(30,91,255,0.16)", borderWidth: 1, borderColor: "rgba(30,91,255,0.35)" }}>
      <Text style={{ color: TEXT, fontSize: 13, fontWeight: "600" }}>{label}</Text>
      {onRemove && (
        <Pressable onPress={onRemove} style={{ padding: 2 }}>
          <Ionicons name="close" size={16} color={TEXT} />
        </Pressable>
      )}
    </View>
  );
}

function Card({ children }: { children: any }) {
  return <View style={{ backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 14, gap: 10, marginBottom: 12 }}>{children}</View>;
}

function PrimaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: BLUE, paddingVertical: 14, borderRadius: 14, alignItems: "center" }}>
      <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>{title}</Text>
    </Pressable>
  );
}

function GhostButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingVertical: 14, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: "rgba(30,91,255,0.55)" }}>
      <Text style={{ color: TEXT, fontSize: 16, fontWeight: "700" }}>{title}</Text>
    </Pressable>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={{ color: MUTED, fontSize: 13, fontWeight: "700", letterSpacing: 0.2 }}>{text}</Text>;
}

function Input({ value, onChangeText, placeholder, multiline, keyboardType }: any) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={"rgba(255,255,255,0.35)"}
      multiline={multiline}
      keyboardType={keyboardType || "default"}
      style={{
        color: TEXT, borderWidth: 1, borderColor: BORDER, backgroundColor: "rgba(0,0,0,0.15)",
        paddingHorizontal: 12, paddingVertical: multiline ? 12 : 10, borderRadius: 14,
        minHeight: multiline ? 90 : undefined, textAlignVertical: multiline ? "top" : "center",
        fontSize: 15, fontWeight: "600",
      }}
    />
  );
}

// --- MODALS ---

function SkillPickerModal({ visible, title, selected, onClose, onChange }: any) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? SKILLS.filter((s) => s.label.toLowerCase().includes(t)) : SKILLS;
  }, [q]);
  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((x: string = "") => x !== id) : [...selected, id];
    onChange(next);
  };
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", padding: 14, justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: BG, borderRadius: 22, borderWidth: 1, borderColor: BORDER, padding: 14, maxHeight: "85%" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: TEXT, fontSize: 18, fontWeight: "800" }}>{title}</Text>
            <Pressable onPress={onClose}><Ionicons name="close" size={22} color={TEXT} /></Pressable>
          </View>
          <Input value={q} onChangeText={setQ} placeholder="Search skills..." />
          <FlatList
            data={filtered}
            keyExtractor={(x) => x.id}
            renderItem={({ item }) => (
              <Pressable onPress={() => toggle(item.id)} style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: BORDER, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: TEXT }}>{item.label}</Text>
                {selected.includes(item.id) && <Ionicons name="checkmark" size={20} color={BLUE} />}
              </Pressable>
            )}
          />
          <View style={{ marginTop: 10 }}>
            <PrimaryButton title="Done" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AvailabilityModal({ visible, availability, onClose, onChange }: any) {
    const [day, setDay] = useState("Mon");
    const toggleSlot = (d: string, slot: string) => {
        const current = availability[d] || [];
        const next = current.includes(slot) ? current.filter((s: string) => s !== slot) : [...current, slot];
        onChange({ ...availability, [d]: next });
    };
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", padding: 14, justifyContent: "flex-end" }}>
                <View style={{ backgroundColor: BG, borderRadius: 22, borderWidth: 1, borderColor: BORDER, padding: 14, maxHeight: "90%" }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                        <Text style={{ color: TEXT, fontSize: 18, fontWeight: "800" }}>Availability</Text>
                        <Pressable onPress={onClose}><Ionicons name="close" size={22} color={TEXT} /></Pressable>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10, maxHeight: 50 }}>
                        {DAYS.map(d => (
                            <Pressable key={d} onPress={() => setDay(d)} style={{ padding: 10, backgroundColor: day === d ? BLUE : CARD, borderRadius: 10, marginRight: 5, height: 40 }}>
                                <Text style={{ color: 'white' }}>{d}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                    <FlatList
                        data={TIME_SLOTS}
                        numColumns={4}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <Pressable 
                                onPress={() => toggleSlot(day, item)}
                                style={{ flex: 1, margin: 4, padding: 8, backgroundColor: availability[day]?.includes(item) ? BLUE : CARD, borderRadius: 8, alignItems: 'center' }}
                            >
                                <Text style={{ color: 'white', fontSize: 12 }}>{item}</Text>
                            </Pressable>
                        )}
                    />
                    <View style={{ marginTop: 10 }}>
                      <PrimaryButton title="Done" onPress={onClose} />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// --- MAIN COMPONENT ---

export default function Profile() {
  const uid = auth.currentUser?.uid!;
  const [p, setP] = useState<UserProfile>(defaultProfile(uid));
  const [offerOpen, setOfferOpen] = useState(false);
  const [wantOpen, setWantOpen] = useState(false);
  const [availOpen, setAvailOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const existing = await getUserProfile(uid);
      if (existing) {
        setP({ 
          ...defaultProfile(uid), 
          ...existing, 
          availability: existing.availability || defaultProfile(uid).availability,
          radiusMiles: existing.radiusMiles ?? 25 // Ensure radius persists
        });
      }
    })();
  }, [uid]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "We need access to your photos.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled && res.assets && res.assets[0].uri) {
      setP((prev) => ({ ...prev, photoUrl: res.assets[0].uri }));
    }
  };

  const useGPS = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== "granted") return;
    const pos = await Location.getCurrentPositionAsync({});
    setP((prev) => ({ 
      ...prev, 
      lat: Number(pos.coords.latitude), 
      lng: Number(pos.coords.longitude) 
    }));
    Alert.alert("GPS Updated", "Coordinates locked for distance calculation.");
  };

  const save = async () => {
    if (!p.name) return Alert.alert("Required", "Please enter your name.");
    setSaving(true);
    try {
      const profileToSave = {
        ...p,
        lat: Number(p.lat) || 0,
        lng: Number(p.lng) || 0,
        radiusMiles: Number(p.radiusMiles) || 25,
      };
      await upsertUserProfile(profileToSave);
      Alert.alert("Success", "Profile saved!");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save profile.");
    } finally { setSaving(false); }
  };

  const offerLabels = useMemo(() => p.skillsOffer.map(prettySkillLabel), [p.skillsOffer]);
  const wantLabels = useMemo(() => p.skillsWant.map(prettySkillLabel), [p.skillsWant]);
  const totalAvail = useMemo(() => DAYS.reduce((acc, d) => acc + (p.availability?.[d]?.length || 0), 0), [p.availability]);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 28, paddingTop: 50 }}>
        <Text style={{ color: TEXT, fontSize: 32, fontWeight: "900", marginBottom: 10 }}>Profile</Text>

        <Card>
          <FieldLabel text="Profile Photo" />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(0,0,0,0.15)", overflow: "hidden", borderWidth: 1, borderColor: BORDER, justifyContent: 'center', alignItems: 'center' }}>
              {p.photoUrl ? <Image source={{ uri: p.photoUrl }} style={{ width: "100%", height: "100%" }} /> : <Ionicons name="person" size={40} color={MUTED} />}
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Change Photo" onPress={pickImage} />
            </View>
          </View>
        </Card>

        <Card>
          <FieldLabel text="Name" />
          <Input value={p.name} onChangeText={(v: string) => setP(prev => ({ ...prev, name: v }))} placeholder="Your name" />
          <FieldLabel text="Bio" />
          <Input value={p.bio} onChangeText={(v: string) => setP(prev => ({ ...prev, bio: v }))} placeholder="Tell others about yourself..." multiline />
        </Card>

        <Card>
          <FieldLabel text="Skills" />
          <GhostButton title={`Offering (${p.skillsOffer.length})`} onPress={() => setOfferOpen(true)} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginVertical: 4 }}>
            {offerLabels.map(l => <Chip key={l} label={l} />)}
          </View>
          <GhostButton title={`Wanting (${p.skillsWant.length})`} onPress={() => setWantOpen(true)} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginVertical: 4 }}>
            {wantLabels.map(l => <Chip key={l} label={l} />)}
          </View>
        </Card>

        <Card>
            <FieldLabel text="Availability" />
            <GhostButton title={`Set Schedule (${totalAvail} slots)`} onPress={() => setAvailOpen(true)} />
        </Card>

        <Card>
          <FieldLabel text="Location" />
          <Input value={p.address} onChangeText={(v: string) => setP(prev => ({ ...prev, address: v }))} placeholder="City, State" />
          
          {/* Integrated Discovery Radius Miles */}
          <FieldLabel text={`Discovery Radius (${p.radiusMiles || 25} miles)`} />
          <Input 
            value={String(p.radiusMiles || "")} 
            onChangeText={(v: string) => setP(prev => ({ ...prev, radiusMiles: parseInt(v) || 0 }))} 
            placeholder="e.g. 25" 
            keyboardType="number-pad"
          />

          <GhostButton title="Get Current Location (GPS)" onPress={useGPS} />
          {p.lat !== 0 && <Text style={{ color: BLUE, fontSize: 12, fontWeight: '700' }}>✓ Coordinates Set</Text>}
        </Card>

        <PrimaryButton title={saving ? "Saving..." : "Save Profile"} onPress={save} />
      </ScrollView>

      <SkillPickerModal visible={offerOpen} title="Skills you offer" selected={p.skillsOffer} onClose={() => setOfferOpen(false)} onChange={(next: any) => setP(prev => ({ ...prev, skillsOffer: next }))} />
      <SkillPickerModal visible={wantOpen} title="Skills you want" selected={p.skillsWant} onClose={() => setWantOpen(false)} onChange={(next: any) => setP(prev => ({ ...prev, skillsWant: next }))} />
      <AvailabilityModal visible={availOpen} availability={p.availability} onClose={() => setAvailOpen(false)} onChange={(next: any) => setP(prev => ({ ...prev, availability: next }))} />
    </View>
  );
}