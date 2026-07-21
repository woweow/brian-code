import { describe, expect, it } from "vitest";
import { applyOptimisticRewrite } from "./optimisticRewrite.js";

describe("applyOptimisticRewrite", () => {
  it("keeps turns above the index and replaces the user turn", () => {
    const next = applyOptimisticRewrite(
      {
        turns: [
          { role: "user", text: "a" },
          { role: "assistant", text: "b" },
          { role: "user", text: "c" },
          { role: "assistant", text: "d" },
        ],
      },
      2,
      "edited",
    );
    expect(next.turns).toEqual([
      { role: "user", text: "a" },
      { role: "assistant", text: "b" },
      { role: "user", text: "edited" },
    ]);
  });

  it("rewrites the first turn to a single user message", () => {
    const next = applyOptimisticRewrite(
      {
        turns: [
          { role: "user", text: "old" },
          { role: "assistant", text: "reply" },
        ],
      },
      0,
      "new",
    );
    expect(next.turns).toEqual([{ role: "user", text: "new" }]);
  });
});
