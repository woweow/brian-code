import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  closeDb,
  createConversationInFolder,
  getConversation,
  getConversationDetail,
  openDb,
  rewriteMessage,
  sendMessage,
  updateConversationTranscript,
  type ChatDb,
  type RunAgentFn,
} from "./index.js";

describe("sendMessage", () => {
  let dir: string;
  let folder: string;
  let db: ChatDb;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "chat-service-"));
    folder = path.join(dir, "workspace");
    mkdirSync(folder);
    db = openDb(path.join(dir, "test.sqlite"));
  });

  afterEach(() => {
    closeDb(db);
    rmSync(dir, { recursive: true, force: true });
  });

  it("persists transcript and title on success", async () => {
    const created = createConversationInFolder(db, folder);
    const runAgent = vi.fn<RunAgentFn>().mockResolvedValue({
      finalText: "Hi back",
      updatedTranscript: [
        { role: "user", content: "Hello world" },
        { role: "assistant", content: "Hi back" },
      ],
    });

    const detail = await sendMessage(db, created.id, "Hello world", runAgent);

    expect(runAgent).toHaveBeenCalledWith("Hello world", {
      transcript: [],
      workspaceRoot: path.resolve(folder),
    });
    expect(detail.title).toBe("Hello world");
    expect(detail.turns).toEqual([
      { role: "user", text: "Hello world" },
      { role: "assistant", text: "Hi back" },
    ]);
    const stored = getConversation(db, created.id);
    expect(stored?.transcript).toEqual([
      { role: "user", content: "Hello world" },
      { role: "assistant", content: "Hi back" },
    ]);
    expect(stored?.title).toBe("Hello world");
  });

  it("does not persist when runAgent throws", async () => {
    const created = createConversationInFolder(db, folder);
    const runAgent = vi
      .fn<RunAgentFn>()
      .mockRejectedValue(new Error("agent failed"));

    await expect(
      sendMessage(db, created.id, "do not save", runAgent),
    ).rejects.toThrow("agent failed");

    const stored = getConversation(db, created.id);
    expect(stored?.transcript).toEqual([]);
    expect(stored?.title).toBe("New chat");
  });

  it("throws without persisting when workspace folder is missing", async () => {
    const created = createConversationInFolder(db, folder);
    rmSync(folder, { recursive: true, force: true });
    const runAgent = vi.fn<RunAgentFn>();

    await expect(
      sendMessage(db, created.id, "hello", runAgent),
    ).rejects.toThrow(/does not exist on disk/);

    expect(runAgent).not.toHaveBeenCalled();
    expect(getConversation(db, created.id)?.transcript).toEqual([]);
  });

  it("getConversationDetail returns projected turns", () => {
    const created = createConversationInFolder(db, folder);
    const detail = getConversationDetail(db, created.id);
    expect(detail).toMatchObject({
      id: created.id,
      folderPath: path.resolve(folder),
      title: "New chat",
      turns: [],
    });
    expect(getConversationDetail(db, "missing")).toBeNull();
  });
});

describe("rewriteMessage", () => {
  let dir: string;
  let folder: string;
  let db: ChatDb;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "chat-rewrite-"));
    folder = path.join(dir, "workspace");
    mkdirSync(folder);
    db = openDb(path.join(dir, "test.sqlite"));
  });

  afterEach(() => {
    closeDb(db);
    rmSync(dir, { recursive: true, force: true });
  });

  it("truncates history above the turn and re-runs the agent", async () => {
    const created = createConversationInFolder(db, folder);
    const priorTranscript = [
      { role: "user", content: "first" },
      { role: "assistant", content: "reply1" },
      { type: "function_call", name: "bash", call_id: "c1", arguments: "{}" },
      { type: "function_call_output", call_id: "c1", output: "ok" },
      { role: "assistant", content: "after tool" },
      { role: "user", content: "second" },
      { role: "assistant", content: "reply2" },
    ];
    updateConversationTranscript(db, created.id, priorTranscript, {
      title: "first",
    });

    const nextTranscript = [
      { role: "user", content: "first" },
      { role: "assistant", content: "reply1" },
      { type: "function_call", name: "bash", call_id: "c1", arguments: "{}" },
      { type: "function_call_output", call_id: "c1", output: "ok" },
      { role: "assistant", content: "after tool" },
      { role: "user", content: "edited second" },
      { role: "assistant", content: "new reply" },
    ];
    const runAgent = vi.fn<RunAgentFn>().mockResolvedValue({
      finalText: "new reply",
      updatedTranscript: nextTranscript,
    });

    const detail = await rewriteMessage(
      db,
      created.id,
      3,
      "edited second",
      runAgent,
    );

    expect(runAgent).toHaveBeenCalledWith("edited second", {
      transcript: priorTranscript.slice(0, 5),
      workspaceRoot: path.resolve(folder),
    });
    expect(detail.title).toBe("first");
    expect(detail.turns).toEqual([
      { role: "user", text: "first" },
      { role: "assistant", text: "reply1" },
      { role: "assistant", text: "after tool" },
      { role: "user", text: "edited second" },
      { role: "assistant", text: "new reply" },
    ]);
    expect(getConversation(db, created.id)?.transcript).toEqual(nextTranscript);
  });

  it("retitles when rewriting the first message", async () => {
    const created = createConversationInFolder(db, folder);
    updateConversationTranscript(
      db,
      created.id,
      [
        { role: "user", content: "old first" },
        { role: "assistant", content: "old reply" },
      ],
      { title: "old first" },
    );
    const runAgent = vi.fn<RunAgentFn>().mockResolvedValue({
      finalText: "fresh",
      updatedTranscript: [
        { role: "user", content: "brand new opener" },
        { role: "assistant", content: "fresh" },
      ],
    });

    const detail = await rewriteMessage(
      db,
      created.id,
      0,
      "brand new opener",
      runAgent,
    );

    expect(runAgent).toHaveBeenCalledWith("brand new opener", {
      transcript: [],
      workspaceRoot: path.resolve(folder),
    });
    expect(detail.title).toBe("brand new opener");
  });

  it("does not persist when runAgent throws", async () => {
    const created = createConversationInFolder(db, folder);
    const prior = [
      { role: "user", content: "keep" },
      { role: "assistant", content: "me" },
      { role: "user", content: "rewrite me" },
      { role: "assistant", content: "gone" },
    ];
    updateConversationTranscript(db, created.id, prior, { title: "keep" });
    const runAgent = vi
      .fn<RunAgentFn>()
      .mockRejectedValue(new Error("agent failed"));

    await expect(
      rewriteMessage(db, created.id, 2, "new text", runAgent),
    ).rejects.toThrow("agent failed");

    expect(getConversation(db, created.id)?.transcript).toEqual(prior);
  });
});
