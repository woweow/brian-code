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
  sendMessage,
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
