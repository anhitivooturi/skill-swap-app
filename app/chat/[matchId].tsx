import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { auth } from "../../firebase";
import { listMessages, sendMessage } from "../../lib/firestore";

const BLUE = "#1E5BFF";
const BG = "#071022";
const CARD = "#0D1A36";
const TEXT = "rgba(255,255,255,0.92)";
const MUTED = "rgba(255,255,255,0.65)";

export default function MatchChat() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const uid = auth.currentUser?.uid!;
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  const refresh = async () => {
    if (!matchId) return;
    const ms = await listMessages(matchId);
    setMessages(ms);
  };

  useEffect(() => {
    refresh();
    // For a hackathon, a simple poll every 3 seconds works for "real-time"
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [matchId]);

  const onSend = async () => {
    const t = text.trim();
    if (!t || !matchId) return;
    setText("");
    await sendMessage(matchId, uid, t);
    await refresh();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
        {messages.length === 0 ? (
          <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
        ) : (
          messages.map((m) => (
            <View 
              key={m.id} 
              style={[
                styles.bubble, 
                m.fromUid === uid ? styles.myBubble : styles.theirBubble
              ]}
            >
              <Text style={styles.messageText}>{m.text}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput 
          value={text} 
          onChangeText={setText} 
          placeholder="Type a message..." 
          placeholderTextColor={MUTED}
          style={styles.input} 
        />
        <Pressable onPress={onSend} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, padding: 16 },
  emptyText: { color: MUTED, textAlign: 'center', marginTop: 40 },
  bubble: { padding: 12, borderRadius: 16, maxWidth: "80%" },
  myBubble: { alignSelf: "flex-end", backgroundColor: BLUE },
  theirBubble: { alignSelf: "flex-start", backgroundColor: CARD, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  messageText: { color: "white", fontSize: 16 },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  input: { flex: 1, backgroundColor: CARD, color: TEXT, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  sendButton: { backgroundColor: BLUE, paddingHorizontal: 20, borderRadius: 14, justifyContent: "center" },
  sendButtonText: { color: "white", fontWeight: "900" }
});