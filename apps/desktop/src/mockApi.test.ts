import { describe, expect, it } from "vitest";
import { createMockApi } from "./mockApi.js";

describe("createMockApi", () => {
  it("groups sidebar conversations by folder and sorts by updatedAt", async () => {
    const api = createMockApi();
    const sidebar = await api.listSidebar();
    expect(sidebar.groups.length).toBeGreaterThanOrEqual(2);
    for (const group of sidebar.groups) {
      expect(group.folderPath.length).toBeGreaterThan(0);
      for (let i = 1; i < group.conversations.length; i += 1) {
        const prev = group.conversations[i - 1];
        const curr = group.conversations[i];
        expect(prev).toBeDefined();
        expect(curr).toBeDefined();
        expect(prev!.updatedAt).toBeGreaterThanOrEqual(curr!.updatedAt);
      }
    }
  });

  it("appends user and assistant turns on sendMessage", async () => {
    const api = createMockApi();
    const boot = await api.getBootstrap();
    const id = boot.lastConversationId;
    expect(id).toBeTruthy();
    const before = await api.getConversation(id!);
    expect(before).not.toBeNull();
    const turnCount = before!.turns.length;
    const updated = await api.sendMessage(id!, "hello from test");
    expect(updated.turns.length).toBe(turnCount + 2);
    expect(updated.turns.at(-2)?.role).toBe("user");
    expect(updated.turns.at(-1)?.role).toBe("assistant");
  });
});
