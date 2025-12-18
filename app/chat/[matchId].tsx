import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { auth } from "../../firebase";
import { listMessages, sendMessage } from "../../lib/firestore";

export default function MatchChat() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const uid = auth.currentUser?.uid!;
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  const refresh = async () => {
    const ms = await listMessages(matchId!);
    setMessages(ms);
  };

  useEffect(() => {
    if (!matchId) return;
    refresh();
  }, [matchId]);

  const onSend = async () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    await sendMessage(matchId!, uid, t);
    await refresh();
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>{matchId}</Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10 }}>
        {messages.map((m) => (
          <View key={m.id} style={{ alignSelf: m.fromUid === uid ? "flex-end" : "flex-start", borderWidth: 1, borderRadius: 12, padding: 10, maxWidth: "80%" }}>
            <Text style={{ fontWeight: "600", marginBottom: 4 }}>{m.fromUid === uid ? "you" : "them"}</Text>
            <Text>{m.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <TextInput value={text} onChangeText={setText} placeholder="message" style={{ flex: 1, borderWidth: 1, padding: 12, borderRadius: 12 }} />
        <Pressable onPress={onSend} style={{ padding: 12, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontWeight: "600" }}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}
