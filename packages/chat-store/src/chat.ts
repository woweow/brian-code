import { randomUUID } from "node:crypto";
import type { ChatDb } from "./db.js";
import { normalizeFolderPath } from "./db.js";

export type Workspace = {
  id: string;
  folderPath: string;
  createdAt: number;
};

export type Conversation = {
  id: string;
  workspaceId: string;
  title: string | null;
  transcript: unknown[];
  createdAt: number;
  updatedAt: number;
};

export type SidebarConversation = {
  id: string;
  workspaceId: string;
  folderPath: string;
  title: string | null;
  createdAt: number;
  updatedAt: number;
};

export function findOrCreateWorkspace(
  db: ChatDb,
  folderPath: string,
): Workspace {
  const normalized = normalizeFolderPath(folderPath);
  const existing = db
    .prepare(
      `SELECT id, folder_path AS folderPath, created_at AS createdAt
       FROM workspaces WHERE folder_path = ?`,
    )
    .get(normalized) as Workspace | undefined;
  if (existing) {
    return existing;
  }
  const id = randomUUID();
  const createdAt = Date.now();
  db.prepare(
    `INSERT INTO workspaces (id, folder_path, created_at) VALUES (?, ?, ?)`,
  ).run(id, normalized, createdAt);
  return { id, folderPath: normalized, createdAt };
}

export function createConversation(
  db: ChatDb,
  workspaceId: string,
): Conversation {
  const workspace = db
    .prepare(`SELECT id FROM workspaces WHERE id = ?`)
    .get(workspaceId) as { id: string } | undefined;
  if (!workspace) {
    throw new Error(`Workspace not found: ${workspaceId}`);
  }
  const id = randomUUID();
  const now = Date.now();
  const title = "New chat";
  const transcript: unknown[] = [];
  db.prepare(
    `INSERT INTO conversations
      (id, workspace_id, title, model_transcript, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, workspaceId, title, JSON.stringify(transcript), now, now);
  return {
    id,
    workspaceId,
    title,
    transcript,
    createdAt: now,
    updatedAt: now,
  };
}

export function listConversationsForSidebar(
  db: ChatDb,
): SidebarConversation[] {
  return db
    .prepare(
      `SELECT
        c.id AS id,
        c.workspace_id AS workspaceId,
        w.folder_path AS folderPath,
        c.title AS title,
        c.created_at AS createdAt,
        c.updated_at AS updatedAt
       FROM conversations c
       JOIN workspaces w ON w.id = c.workspace_id
       ORDER BY c.updated_at DESC`,
    )
    .all() as SidebarConversation[];
}

export function getConversation(
  db: ChatDb,
  id: string,
): Conversation | null {
  const row = db
    .prepare(
      `SELECT
        id,
        workspace_id AS workspaceId,
        title,
        model_transcript AS modelTranscript,
        created_at AS createdAt,
        updated_at AS updatedAt
       FROM conversations WHERE id = ?`,
    )
    .get(id) as
    | {
        id: string;
        workspaceId: string;
        title: string | null;
        modelTranscript: string;
        createdAt: number;
        updatedAt: number;
      }
    | undefined;
  if (!row) {
    return null;
  }
  let transcript: unknown[];
  try {
    const parsed: unknown = JSON.parse(row.modelTranscript);
    transcript = Array.isArray(parsed) ? parsed : [];
  } catch {
    transcript = [];
  }
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    title: row.title,
    transcript,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function updateConversationTranscript(
  db: ChatDb,
  id: string,
  transcript: unknown[],
  opts?: { title?: string },
): Conversation {
  const existing = getConversation(db, id);
  if (!existing) {
    throw new Error(`Conversation not found: ${id}`);
  }
  const updatedAt = Date.now();
  const title = opts?.title ?? existing.title;
  db.prepare(
    `UPDATE conversations
     SET model_transcript = ?, title = ?, updated_at = ?
     WHERE id = ?`,
  ).run(JSON.stringify(transcript), title, updatedAt, id);
  return {
    ...existing,
    title,
    transcript,
    updatedAt,
  };
}

export function deleteConversation(db: ChatDb, id: string): void {
  const row = db
    .prepare(`SELECT workspace_id AS workspaceId FROM conversations WHERE id = ?`)
    .get(id) as { workspaceId: string } | undefined;
  if (!row) {
    return;
  }
  db.prepare(`DELETE FROM conversations WHERE id = ?`).run(id);
  const remaining = db
    .prepare(
      `SELECT COUNT(*) AS count FROM conversations WHERE workspace_id = ?`,
    )
    .get(row.workspaceId) as { count: number };
  if (remaining.count === 0) {
    db.prepare(`DELETE FROM workspaces WHERE id = ?`).run(row.workspaceId);
  }
}

export function getMeta(db: ChatDb, key: string): string | null {
  const row = db
    .prepare(`SELECT value FROM app_meta WHERE key = ?`)
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setMeta(db: ChatDb, key: string, value: string): void {
  db.prepare(
    `INSERT INTO app_meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(key, value);
}
