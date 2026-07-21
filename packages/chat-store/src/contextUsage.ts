/** Soft UI budget for the context ring (not a hard API limit). */
export const CONTEXT_TOKEN_BUDGET = 200_000;

export type ContextCategory = "conversation" | "toolCalls" | "other";

export type ContextUsageBucket = {
  category: ContextCategory;
  label: string;
  tokens: number;
};

export type ContextUsage = {
  totalTokens: number;
  budgetTokens: number;
  /** 0..1, capped at 1 when over budget. */
  fillRatio: number;
  buckets: ContextUsageBucket[];
};

const CATEGORY_LABELS: Record<ContextCategory, string> = {
  conversation: "Conversation",
  toolCalls: "Tool calls",
  other: "Other",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Rough GPT-style token estimate (~4 chars/token).
 * Good enough for a fill gauge; not billed usage.
 */
export function estimateTokens(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  return Math.ceil(trimmed.length / 4);
}

function itemCategory(item: Record<string, unknown>): ContextCategory {
  const type = typeof item.type === "string" ? item.type : undefined;
  if (type === "function_call" || type === "function_call_output") {
    return "toolCalls";
  }
  if (type === "reasoning") {
    return "other";
  }
  const role = typeof item.role === "string" ? item.role : undefined;
  if (role === "user" || role === "assistant" || type === "message") {
    return "conversation";
  }
  if (type === undefined && role === undefined) {
    return "other";
  }
  return "other";
}

function emptyBuckets(): Record<ContextCategory, number> {
  return {
    conversation: 0,
    toolCalls: 0,
    other: 0,
  };
}

/**
 * Inspect a model transcript and estimate how context is spent.
 * Each item is counted as its full JSON serialization (every character).
 */
export function inspectContextUsage(
  transcript: unknown[],
  budgetTokens = CONTEXT_TOKEN_BUDGET,
): ContextUsage {
  const counts = emptyBuckets();
  for (const raw of transcript) {
    if (!isRecord(raw)) {
      continue;
    }
    const category = itemCategory(raw);
    counts[category] += estimateTokens(JSON.stringify(raw));
  }
  const order: ContextCategory[] = ["conversation", "toolCalls", "other"];
  const buckets: ContextUsageBucket[] = order
    .filter((category) => counts[category] > 0)
    .map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      tokens: counts[category],
    }));
  const totalTokens = buckets.reduce((sum, b) => sum + b.tokens, 0);
  const fillRatio =
    budgetTokens <= 0 ? 0 : Math.min(1, totalTokens / budgetTokens);
  return {
    totalTokens,
    budgetTokens,
    fillRatio,
    buckets,
  };
}

export function formatTokenCount(tokens: number): string {
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
