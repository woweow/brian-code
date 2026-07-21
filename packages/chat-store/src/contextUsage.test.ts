import { describe, expect, it } from "vitest";
import {
  CONTEXT_TOKEN_BUDGET,
  estimateTokens,
  formatTokenCount,
  inspectContextUsage,
} from "./contextUsage.js";

describe("estimateTokens", () => {
  it("returns 0 for empty text", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("   ")).toBe(0);
  });

  it("estimates ~4 chars per token", () => {
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("abcdefgh")).toBe(2);
  });
});

describe("inspectContextUsage", () => {
  it("returns empty usage for empty transcript", () => {
    const usage = inspectContextUsage([]);
    expect(usage.totalTokens).toBe(0);
    expect(usage.fillRatio).toBe(0);
    expect(usage.budgetTokens).toBe(CONTEXT_TOKEN_BUDGET);
    expect(usage.buckets).toEqual([]);
  });

  it("counts full JSON blobs including tool-call metadata", () => {
    const user = { role: "user", content: "Tell me a joke about dogs and cats" };
    const assistant = {
      id: "msg_1",
      type: "message",
      status: "completed",
      content: [{ type: "output_text", annotations: [], text: "A joke" }],
      phase: "final_answer",
      role: "assistant",
    };
    const functionCall = {
      id: "fc_03e6c55266818a88006a5fcf4eaa588199b9f21be2e45d839f",
      type: "function_call",
      status: "completed",
      arguments: "{}",
      call_id: "call_4EYUxDUdgc6enpM7x34GTt5z",
      name: "get_first_name",
    };
    const functionOutput = {
      type: "function_call_output",
      call_id: "call_4EYUxDUdgc6enpM7x34GTt5z",
      output: '{"firstName":"Alex"}',
    };
    const usage = inspectContextUsage([
      user,
      assistant,
      functionCall,
      functionOutput,
    ]);
    const conversation = usage.buckets.find((b) => b.category === "conversation");
    const toolCalls = usage.buckets.find((b) => b.category === "toolCalls");
    expect(conversation?.tokens).toBe(
      estimateTokens(JSON.stringify(user)) +
        estimateTokens(JSON.stringify(assistant)),
    );
    expect(toolCalls?.tokens).toBe(
      estimateTokens(JSON.stringify(functionCall)) +
        estimateTokens(JSON.stringify(functionOutput)),
    );
    expect(toolCalls!.tokens).toBeGreaterThan(
      estimateTokens("get_first_name\n{}") +
        estimateTokens('{"firstName":"Alex"}'),
    );
    expect(usage.totalTokens).toBe(
      (conversation?.tokens ?? 0) + (toolCalls?.tokens ?? 0),
    );
  });

  it("caps fill ratio at 1 when over budget", () => {
    const huge = "x".repeat(20_000);
    const usage = inspectContextUsage([{ role: "user", content: huge }], 100);
    expect(usage.totalTokens).toBeGreaterThan(100);
    expect(usage.fillRatio).toBe(1);
  });
});

describe("formatTokenCount", () => {
  it("formats small and large counts", () => {
    expect(formatTokenCount(42)).toBe("42 tokens");
    expect(formatTokenCount(1000)).toBe("1k tokens");
    expect(formatTokenCount(10500)).toBe("10.5k tokens");
    expect(formatTokenCount(200000)).toBe("200k tokens");
  });
});
