import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native-web";
import type { SidebarPayload } from "./types.js";

type SidebarProps = {
  sidebar: SidebarPayload | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onFork: (id: string) => void;
  onDelete: (id: string) => void;
  busy: boolean;
};

type SidebarActionProps = {
  label: string;
  glyph: string;
  onPress: () => void;
  disabled: boolean;
};

function shortPath(folderPath: string): string {
  const parts = folderPath.split("/").filter(Boolean);
  if (parts.length <= 2) {
    return folderPath;
  }
  return `…/${parts.slice(-2).join("/")}`;
}

function SidebarAction({
  label,
  glyph,
  onPress,
  disabled,
}: SidebarActionProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <View style={styles.actionWrap}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={
          hovered
            ? [styles.actionPress, styles.actionPressHovered]
            : styles.actionPress
        }
      >
        <Text style={styles.actionText}>{glyph}</Text>
      </Pressable>
      {hovered ? (
        <View style={styles.tooltip} pointerEvents="none">
          <Text style={styles.tooltipText}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function Sidebar({
  sidebar,
  selectedId,
  onSelect,
  onNewChat,
  onFork,
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
                    <SidebarAction
                      label="Fork conversation"
                      glyph="⑂"
                      onPress={() => onFork(conv.id)}
                      disabled={busy}
                    />
                    <SidebarAction
                      label="Delete conversation"
                      glyph="×"
                      onPress={() => onDelete(conv.id)}
                      disabled={busy}
                    />
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
    height: "100%",
    overflow: "hidden",
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
    minHeight: 0,
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
  actionWrap: {
    position: "relative",
    marginRight: 2,
  },
  actionPress: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionPressHovered: {
    backgroundColor: "#3a3a3a",
  },
  actionText: {
    color: "#a3a3a3",
    fontSize: 14,
    lineHeight: 16,
  },
  tooltip: {
    position: "absolute",
    top: 32,
    right: 0,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#3a3a3a",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 20,
    whiteSpace: "nowrap",
  },
  tooltipText: {
    color: "#e5e5e5",
    fontSize: 11,
  },
});
