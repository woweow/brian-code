import { createElement, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native-web";
import type { ContextUsage } from "./types.js";

const RING_SIZE = 28;
const RING_STROKE = 3;

type ContextInspectorProps = {
  usage: ContextUsage | null;
};

function formatTokens(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens} tokens`;
  }
  const thousands = tokens / 1000;
  if (thousands >= 100) {
    return `${Math.round(thousands)}k tokens`;
  }
  const rounded = Math.round(thousands * 10) / 10;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1);
  return `${text}k tokens`;
}

function ContextRing({ fillRatio }: { fillRatio: number }) {
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, fillRatio));
  const dashOffset = circumference * (1 - clamped);
  const center = RING_SIZE / 2;

  return createElement(
    "svg",
    {
      width: RING_SIZE,
      height: RING_SIZE,
      viewBox: `0 0 ${RING_SIZE} ${RING_SIZE}`,
      "aria-hidden": true,
    },
    createElement("circle", {
      cx: center,
      cy: center,
      r: radius,
      fill: "none",
      stroke: "#2a2a2a",
      strokeWidth: RING_STROKE,
    }),
    createElement("circle", {
      cx: center,
      cy: center,
      r: radius,
      fill: "none",
      stroke: "#60a5fa",
      strokeWidth: RING_STROKE,
      strokeLinecap: "round",
      strokeDasharray: `${circumference} ${circumference}`,
      strokeDashoffset: dashOffset,
      transform: `rotate(-90 ${center} ${center})`,
    }),
  );
}

export function ContextInspector({ usage }: ContextInspectorProps) {
  const [open, setOpen] = useState(false);
  const fillRatio = usage?.fillRatio ?? 0;

  return (
    <View style={styles.wrap}>
      {open ? (
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
        />
      ) : null}
      {open && usage ? (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>Context</Text>
          <Text style={styles.overlayTotal}>
            {formatTokens(usage.totalTokens)} /{" "}
            {formatTokens(usage.budgetTokens)}
          </Text>
          {usage.buckets.length === 0 ? (
            <Text style={styles.empty}>No context yet</Text>
          ) : (
            usage.buckets.map((bucket) => (
              <View key={bucket.category} style={styles.row}>
                <Text style={styles.rowTokens}>
                  {formatTokens(bucket.tokens)}
                </Text>
                <Text style={styles.rowLabel}>{bucket.label}</Text>
              </View>
            ))
          )}
        </View>
      ) : null}
      <Pressable
        style={styles.button}
        onPress={() => setOpen((prev) => !prev)}
      >
        <ContextRing fillRatio={fillRatio} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: "#111",
    position: "relative",
    zIndex: 2,
  },
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  button: {
    width: RING_SIZE + 8,
    height: RING_SIZE + 8,
    borderRadius: (RING_SIZE + 8) / 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  overlay: {
    position: "absolute",
    right: 16,
    bottom: RING_SIZE + 20,
    minWidth: 200,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    gap: 6,
    zIndex: 3,
  },
  overlayTitle: {
    color: "#f5f5f5",
    fontSize: 13,
    fontWeight: "600",
  },
  overlayTotal: {
    color: "#a3a3a3",
    fontSize: 12,
    marginBottom: 4,
  },
  empty: {
    color: "#737373",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  rowTokens: {
    color: "#e5e5e5",
    fontSize: 12,
    fontWeight: "600",
    minWidth: 72,
  },
  rowLabel: {
    color: "#a3a3a3",
    fontSize: 12,
  },
});
