import { describe, expect, it } from "vitest";
import type OpenAI from "openai";
import { seedTranscript } from "./agent.js";

describe("seedTranscript", () => {
  it("defaults to empty and appends user prompt", () => {
    const result = seedTranscript("hello");
    expect(result).toEqual([{ role: "user", content: "hello" }]);
  });

  it("copies prior transcript without mutating caller array", () => {
    const prior: OpenAI.Responses.ResponseInputItem[] = [
      { role: "user", content: "hi" },
      { role: "assistant", content: "hey" },
    ];
    const result = seedTranscript("next", prior);
    expect(result).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "hey" },
      { role: "user", content: "next" },
    ]);
    expect(prior).toHaveLength(2);
    expect(result).not.toBe(prior);
  });
});
