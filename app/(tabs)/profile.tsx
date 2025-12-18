import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Modal, FlatList, Image, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../firebase";
import { getUserProfile, upsertUserProfile } from "../../lib/firestore";
import { UserProfile, UserAvailability } from "../../lib/types";

const BLUE = "#1E5BFF";
const BG = "#071022";
const CARD = "#0D1A36";
const BORDER = "rgba(255,255,255,0.10)";
const TEXT = "rgba(255,255,255,0.92)";
const MUTED = "rgba(255,255,255,0.65)";

const SKILLS: { id: string; label: string }[] = [
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "csharp", label: "C#" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "react", label: "React" },
  { id: "react_native", label: "React Native" },
  { id: "nextjs", label: "Next.js" },
  { id: "nodejs", label: "Node.js" },
  { id: "express", label: "Express.js" },
  { id: "django", label: "Django" },
  { id: "flask", label: "Flask" },
  { id: "spring_boot", label: "Spring Boot" },
  { id: "sql", label: "SQL" },
  { id: "postgresql", label: "PostgreSQL" },
  { id: "mysql", label: "MySQL" },
  { id: "mongodb", label: "MongoDB" },
  { id: "firebase", label: "Firebase" },
  { id: "supabase", label: "Supabase" },
  { id: "aws", label: "AWS" },
  { id: "docker", label: "Docker" },
  { id: "kubernetes", label: "Kubernetes" },
  { id: "linux", label: "Linux" },
  { id: "git", label: "Git" },
  { id: "github", label: "GitHub" },
  { id: "web_dev", label: "Web Development" },
  { id: "mobile_dev", label: "Mobile Development" },
  { id: "api_design", label: "API Design" },
  { id: "system_design", label: "System Design" },
  { id: "data_structures", label: "Data Structures" },
  { id: "algorithms", label: "Algorithms" },

  { id: "data_science", label: "Data Science" },
  { id: "machine_learning", label: "Machine Learning" },
  { id: "deep_learning", label: "Deep Learning" },
  { id: "statistics", label: "Statistics" },
  { id: "excel", label: "Excel" },
  { id: "power_bi", label: "Power BI" },
  { id: "tableau", label: "Tableau" },

  { id: "uiux", label: "UI/UX Design" },
  { id: "graphic_design", label: "Graphic Design" },
  { id: "figma", label: "Figma" },
  { id: "adobe_photoshop", label: "Adobe Photoshop" },
  { id: "adobe_illustrator", label: "Adobe Illustrator" },
  { id: "adobe_premiere", label: "Adobe Premiere Pro" },
  { id: "after_effects", label: "After Effects" },
  { id: "motion_design", label: "Motion Design" },
  { id: "photography", label: "Photography" },
  { id: "videography", label: "Videography" },
  { id: "video_editing", label: "Video Editing" },
  { id: "content_creation", label: "Content Creation" },
  { id: "copywriting", label: "Copywriting" },

  { id: "drawing", label: "Drawing" },
  { id: "painting", label: "Painting" },
  { id: "digital_art", label: "Digital Art" },
  { id: "sculpture", label: "Sculpture" },
  { id: "crafts", label: "Crafts" },
  { id: "calligraphy", label: "Calligraphy" },

  { id: "guitar", label: "Guitar" },
  { id: "piano", label: "Piano" },
  { id: "singing", label: "Singing" },
  { id: "music_production", label: "Music Production" },
  { id: "dj", label: "DJing" },
  { id: "music_theory", label: "Music Theory" },

  { id: "hip_hop_dance", label: "Hip Hop Dance" },
  { id: "ballet", label: "Ballet" },
  { id: "salsa", label: "Salsa" },
  { id: "bachata", label: "Bachata" },
  { id: "contemporary_dance", label: "Contemporary Dance" },
  { id: "breakdancing", label: "Breakdancing" },

  { id: "strength_training", label: "Strength Training" },
  { id: "weight_loss", label: "Weight Loss Coaching" },
  { id: "running", label: "Running" },
  { id: "yoga", label: "Yoga" },
  { id: "pilates", label: "Pilates" },
  { id: "boxing", label: "Boxing" },
  { id: "martial_arts", label: "Martial Arts" },

  { id: "cooking", label: "Cooking" },
  { id: "baking", label: "Baking" },
  { id: "meal_prep", label: "Meal Prep" },
  { id: "nutrition", label: "Nutrition" },

  { id: "spanish", label: "Spanish" },
  { id: "french", label: "French" },
  { id: "mandarin", label: "Mandarin" },
  { id: "hindi", label: "Hindi" },
  { id: "arabic", label: "Arabic" },
  { id: "english_tutoring", label: "English Tutoring" },

  { id: "math", label: "Math" },
  { id: "calculus", label: "Calculus" },
  { id: "physics", label: "Physics" },
  { id: "chemistry", label: "Chemistry" },
  { id: "biology", label: "Biology" },
  { id: "writing", label: "Writing" },
  { id: "tutoring", label: "Tutoring" },
  { id: "study_skills", label: "Study Skills" },

  { id: "resume", label: "Resume Review" },
  { id: "interview_prep", label: "Interview Prep" },
  { id: "public_speaking", label: "Public Speaking" },
  { id: "networking", label: "Networking" },
  { id: "leadership", label: "Leadership" },
  { id: "project_management", label: "Project Management" },

  { id: "marketing", label: "Marketing" },
  { id: "social_media_marketing", label: "Social Media Marketing" },
  { id: "seo", label: "SEO" },
  { id: "sales", label: "Sales" },
  { id: "entrepreneurship", label: "Entrepreneurship" },
  { id: "finance", label: "Personal Finance" },

  { id: "plumbing", label: "Plumbing" },
  { id: "electrical", label: "Electrical Work" },
  { id: "carpentry", label: "Carpentry" },
  { id: "welding", label: "Welding" },
  { id: "mechanics", label: "Auto Mechanics" },
  { id: "hvac", label: "HVAC" },
  { id: "landscaping", label: "Landscaping" },
  { id: "home_repair", label: "Home Repair" },

  { id: "haircutting", label: "Haircutting" },
  { id: "makeup", label: "Makeup" },
  { id: "skincare", label: "Skincare" },

  { id: "driving", label: "Driving Practice" },
  { id: "time_management", label: "Time Management" },
  { id: "productivity", label: "Productivity Systems" },
];


