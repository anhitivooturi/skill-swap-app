import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Keyboard,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { onSnapshot, collection, query, orderBy, doc, getDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../../firebase";
import { sendMessage, getUserProfile } from "../../lib/firestore";

const BLUE = "#1E5BFF";
const BG = "#071022";
const CARD = "#0D1A36";
const BORDER = "rgba(255,255,255,0.10)";
const TEXT = "rgba(255,255,255,0.92)";
const MUTED = "rgba(255,255,255,0.65)";

export default function MatchChat() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const uid = auth.currentUser?.uid!;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // 1. Fetch Partner Info
  useEffect(() => {
    async function fetchPartner() {
      if (!matchId) return;
      try {
        const matchRef = doc(db, "matches", matchId);
        const matchSnap = await getDoc(matchRef);
        
        if (matchSnap.exists()) {
          const matchData = matchSnap.data();
          const otherUid = matchData.users.find((id: string) => id !== uid);
          const profile = await getUserProfile(otherUid);
          setPartner(profile);
        }
      } catch (error) {
        console.error("Error fetching partner:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPartner();
  }, [matchId]);

  // 2. Real-time Messages
  useEffect(() => {
    if (!matchId) return;

    const q = query(
      collection(db, "matches", matchId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
      // Scroll to bottom after state update
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => unsubscribe();
  }, [matchId]);

  const onSend = async () => {
    const trimmedText = text.trim();
    if (!trimmedText || !matchId) return;
    
    setText(""); 
    try {
      await sendMessage(matchId, uid, trimmedText);
    } catch (e) {
      console.error("Send error:", e);
    }
  };

  // Helper to handle exiting chat safely
  const handleBack = () => {
    Keyboard.dismiss();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/chat");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={BLUE} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      style={styles.container}
    >
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: partner?.name || "Chat",
          headerStyle: { backgroundColor: "#071022" },
          headerTintColor: "#1E5BFF",
          headerTitleStyle: { fontWeight: '900', color: 'white' },
          headerLeft: () => (
            <Pressable 
              onPress={handleBack} 
              style={styles.backButton}
              hitSlop={20} // Makes the clickable area larger
            >
              <Ionicons name="chevron-back" size={28} color={BLUE} />
            </Pressable>
          ),
          headerRight: () => partner?.photoUrl ? (
            <Image 
              source={{ uri: partner.photoUrl }} 
              style={styles.headerAvatar} 
            />
          ) : null,
        }} 
      />

      <ScrollView 
        ref={scrollViewRef}
        style={styles.msgList} 
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled" // Allows tapping 'Back' while keyboard is up
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
          </View>
        ) : (
          messages.map((m) => {
            const isMe = m.fromUid === uid;
            return (
              <View 
                key={m.id} 
                style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}
              >
                <Text style={styles.msgText}>{m.text}</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={MUTED}
          style={styles.input}
          multiline
        />
        <Pressable 
          onPress={onSend} 
          style={[styles.sendBtn, !text.trim() && { opacity: 0.5 }]}
          disabled={!text.trim()}
        >
          <Ionicons name="send" size={20} color="white" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BG },
  backButton: { marginLeft: 0, padding: 5 },
  headerAvatar: { width: 34, height: 34, borderRadius: 17, marginRight: 10, borderWidth: 1, borderColor: BORDER },
  msgList: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20, gap: 12 },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 40 },
  emptyText: { color: MUTED, fontSize: 14, fontWeight: '600' },
  bubble: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, maxWidth: "85%" },
  myBubble: { alignSelf: "flex-end", backgroundColor: BLUE, borderBottomRightRadius: 4 },
  theirBubble: { alignSelf: "flex-start", backgroundColor: CARD, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: BORDER },
  msgText: { color: "white", fontSize: 16, lineHeight: 22 },
  inputBar: { 
    flexDirection: "row", 
    alignItems: 'center',
    gap: 12, 
    padding: 12, 
    paddingBottom: Platform.OS === 'ios' ? 36 : 12,
    backgroundColor: CARD, 
    borderTopWidth: 1, 
    borderTopColor: BORDER 
  },
  input: { 
    flex: 1, 
    backgroundColor: BG, 
    color: TEXT, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 24, 
    fontSize: 16,
    maxHeight: 100 
  },
  sendBtn: { 
    backgroundColor: BLUE, 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: "center", 
    alignItems: "center" 
  },
});