import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  closeDb,
  createConversation,
  deleteConversation,
  findOrCreateWorkspace,
  getConversation,
  getMeta,
  listConversationsForSidebar,
  openDb,
  projectTranscript,
  setMeta,
  updateConversationTranscript,
  type ChatDb,
} from "./index.js";

describe("chat-store", () => {
  let dir: string;
  let dbPath: string;
  let db: ChatDb;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "chat-store-"));
    dbPath = path.join(dir, "test.sqlite");
    db = openDb(dbPath);
  });

  afterEach(() => {
    closeDb(db);
    rmSync(dir, { recursive: true, force: true });
  });

  it("findOrCreateWorkspace returns same id for same path", () => {
    const folder = path.join(dir, "project");
    const a = findOrCreateWorkspace(db, folder);
    const b = findOrCreateWorkspace(db, folder);
    const viaRelative = findOrCreateWorkspace(
      db,
      path.relative(process.cwd(), folder) || folder,
    );
    expect(a.id).toBe(b.id);
    expect(a.id).toBe(viaRelative.id);
    expect(a.folderPath).toBe(path.resolve(folder));
  });

  it("creates conversation and lists sidebar sorted by updated_at", () => {
    const ws = findOrCreateWorkspace(db, path.join(dir, "app"));
    const first = createConversation(db, ws.id);
    const second = createConversation(db, ws.id);
    expect(first.title).toBe("New chat");
    expect(first.transcript).toEqual([]);

    updateConversationTranscript(db, first.id, [
      { role: "user", content: "hello" },
    ]);

    const sidebar = listConversationsForSidebar(db);
    expect(sidebar).toHaveLength(2);
    expect(sidebar[0]?.id).toBe(first.id);
    expect(sidebar[1]?.id).toBe(second.id);
    expect(sidebar[0]?.folderPath).toBe(ws.folderPath);

    const loaded = getConversation(db, first.id);
    expect(loaded?.transcript).toEqual([{ role: "user", content: "hello" }]);
  });

  it("deletes workspace when last conversation is removed", () => {
    const ws = findOrCreateWorkspace(db, path.join(dir, "gone"));
    const convo = createConversation(db, ws.id);
    deleteConversation(db, convo.id);
    const leftover = db
      .prepare(`SELECT COUNT(*) AS count FROM workspaces WHERE id = ?`)
      .get(ws.id) as { count: number };
    expect(leftover.count).toBe(0);
    expect(getConversation(db, convo.id)).toBeNull();
  });

  it("keeps workspace when other conversations remain", () => {
    const ws = findOrCreateWorkspace(db, path.join(dir, "keep"));
    const a = createConversation(db, ws.id);
    const b = createConversation(db, ws.id);
    deleteConversation(db, a.id);
    const leftover = db
      .prepare(`SELECT COUNT(*) AS count FROM workspaces WHERE id = ?`)
      .get(ws.id) as { count: number };
    expect(leftover.count).toBe(1);
    expect(getConversation(db, b.id)?.id).toBe(b.id);
  });

  it("updates title via updateConversationTranscript", () => {
    const ws = findOrCreateWorkspace(db, path.join(dir, "titled"));
    const convo = createConversation(db, ws.id);
    const updated = updateConversationTranscript(
      db,
      convo.id,
      [{ role: "user", content: "rename me" }],
      { title: "Renamed chat" },
    );
    expect(updated.title).toBe("Renamed chat");
    expect(getConversation(db, convo.id)?.title).toBe("Renamed chat");
  });

  it("getMeta and setMeta round-trip last_conversation_id", () => {
    expect(getMeta(db, "last_conversation_id")).toBeNull();
    setMeta(db, "last_conversation_id", "abc-123");
    expect(getMeta(db, "last_conversation_id")).toBe("abc-123");
    setMeta(db, "last_conversation_id", "xyz-9");
    expect(getMeta(db, "last_conversation_id")).toBe("xyz-9");
  });
});

describe("projectTranscript", () => {
  it("keeps user and assistant turns; ignores tools and reasoning", () => {
    const turns = projectTranscript([
      { role: "user", content: "Create a person" },
      {
        type: "function_call",
        name: "get_first_name",
        call_id: "c1",
        arguments: "{}",
      },
      {
        type: "function_call_output",
        call_id: "c1",
        output: '{"firstName":"Alex"}',
      },
      {
        type: "reasoning",
        summary: [{ text: "thinking..." }],
      },
      {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: "Meet Alex." }],
      },
    ]);
    expect(turns).toEqual([
      { role: "user", text: "Create a person" },
      { role: "assistant", text: "Meet Alex." },
    ]);
  });

  it("handles string content and content parts", () => {
    const turns = projectTranscript([
      {
        role: "user",
        content: [{ type: "input_text", text: "Hi" }],
      },
      { role: "assistant", content: "Hello there" },
    ]);
    expect(turns).toEqual([
      { role: "user", text: "Hi" },
      { role: "assistant", text: "Hello there" },
    ]);
  });
});
