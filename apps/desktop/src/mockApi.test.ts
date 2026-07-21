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

  it("bootstraps the last conversation id", async () => {
    const api = createMockApi();
    const boot = await api.getBootstrap();
    expect(boot.lastConversationId).toBe("conv-agent-loop");
    expect(boot.sidebar.groups.length).toBeGreaterThan(0);
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

  it("rewrites a user turn and drops later turns", async () => {
    const api = createMockApi();
    const before = await api.getConversation("conv-agent-loop");
    expect(before).not.toBeNull();
    expect(before!.turns.length).toBeGreaterThanOrEqual(4);
    const updated = await api.rewriteMessage(
      "conv-agent-loop",
      0,
      "edited opener",
    );
    expect(updated.turns).toEqual([
      { role: "user", text: "edited opener" },
      { role: "assistant", text: "Mock reply to: edited opener" },
    ]);
    expect(updated.title).toBe("edited opener");
  });

  it("titles an empty conversation from the first send", async () => {
    const api = createMockApi();
    const empty = await api.getConversation("conv-empty");
    expect(empty).not.toBeNull();
    expect(empty!.title).toBe("New chat");
    const updated = await api.sendMessage("conv-empty", "First sidebar title");
    expect(updated.title).toBe("First sidebar title");
    const sidebar = await api.listSidebar();
    const titles = sidebar.groups.flatMap((g) =>
      g.conversations.map((c) => c.title),
    );
    expect(titles).toContain("First sidebar title");
  });

  it("deletes a conversation and advances lastConversationId", async () => {
    const api = createMockApi();
    const before = await api.getBootstrap();
    expect(before.lastConversationId).toBe("conv-agent-loop");
    await api.deleteConversation("conv-agent-loop");
    const after = await api.getBootstrap();
    expect(after.lastConversationId).not.toBe("conv-agent-loop");
    expect(after.lastConversationId).toBeTruthy();
    const gone = await api.getConversation("conv-agent-loop");
    expect(gone).toBeNull();
  });

  it("forks a conversation into a new sidebar entry", async () => {
    const api = createMockApi();
    const source = await api.getConversation("conv-agent-loop");
    expect(source).not.toBeNull();
    const forked = await api.forkConversation("conv-agent-loop");
    expect(forked.id).not.toBe("conv-agent-loop");
    expect(forked.title).toBe("Agent loop design (copy)");
    expect(forked.turns).toEqual(source!.turns);
    expect(forked.workspaceId).toBe(source!.workspaceId);
    const sidebar = await api.listSidebar();
    const ids = sidebar.groups.flatMap((g) =>
      g.conversations.map((c) => c.id),
    );
    expect(ids).toContain("conv-agent-loop");
    expect(ids).toContain(forked.id);
    const boot = await api.getBootstrap();
    expect(boot.lastConversationId).toBe(forked.id);
  });
});
