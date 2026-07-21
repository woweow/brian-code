import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native-web";
import { getDesktopApi, isUsingMockApi } from "./api.js";
import { Composer } from "./Composer.js";
import { Sidebar } from "./Sidebar.js";
import { Thread } from "./Thread.js";
import type { ConversationDetail, SidebarPayload } from "./types.js";

export function App() {
  const api = getDesktopApi();
  const [sidebar, setSidebar] = useState<SidebarPayload | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationDetail | null>(
    null,
  );
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function bootstrap(): Promise<void> {
      setLoading(true);
      setError("");
      try {
        const data = await api.getBootstrap();
        if (cancelled) {
          return;
        }
        setSidebar(data.sidebar);
        if (data.lastConversationId) {
          setSelectedId(data.lastConversationId);
          const detail = await api.getConversation(data.lastConversationId);
          if (!cancelled) {
            setConversation(detail);
          }
        } else {
          setSelectedId(null);
          setConversation(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [api]);

  async function refreshSidebar(): Promise<void> {
    const next = await api.listSidebar();
    setSidebar(next);
  }

  async function selectConversation(id: string): Promise<void> {
    setSelectedId(id);
    setConversation(null);
    setLoading(true);
    setError("");
    try {
      const detail = await api.getConversation(id);
      setConversation(detail);
    } catch (err) {
      setConversation(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function onNewChat(): Promise<void> {
    setError("");
    setActionBusy(true);
    try {
      const folder = await api.pickFolder();
      if (!folder) {
        return;
      }
      const created = await api.createConversation(folder);
      await refreshSidebar();
      setSelectedId(created.id);
      setConversation(created);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionBusy(false);
    }
  }

  async function onDelete(id: string): Promise<void> {
    setError("");
    setActionBusy(true);
    try {
      await api.deleteConversation(id);
      if (selectedId === id) {
        setSelectedId(null);
        setConversation(null);
        const next = await api.getBootstrap();
        setSidebar(next.sidebar);
        if (next.lastConversationId) {
          await selectConversation(next.lastConversationId);
        }
      } else {
        await refreshSidebar();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionBusy(false);
    }
  }

  async function onSend(): Promise<void> {
    const trimmed = draft.trim();
    if (!selectedId || !trimmed || sending || actionBusy) {
      return;
    }
    setSending(true);
    setError("");
    try {
      const updated = await api.sendMessage(selectedId, trimmed);
      setConversation(updated);
      setDraft("");
      await refreshSidebar();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }

  const busy = loading || sending || actionBusy;

  return (
    <View style={styles.shell}>
      <Sidebar
        sidebar={sidebar}
        selectedId={selectedId}
        onSelect={(id) => void selectConversation(id)}
        onNewChat={() => void onNewChat()}
        onDelete={(id) => void onDelete(id)}
        busy={busy}
      />
      <View style={styles.main}>
        {isUsingMockApi() ? (
          <Text style={styles.banner}>
            Browser preview with mock data. Real Electron IPC / conversations
            cannot be tested here.
          </Text>
        ) : null}
        <Thread
          conversation={conversation}
          loading={loading}
          sending={sending}
          error={error}
          hasSelection={selectedId !== null}
        />
        <Composer
          value={draft}
          onChange={setDraft}
          onSend={() => void onSend()}
          disabled={!selectedId || busy}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#111",
    minHeight: "100vh",
  },
  main: {
    flex: 1,
    minWidth: 0,
    minHeight: "100vh",
  },
  banner: {
    color: "#a3a3a3",
    fontSize: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
    backgroundColor: "#171717",
  },
});
