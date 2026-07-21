import { describe, expect, it } from "vitest";
import {
  projectTranscript,
  transcriptPrefixBeforeTurn,
} from "./project.js";

const sampleTranscript = [
  { role: "user", content: "first" },
  { role: "assistant", content: "reply1" },
  { type: "function_call", name: "bash", call_id: "c1", arguments: "{}" },
  {
    type: "function_call_output",
    call_id: "c1",
    output: "ok",
  },
  { role: "assistant", content: "after tool" },
  { role: "user", content: "second" },
  { role: "assistant", content: "reply2" },
];

describe("projectTranscript", () => {
  it("skips tool items and keeps user/assistant text", () => {
    expect(projectTranscript(sampleTranscript)).toEqual([
      { role: "user", text: "first" },
      { role: "assistant", text: "reply1" },
      { role: "assistant", text: "after tool" },
      { role: "user", text: "second" },
      { role: "assistant", text: "reply2" },
    ]);
  });
});

describe("transcriptPrefixBeforeTurn", () => {
  it("returns items before the targeted user turn, including tools before it", () => {
    const prefix = transcriptPrefixBeforeTurn(sampleTranscript, 3);
    expect(prefix).toEqual(sampleTranscript.slice(0, 5));
  });

  it("returns empty prefix when rewriting the first user turn", () => {
    expect(transcriptPrefixBeforeTurn(sampleTranscript, 0)).toEqual([]);
  });

  it("throws when the turn is not a user message", () => {
    expect(() => transcriptPrefixBeforeTurn(sampleTranscript, 1)).toThrow(
      /not a user message/,
    );
  });

  it("throws when the turn index is out of range", () => {
    expect(() => transcriptPrefixBeforeTurn(sampleTranscript, 99)).toThrow(
      /out of range/,
    );
  });
});
