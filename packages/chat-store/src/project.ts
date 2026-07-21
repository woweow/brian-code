export type UiTurn = {
  role: "user" | "assistant";
  text: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function textFromContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }
  const parts: string[] = [];
  for (const part of content) {
    if (!isRecord(part)) {
      continue;
    }
    if (typeof part.text === "string") {
      parts.push(part.text);
      continue;
    }
    if (typeof part.output_text === "string") {
      parts.push(part.output_text);
    }
  }
  return parts.join("");
}

function itemType(item: Record<string, unknown>): string | undefined {
  return typeof item.type === "string" ? item.type : undefined;
}

function itemRole(item: Record<string, unknown>): string | undefined {
  return typeof item.role === "string" ? item.role : undefined;
}

/**
 * Project a model transcript into UI turns.
 * v1: only user messages and assistant message text.
 * Ignores function_call, function_call_output, and reasoning items.
 */
export function projectTranscript(transcript: unknown[]): UiTurn[] {
  const turns: UiTurn[] = [];
  for (const raw of transcript) {
    if (!isRecord(raw)) {
      continue;
    }
    const type = itemType(raw);
    if (
      type === "function_call" ||
      type === "function_call_output" ||
      type === "reasoning"
    ) {
      continue;
    }
    const role = itemRole(raw);
    if (role !== "user" && role !== "assistant") {
      continue;
    }
    const text = textFromContent(raw.content).trim();
    if (text.length === 0) {
      continue;
    }
    turns.push({ role, text });
  }
  return turns;
}
