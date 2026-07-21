import { Pressable, StyleSheet, Text, TextInput, View } from "react-native-web";

type ComposerProps = {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder?: string;
};

export function Composer({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Message the agent…",
}: ComposerProps) {
  const canSend = !disabled && value.trim().length > 0;

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline
        editable={!disabled}
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
