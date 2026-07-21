import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native-web";

export function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(): Promise<void> {
    const trimmed = prompt.trim();
    if (!trimmed || loading) {
      return;
    }

    setLoading(true);
    setError("");
    setResponse("");

    try {
      if (!window.api?.runAgent) {
        throw new Error(
          "Agent API is only available in the Electron app. Run npm run desktop (or desktop:dev).",
        );
      }
      const text = await window.api.runAgent(trimmed);
      setResponse(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const inElectron = Boolean(window.api?.runAgent);

  return (
    <View style={styles.container}>
      {!inElectron ? (
        <Text style={styles.hint}>
          Browser preview: UI only. Use npm run desktop to call the agent.
        </Text>
      ) : null}
      <Text style={styles.label}>Prompt</Text>
      <TextInput
        style={styles.input}
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Ask the agent…"
        multiline
        editable={!loading}
      />
      <Pressable
        style={loading ? [styles.button, styles.buttonDisabled] : styles.button}
        onPress={() => void onSubmit()}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "Running…" : "Submit"}</Text>
      </Pressable>
      {loading ? <ActivityIndicator style={styles.spinner} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {response ? (
        <ScrollView style={styles.responseBox}>
          <Text style={styles.response}>{response}</Text>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: "#111",
    minHeight: "100vh",
  },
  label: {
    color: "#eee",
    fontSize: 14,
    fontWeight: "600",
  },
  hint: {
    color: "#a3a3a3",
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    color: "#fff",
    backgroundColor: "#1a1a1a",
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  spinner: {
    marginTop: 8,
  },
  error: {
    color: "#f87171",
  },
  responseBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#1a1a1a",
  },
  response: {
    color: "#e5e5e5",
    lineHeight: 22,
  },
});
