import { describe, expect, it } from "vitest";
import { isSendEnterKey, shouldShowComposer } from "./composerKeys.js";

describe("isSendEnterKey", () => {
  it("sends on Enter without Shift", () => {
    expect(isSendEnterKey("Enter", false)).toBe(true);
  });

  it("does not send on Shift+Enter", () => {
    expect(isSendEnterKey("Enter", true)).toBe(false);
  });

  it("ignores other keys", () => {
    expect(isSendEnterKey("a", false)).toBe(false);
  });
});

describe("shouldShowComposer", () => {
  it("hides when no conversation is selected", () => {
    expect(shouldShowComposer(null)).toBe(false);
  });

  it("shows when a conversation is selected", () => {
    expect(shouldShowComposer("conv-1")).toBe(true);
  });
});
