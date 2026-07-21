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

function isSkippableType(type: string | undefined): boolean {
  return (
    type === "function_call" ||
    type === "function_call_output" ||
    type === "reasoning"
  );
}

function projectedTurnAt(
  raw: unknown,
): { role: "user" | "assistant"; text: string } | null {
  if (!isRecord(raw)) {
    return null;
  }
  if (isSkippableType(itemType(raw))) {
    return null;
  }
  const role = itemRole(raw);
  if (role !== "user" && role !== "assistant") {
    return null;
  }
  const text = textFromContent(raw.content).trim();
  if (text.length === 0) {
    return null;
  }
  return { role, text };
}

/**
 * Project a model transcript into UI turns.
 * v1: only user messages and assistant message text.
 * Ignores function_call, function_call_output, and reasoning items.
 */
export function projectTranscript(transcript: unknown[]): UiTurn[] {
  const turns: UiTurn[] = [];
  for (const raw of transcript) {
    const turn = projectedTurnAt(raw);
    if (turn) {
      turns.push(turn);
    }
  }
  return turns;
}

/**
 * Return the transcript slice before the UI turn at `turnIndex`.
 * Uses the same projection rules as `projectTranscript`.
 * Throws if the index is out of range or the turn is not a user message.
 */
export function transcriptPrefixBeforeTurn(
  transcript: unknown[],
  turnIndex: number,
): unknown[] {
  if (!Number.isInteger(turnIndex) || turnIndex < 0) {
    throw new Error(`Invalid turn index: ${turnIndex}`);
  }
  let projected = 0;
  for (let i = 0; i < transcript.length; i += 1) {
    const turn = projectedTurnAt(transcript[i]);
    if (!turn) {
      continue;
    }
    if (projected === turnIndex) {
      if (turn.role !== "user") {
        throw new Error(`Turn ${turnIndex} is not a user message`);
      }
      return transcript.slice(0, i);
    }
    projected += 1;
  }
  throw new Error(`Turn index out of range: ${turnIndex}`);
}
