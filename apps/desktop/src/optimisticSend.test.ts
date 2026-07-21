import { describe, expect, it } from "vitest";
import {
  appendOptimisticUserTurn,
  rollbackOptimisticUserTurn,
} from "./optimisticSend.js";

describe("appendOptimisticUserTurn", () => {
  it("appends a user turn immediately", () => {
    const next = appendOptimisticUserTurn(
      { turns: [{ role: "assistant", text: "hi" }] },
      "hello",
    );
    expect(next.turns).toEqual([
      { role: "assistant", text: "hi" },
      { role: "user", text: "hello" },
    ]);
  });
});

describe("rollbackOptimisticUserTurn", () => {
  it("removes the matching trailing user turn", () => {
    const next = rollbackOptimisticUserTurn(
      {
        turns: [
          { role: "assistant", text: "hi" },
          { role: "user", text: "hello" },
        ],
      },
      "hello",
    );
    expect(next.turns).toEqual([{ role: "assistant", text: "hi" }]);
  });

  it("leaves turns unchanged when the last turn does not match", () => {
    const prev = { turns: [{ role: "user", text: "other" }] };
    expect(rollbackOptimisticUserTurn(prev, "hello")).toEqual(prev);
  });
});
