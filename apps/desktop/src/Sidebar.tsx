import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native-web";
import type { SidebarPayload } from "./types.js";

type SidebarProps = {
  sidebar: SidebarPayload | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  busy: boolean;
};

function shortPath(folderPath: string): string {
  const parts = folderPath.split("/").filter(Boolean);
  if (parts.length <= 2) {
    return folderPath;
  }
  return `…/${parts.slice(-2).join("/")}`;
}

export function Sidebar({
  sidebar,
  selectedId,
  onSelect,
  onNewChat,
  onDelete,
  busy,
}: SidebarProps) {
  return (
    <View style={styles.rail}>
      <Pressable
        style={busy ? [styles.newButton, styles.disabled] : styles.newButton}
        onPress={onNewChat}
        disabled={busy}
      >
        <Text style={styles.newButtonText}>New chat</Text>
      </Pressable>
      <ScrollView style={styles.list}>
        {!sidebar || sidebar.groups.length === 0 ? (
          <Text style={styles.empty}>No conversations yet</Text>
        ) : (
          sidebar.groups.map((group) => (
            <View key={group.workspaceId} style={styles.group}>
              <Text style={styles.groupLabel} numberOfLines={1}>
                {shortPath(group.folderPath)}
              </Text>
              {group.conversations.map((conv) => {
                const selected = conv.id === selectedId;
                return (
                  <View
                    key={conv.id}
                    style={
                      selected
                        ? [styles.itemRow, styles.itemRowSelected]
                        : styles.itemRow
                    }
                  >
                    <Pressable
                      style={styles.itemPress}
                      onPress={() => onSelect(conv.id)}
                      disabled={busy}
                    >
                      <Text
                        style={
                          selected
                            ? [styles.itemTitle, styles.itemTitleSelected]
                            : styles.itemTitle
                        }
                        numberOfLines={1}
                      >
                        {conv.title}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.deletePress}
                      onPress={() => onDelete(conv.id)}
                      disabled={busy}
                    >
                      <Text style={styles.deleteText}>×</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 260,
    borderRightWidth: 1,
    borderRightColor: "#2a2a2a",
    backgroundColor: "#141414",
    paddingTop: 12,
    paddingHorizontal: 10,
    minHeight: "100vh",
  },
  newButton: {
    backgroundColor: "#1f1f1f",
    borderWidth: 1,
    borderColor: "#3a3a3a",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  newButtonText: {
    color: "#f5f5f5",
    fontSize: 14,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.55,
  },
  list: {
    flex: 1,
  },
  empty: {
    color: "#737373",
    fontSize: 13,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  group: {
    marginBottom: 16,
  },
  groupLabel: {
    color: "#8a8a8a",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 2,
  },
  itemRowSelected: {
    backgroundColor: "#262626",
  },
  itemPress: {
    flex: 1,
    paddingVertical: 9,
    paddingLeft: 10,
    paddingRight: 4,
  },
  itemTitle: {
    color: "#d4d4d4",
    fontSize: 13,
  },
  itemTitleSelected: {
    color: "#fafafa",
    fontWeight: "600",
  },
  deletePress: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  deleteText: {
    color: "#737373",
    fontSize: 16,
    lineHeight: 16,
  },
});
