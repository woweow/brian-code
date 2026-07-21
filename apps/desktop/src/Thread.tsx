import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewHandle,
} from "react-native-web";
import { isSendEnterKey } from "./composerKeys.js";
import { WaitingMascot } from "./WaitingMascot.js";
import type { ConversationDetail, UiTurn } from "./types.js";

type ThreadProps = {
  conversation: ConversationDetail | null;
  loading: boolean;
  sending: boolean;
  error: string;
  hasSelection: boolean;
  onRewrite: (turnIndex: number, text: string) => void;
};

function Bubble({
  turn,
  index,
  canEdit,
  onRewrite,
}: {
  turn: UiTurn;
  index: number;
  canEdit: boolean;
  onRewrite: (turnIndex: number, text: string) => void;
}) {
  const isUser = turn.role === "user";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(turn.text);

  useEffect(() => {
    if (!editing) {
      setDraft(turn.text);
    }
  }, [turn.text, editing]);

  function cancelEdit(): void {
    setDraft(turn.text);
    setEditing(false);
  }

  function submit(): void {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    setEditing(false);
    onRewrite(index, trimmed);
  }

  function onKeyPress(event: {
    key: string;
    shiftKey: boolean;
    preventDefault: () => void;
  }): void {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
      return;
    }
    if (!isSendEnterKey(event.key, event.shiftKey)) {
      return;
    }
    event.preventDefault();
    submit();
  }

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
        {editing ? (
          <TextInput
            style={styles.editInput}
            value={draft}
            onChangeText={setDraft}
            multiline
            onBlur={cancelEdit}
            onKeyPress={onKeyPress}
          />
        ) : (
          <Text style={styles.bubbleText}>{turn.text}</Text>
        )}
      </View>
      {isUser && canEdit && !editing ? (
        <Pressable
          style={styles.editButton}
          onPress={() => {
            setDraft(turn.text);
            setEditing(true);
          }}
        >
          <Text style={styles.editIcon}>✎</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Thread({
  conversation,
  loading,
  sending,
  error,
  hasSelection,
  onRewrite,
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
            <Bubble
              key={`${turn.role}-${index}`}
              turn={turn}
              index={index}
              canEdit={!sending}
              onRewrite={onRewrite}
            />
          ))}
          {sending ? (
            <View style={styles.waitingRow}>
              <WaitingMascot />
              <Text style={styles.statusInline}>Waiting for reply…</Text>
            </View>
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
  waitingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  statusInline: {
    color: "#a3a3a3",
    fontSize: 13,
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
    alignItems: "flex-start",
    gap: 6,
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
  editInput: {
    color: "#f5f5f5",
    fontSize: 14,
    lineHeight: 21,
    minWidth: 180,
    minHeight: 42,
    padding: 0,
    margin: 0,
  },
  editButton: {
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginTop: 4,
  },
  editIcon: {
    color: "#a3a3a3",
    fontSize: 14,
  },
});