const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

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
    uid,
    name: "",
    photoUrl: "",
    bio: "",
    skillsOffer: [],
    skillsWant: [],
    availability: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] },
    locationName: "",
    address: "",
    lat: 0,
    lng: 0,
    radiusMiles: 25,
  };
}

function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "rgba(30,91,255,0.16)", borderWidth: 1, borderColor: "rgba(30,91,255,0.35)" }}>
      <Text style={{ color: TEXT, fontSize: 13, fontWeight: "600" }}>{label}</Text>
      {onRemove ? (
        <Pressable onPress={onRemove} style={{ padding: 2 }}>
          <Ionicons name="close" size={16} color={TEXT} />
        </Pressable>
      ) : null}
    </View>
  );
}

function Card({ children }: { children: any }) {
  return <View style={{ backgroundColor: CARD, borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 14, gap: 10 }}>{children}</View>;
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

function Input({ value, onChangeText, placeholder, multiline }: { value: string; onChangeText: (v: string) => void; placeholder: string; multiline?: boolean }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={"rgba(255,255,255,0.35)"}
      multiline={multiline}
      style={{
        color: TEXT,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: "rgba(0,0,0,0.15)",
        paddingHorizontal: 12,
        paddingVertical: multiline ? 12 : 10,
        borderRadius: 14,
        minHeight: multiline ? 90 : undefined,
        textAlignVertical: multiline ? "top" : "center",
        fontSize: 15,
        fontWeight: "600",
      }}
    />
  );
}

