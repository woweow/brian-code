import { Pressable, StyleSheet, Text, TextInput, View } from "react-native-web";
import { isSendEnterKey } from "./composerKeys.js";

type ComposerProps = {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  disabled: boolean;
  locked?: boolean;
  placeholder?: string;
};

export function Composer({
  value,
  onChange,
  onSend,
  disabled,
  locked = false,
  placeholder = "Message the agent…",
}: ComposerProps) {
  const canSend = !disabled && value.trim().length > 0;
  const inputStyle = locked
    ? [styles.input, styles.inputLocked]
    : styles.input;

  function onKeyPress(event: {
    key: string;
    shiftKey: boolean;
    preventDefault: () => void;
  }): void {
    if (!isSendEnterKey(event.key, event.shiftKey)) {
      return;
    }
    event.preventDefault();
    if (canSend) {
      onSend();
    }
  }

  return (
    <View style={styles.wrap}>
      <TextInput
        style={inputStyle}
        value={value}
        onChangeText={onChange}
        placeholder={locked ? "Waiting for reply…" : placeholder}
        multiline
        editable={!disabled}
        onKeyPress={onKeyPress}
      />
      <Pressable
        style={canSend ? styles.send : [styles.send, styles.sendDisabled]}
        onPress={onSend}
        disabled={!canSend}
      >
        <Text style={styles.sendText}>Send</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    backgroundColor: "#111",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: "#3a3a3a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#f5f5f5",
    backgroundColor: "#1a1a1a",
    fontSize: 14,
  },
  inputLocked: {
    borderColor: "#2a2a2a",
    backgroundColor: "#151515",
    color: "#737373",
  },
  send: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendDisabled: {
    opacity: 0.45,
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
