import { describe, expect, it } from "vitest";
import { createMockApi } from "./mockApi.js";

describe("createMockApi getContextUsage", () => {
  it("returns usage buckets for a seeded conversation", async () => {
    const api = createMockApi();
    const usage = await api.getContextUsage("conv-agent-loop");
    expect(usage).not.toBeNull();
    expect(usage!.totalTokens).toBeGreaterThan(0);
    expect(usage!.budgetTokens).toBe(200_000);
    expect(usage!.fillRatio).toBeGreaterThanOrEqual(0);
    expect(usage!.fillRatio).toBeLessThanOrEqual(1);
    expect(usage!.buckets.some((b) => b.category === "conversation")).toBe(
      true,
    );
  });

  it("returns null for unknown conversation", async () => {
    const api = createMockApi();
    await expect(api.getContextUsage("missing")).resolves.toBeNull();
  });
});
