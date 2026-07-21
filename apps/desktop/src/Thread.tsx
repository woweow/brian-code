import { useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewHandle,
} from "react-native-web";
import type { ConversationDetail, UiTurn } from "./types.js";

type ThreadProps = {
  conversation: ConversationDetail | null;
  loading: boolean;
  sending: boolean;
  error: string;
  hasSelection: boolean;
};

function Bubble({ turn }: { turn: UiTurn }) {
  const isUser = turn.role === "user";
  return (
    <View
      style={
        isUser
          ? [styles.bubbleRow, styles.bubbleRowUser]
          : [styles.bubbleRow, styles.bubbleRowAssistant]
      }
    >
      <View
        style={
          isUser
            ? [styles.bubble, styles.bubbleUser]
            : [styles.bubble, styles.bubbleAssistant]
        }
      >
        <Text style={styles.role}>{isUser ? "You" : "Assistant"}</Text>
        <Text style={styles.bubbleText}>{turn.text}</Text>
      </View>
    </View>
  );
}

export function Thread({
  conversation,
  loading,
  sending,
  error,
  hasSelection,
}: ThreadProps) {
  const scrollRef = useRef<ScrollViewHandle | null>(null);
  const turnCount = conversation?.turns.length ?? 0;

  useEffect(() => {
    if (!conversation || (turnCount === 0 && !sending)) {
      return;
    }
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [conversation, turnCount, sending]);

  if (!hasSelection) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No chat selected</Text>
        <Text style={styles.emptyBody}>
          Choose a conversation or start a new chat.
        </Text>
      </View>
    );
  }

  if (loading && !conversation) {
    return (
      <View style={styles.center}>
        <Text style={styles.status}>Loading conversation…</Text>
      </View>
    );
  }

  if (error && !conversation) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!conversation) {
    return (
      <View style={styles.center}>
        <Text style={styles.status}>Conversation not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {conversation.title}
        </Text>
        <Text style={styles.path} numberOfLines={1}>
          {conversation.folderPath}
        </Text>
      </View>
      {error ? <Text style={styles.errorInline}>{error}</Text> : null}
      {conversation.turns.length === 0 && !sending ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Empty thread</Text>
          <Text style={styles.emptyBody}>
            Send a message to start this conversation.
          </Text>
        </View>
      ) : (
        <ScrollView ref={scrollRef} style={styles.scroll}>
          {conversation.turns.map((turn, index) => (
            <Bubble key={`${turn.role}-${index}`} turn={turn} />
          ))}
          {sending ? (
            <Text style={styles.statusInline}>Waiting for reply…</Text>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  title: {
    color: "#f5f5f5",
    fontSize: 16,
    fontWeight: "600",
  },
  path: {
    color: "#737373",
    fontSize: 12,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    color: "#e5e5e5",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptyBody: {
    color: "#8a8a8a",
    fontSize: 14,
    textAlign: "center",
  },
  status: {
    color: "#a3a3a3",
    fontSize: 14,
  },
  statusInline: {
    color: "#a3a3a3",
    fontSize: 13,
    marginTop: 8,
    marginBottom: 16,
  },
  error: {
    color: "#f87171",
    fontSize: 14,
    textAlign: "center",
  },
  errorInline: {
    color: "#f87171",
    fontSize: 13,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  bubbleRow: {
    marginBottom: 12,
    flexDirection: "row",
  },
  bubbleRowUser: {
    justifyContent: "flex-end",
  },
  bubbleRowAssistant: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: "#2563eb",
  },
  bubbleAssistant: {
    backgroundColor: "#1f1f1f",
    borderWidth: 1,
    borderColor: "#333",
  },
  role: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  bubbleText: {
    color: "#f5f5f5",
    fontSize: 14,
    lineHeight: 21,
  },
});
