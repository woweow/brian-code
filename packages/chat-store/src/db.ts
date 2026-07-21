import Database from "better-sqlite3";
import path from "node:path";

export type ChatDb = Database.Database;

const MIGRATIONS = `
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  folder_path TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  title TEXT,
  model_transcript TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS conversations_by_workspace
  ON conversations(workspace_id);

CREATE INDEX IF NOT EXISTS conversations_by_updated
  ON conversations(updated_at DESC);
`;

export function openDb(dbPath: string): ChatDb {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(MIGRATIONS);
  return db;
}

export function closeDb(db: ChatDb): void {
  db.close();
}

export function normalizeFolderPath(folderPath: string): string {
  return path.resolve(folderPath);
}