function SkillPickerModal({
  visible,
  title,
  selected,
  onClose,
  onChange,
}: {
  visible: boolean;
  title: string;
  selected: string[];
  onClose: () => void;
  onChange: (next: string[]) => void;
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!visible) setQ("");
  }, [visible]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return SKILLS;
    return SKILLS.filter((s) => s.label.toLowerCase().includes(t));
  }, [q]);

  const toggle = (id: string) => {
    const set = new Set(selected);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange(Array.from(set));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", padding: 14, justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: BG, borderRadius: 22, borderWidth: 1, borderColor: BORDER, padding: 14, maxHeight: "85%" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: TEXT, fontSize: 18, fontWeight: "800" }}>{title}</Text>
            <Pressable onPress={onClose} style={{ padding: 6 }}>
              <Ionicons name="close" size={22} color={TEXT} />
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "rgba(0,0,0,0.15)" }}>
            <Ionicons name="search" size={18} color={MUTED} />
            <TextInput value={q} onChangeText={setQ} placeholder="Search skills" placeholderTextColor={"rgba(255,255,255,0.35)"} style={{ color: TEXT, fontSize: 15, fontWeight: "600", flex: 1 }} />
          </View>

          <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {selected.map((id) => (
              <Chip key={id} label={prettySkillLabel(id)} onRemove={() => toggle(id)} />
            ))}
          </View>

          <View style={{ height: 12 }} />

          <FlatList
            data={filtered}
            keyExtractor={(x) => x.id}
            renderItem={({ item }) => {
              const active = selected.includes(item.id);
              return (
                <Pressable
                  onPress={() => toggle(item.id)}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: active ? "rgba(30,91,255,0.65)" : BORDER,
                    backgroundColor: active ? "rgba(30,91,255,0.12)" : "rgba(0,0,0,0.12)",
                    marginBottom: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: TEXT, fontSize: 15, fontWeight: "700" }}>{item.label}</Text>
                  <Ionicons name={active ? "checkmark-circle" : "ellipse-outline"} size={22} color={active ? BLUE : MUTED} />
                </Pressable>
              );
            }}
          />

          <PrimaryButton title="Done" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function AvailabilityModal({
  visible,
  availability,
  onClose,
  onChange,
}: {
  visible: boolean;
  availability: UserAvailability;
  onClose: () => void;
  onChange: (next: UserAvailability) => void;
}) {
  const [day, setDay] = useState<string>("Mon");

  useEffect(() => {
    if (visible) setDay("Mon");
  }, [visible]);

  const toggleSlot = (d: string, slot: string) => {
    const current = new Set(availability[d] || []);
    if (current.has(slot)) current.delete(slot);
    else current.add(slot);
    const next: UserAvailability = { ...availability, [d]: Array.from(current).sort() };
    onChange(next);
  };

  const clearDay = (d: string) => {
    onChange({ ...availability, [d]: [] });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", padding: 14, justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: BG, borderRadius: 22, borderWidth: 1, borderColor: BORDER, padding: 14, maxHeight: "90%" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: TEXT, fontSize: 18, fontWeight: "800" }}>Availability</Text>
            <Pressable onPress={onClose} style={{ padding: 6 }}>
              <Ionicons name="close" size={22} color={TEXT} />
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {DAYS.map((d) => {
              const active = d === day;
              const count = (availability[d] || []).length;
              return (
                <Pressable
                  key={d}
                  onPress={() => setDay(d)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? "rgba(30,91,255,0.70)" : BORDER,
                    backgroundColor: active ? "rgba(30,91,255,0.14)" : "rgba(0,0,0,0.14)",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Text style={{ color: TEXT, fontSize: 14, fontWeight: "800" }}>{d}</Text>
                  <Text style={{ color: MUTED, fontSize: 12, fontWeight: "800" }}>{count}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ height: 12 }} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: MUTED, fontSize: 13, fontWeight: "800" }}>Pick time slots for {day}</Text>
            <Pressable onPress={() => clearDay(day)} style={{ paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: BORDER }}>
              <Text style={{ color: TEXT, fontWeight: "800" }}>Clear</Text>
            </Pressable>
          </View>

          <View style={{ height: 10 }} />

          <FlatList
            data={TIME_SLOTS}
            keyExtractor={(x) => x}
            numColumns={4}
            columnWrapperStyle={{ gap: 8 }}
            contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
            renderItem={({ item }) => {
              const active = (availability[day] || []).includes(item);
              return (
                <Pressable
                  onPress={() => toggleSlot(day, item)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: active ? "rgba(30,91,255,0.75)" : BORDER,
                    backgroundColor: active ? "rgba(30,91,255,0.14)" : "rgba(0,0,0,0.14)",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: TEXT, fontWeight: "800", fontSize: 13 }}>{item}</Text>
                </Pressable>
              );
            }}
          />

          <PrimaryButton title="Done" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

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
        });
      }
    })();
  }, [uid]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (res.canceled) return;
    const uri = res.assets?.[0]?.uri;
    if (!uri) return;
    setP((prev) => ({ ...prev, photoUrl: uri }));
  };

  const useGPS = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== "granted") return;

    const pos = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = pos.coords;
    const rev = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = rev?.[0];
    const locationName = place ? `${place.city || ""}${place.region ? `, ${place.region}` : ""}`.trim() : "";
    const address = place
      ? [place.name, place.street, place.city, place.region, place.postalCode].filter(Boolean).join(", ")
      : "";

    setP((prev) => ({
      ...prev,
      lat: latitude,
      lng: longitude,
      locationName: locationName || prev.locationName,
      address: address || prev.address,
    }));
  };

  const geocodeAddress = async () => {
    const a = p.address.trim();
    if (!a) return;
    const res = await Location.geocodeAsync(a);
    if (!res?.length) return;
    const { latitude, longitude } = res[0];
    setP((prev) => ({ ...prev, lat: latitude, lng: longitude, locationName: prev.locationName || a }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: UserProfile = {
        ...p,
        radiusMiles: Number(p.radiusMiles) || 25,
        lat: Number(p.lat) || 0,
        lng: Number(p.lng) || 0,
      };
      setP(payload);
      await upsertUserProfile(payload);
    } finally {
      setSaving(false);
    }
  };

  const offerLabels = useMemo(() => p.skillsOffer.map(prettySkillLabel), [p.skillsOffer]);
  const wantLabels = useMemo(() => p.skillsWant.map(prettySkillLabel), [p.skillsWant]);
  const totalAvail = useMemo(() => DAYS.reduce((acc, d) => acc + (p.availability?.[d]?.length || 0), 0), [p.availability]);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 28 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: TEXT, fontSize: 26, fontWeight: "900" }}>Profile</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Pressable onPress={useGPS} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: "rgba(30,91,255,0.55)" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="locate" size={18} color={TEXT} />
                <Text style={{ color: TEXT, fontWeight: "800" }}>Use GPS</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <Card>
          <FieldLabel text="Profile photo" />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 74, height: 74, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: "rgba(0,0,0,0.15)", overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
              {p.photoUrl ? <Image source={{ uri: p.photoUrl }} style={{ width: "100%", height: "100%" }} /> : <Ionicons name="person" size={34} color={MUTED} />}
            </View>
            <View style={{ flex: 1, gap: 10 }}>
              <PrimaryButton title="Upload from library" onPress={pickImage} />
              <Text style={{ color: MUTED, fontSize: 12, fontWeight: "700" }}>{Platform.OS === "ios" ? "If it asks, allow Photos access" : "If it asks, allow media access"}</Text>
            </View>
          </View>
        </Card>

        <Card>
          <FieldLabel text="Name" />
          <Input value={p.name} onChangeText={(v) => setP((prev) => ({ ...prev, name: v }))} placeholder="Your name" />

          <FieldLabel text="Bio" />
          <Input value={p.bio} onChangeText={(v) => setP((prev) => ({ ...prev, bio: v }))} placeholder="What you can teach and what you want to learn" multiline />
        </Card>

        <Card>
          <FieldLabel text="Availability" />
          <Pressable onPress={() => setAvailOpen(true)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "rgba(0,0,0,0.15)" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="calendar" size={18} color={TEXT} />
              <Text style={{ color: TEXT, fontSize: 15, fontWeight: "800" }}>Pick weekly times</Text>
            </View>
            <Text style={{ color: MUTED, fontWeight: "800" }}>{totalAvail} slots</Text>
          </Pressable>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {DAYS.map((d) => {
              const count = p.availability?.[d]?.length || 0;
              if (!count) return null;
              return <Chip key={d} label={`${d}: ${count}`} />;
            })}
          </View>
        </Card>

        <Card>
          <FieldLabel text="Skills you offer" />
          <Pressable onPress={() => setOfferOpen(true)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "rgba(0,0,0,0.15)" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="search" size={18} color={TEXT} />
              <Text style={{ color: TEXT, fontSize: 15, fontWeight: "800" }}>Search and select</Text>
            </View>
            <Text style={{ color: MUTED, fontWeight: "800" }}>{p.skillsOffer.length}</Text>
          </Pressable>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {offerLabels.map((label, idx) => (
              <Chip key={`${label}-${idx}`} label={label} onRemove={() => setP((prev) => ({ ...prev, skillsOffer: prev.skillsOffer.filter((x) => prettySkillLabel(x) !== label) }))} />
            ))}
          </View>
        </Card>

        <Card>
          <FieldLabel text="Skills you want" />
          <Pressable onPress={() => setWantOpen(true)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "rgba(0,0,0,0.15)" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="search" size={18} color={TEXT} />
              <Text style={{ color: TEXT, fontSize: 15, fontWeight: "800" }}>Search and select</Text>
            </View>
            <Text style={{ color: MUTED, fontWeight: "800" }}>{p.skillsWant.length}</Text>
          </Pressable>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {wantLabels.map((label, idx) => (
              <Chip key={`${label}-${idx}`} label={label} onRemove={() => setP((prev) => ({ ...prev, skillsWant: prev.skillsWant.filter((x) => prettySkillLabel(x) !== label) }))} />
            ))}
          </View>
        </Card>

        <Card>
          <FieldLabel text="Location" />
          <Input value={p.address} onChangeText={(v) => setP((prev) => ({ ...prev, address: v }))} placeholder="Enter your address, then tap Verify" />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <GhostButton title="Verify address" onPress={geocodeAddress} />
            </View>
            <View style={{ flex: 1 }}>
              <GhostButton title="Use GPS" onPress={useGPS} />
            </View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: MUTED, fontWeight: "800" }}>{p.locationName || "No location yet"}</Text>
            <Text style={{ color: MUTED, fontWeight: "800" }}>{p.lat && p.lng ? `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` : ""}</Text>
          </View>
        </Card>

        <Card>
          <FieldLabel text="Distance radius (miles)" />
          <Input value={String(p.radiusMiles)} onChangeText={(v) => setP((prev) => ({ ...prev, radiusMiles: Number(v) || 25 }))} placeholder="25" />
        </Card>

        <PrimaryButton title={saving ? "Saving..." : "Save Profile"} onPress={save} />

        <Text style={{ color: MUTED, fontSize: 12, fontWeight: "700" }}>uid: {uid}</Text>
      </ScrollView>

      <SkillPickerModal visible={offerOpen} title="Skills you offer" selected={p.skillsOffer} onClose={() => setOfferOpen(false)} onChange={(next) => setP((prev) => ({ ...prev, skillsOffer: next }))} />
      <SkillPickerModal visible={wantOpen} title="Skills you want" selected={p.skillsWant} onClose={() => setWantOpen(false)} onChange={(next) => setP((prev) => ({ ...prev, skillsWant: next }))} />
      <AvailabilityModal visible={availOpen} availability={p.availability} onClose={() => setAvailOpen(false)} onChange={(next) => setP((prev) => ({ ...prev, availability: next }))} />
    </View>
  );
}
