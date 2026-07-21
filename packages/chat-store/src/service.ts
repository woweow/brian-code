import { existsSync } from "node:fs";
import type { ChatDb } from "./db.js";
import {
  createConversation,
  deleteConversation,
  findOrCreateWorkspace,
  forkConversation,
  getConversation,
  getMeta,
  listConversationsForSidebar,
  setMeta,
  updateConversationTranscript,
  type Conversation,
  type Workspace,
} from "./chat.js";
import {
  inspectContextUsage,
  type ContextUsage,
} from "./contextUsage.js";
import {
  projectTranscript,
  transcriptPrefixBeforeTurn,
  type UiTurn,
} from "./project.js";

export const LAST_CONVERSATION_ID_KEY = "last_conversation_id";

export type SidebarGroupConversation = {
  id: string;
  title: string;
  updatedAt: number;
};

export type SidebarWorkspaceGroup = {
  workspaceId: string;
  folderPath: string;
  conversations: SidebarGroupConversation[];
};

export type SidebarPayload = {
  groups: SidebarWorkspaceGroup[];
};

export type ConversationDetail = {
  id: string;
  workspaceId: string;
  folderPath: string;
  title: string;
  turns: UiTurn[];
  updatedAt: number;
};

export type BootstrapPayload = {
  lastConversationId: string | null;
  sidebar: SidebarPayload;
};

export type RunAgentFn = (
  prompt: string,
  options?: { transcript?: unknown[]; workspaceRoot?: string },
) => Promise<{ finalText: string; updatedTranscript: unknown[] }>;

function getWorkspace(db: ChatDb, id: string): Workspace | null {
  const row = db
    .prepare(
      `SELECT id, folder_path AS folderPath, created_at AS createdAt
       FROM workspaces WHERE id = ?`,
    )
    .get(id) as Workspace | undefined;
  return row ?? null;
}

function displayTitle(title: string | null): string {
  return title ?? "New chat";
}

function toDetail(
  conversation: Conversation,
  folderPath: string,
): ConversationDetail {
  return {
    id: conversation.id,
    workspaceId: conversation.workspaceId,
    folderPath,
    title: displayTitle(conversation.title),
    turns: projectTranscript(conversation.transcript),
    updatedAt: conversation.updatedAt,
  };
}

export function truncateTitle(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 48) {
    return trimmed;
  }
  return `${trimmed.slice(0, 45)}…`;
}

export function buildSidebarPayload(db: ChatDb): SidebarPayload {
  const rows = listConversationsForSidebar(db);
  const byWorkspace = new Map<string, SidebarWorkspaceGroup>();
  for (const row of rows) {
    let group = byWorkspace.get(row.workspaceId);
    if (!group) {
      group = {
        workspaceId: row.workspaceId,
        folderPath: row.folderPath,
        conversations: [],
      };
      byWorkspace.set(row.workspaceId, group);
    }
    group.conversations.push({
      id: row.id,
      title: displayTitle(row.title),
      updatedAt: row.updatedAt,
    });
  }
  const groups = [...byWorkspace.values()].sort((a, b) => {
    const aMax = a.conversations[0]?.updatedAt ?? 0;
    const bMax = b.conversations[0]?.updatedAt ?? 0;
    return bMax - aMax;
  });
  return { groups };
}

export function createConversationInFolder(
  db: ChatDb,
  folderPath: string,
): ConversationDetail {
  const workspace = findOrCreateWorkspace(db, folderPath);
  const conversation = createConversation(db, workspace.id);
  setMeta(db, LAST_CONVERSATION_ID_KEY, conversation.id);
  return toDetail(conversation, workspace.folderPath);
}

export function getConversationDetail(
  db: ChatDb,
  id: string,
  opts?: { setLast?: boolean },
): ConversationDetail | null {
  const conversation = getConversation(db, id);
  if (!conversation) {
    return null;
  }
  const workspace = getWorkspace(db, conversation.workspaceId);
  if (!workspace) {
    return null;
  }
  if (opts?.setLast !== false) {
    setMeta(db, LAST_CONVERSATION_ID_KEY, conversation.id);
  }
  return toDetail(conversation, workspace.folderPath);
}

export async function sendMessage(
  db: ChatDb,
  conversationId: string,
  text: string,
  runAgent: RunAgentFn,
): Promise<ConversationDetail> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty");
  }
  const conversation = getConversation(db, conversationId);
  if (!conversation) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }
  const workspace = getWorkspace(db, conversation.workspaceId);
  if (!workspace) {
    throw new Error(`Workspace not found for conversation: ${conversationId}`);
  }
  if (!existsSync(workspace.folderPath)) {
    throw new Error(
      `Workspace folder does not exist on disk: ${workspace.folderPath}`,
    );
  }
  const hadEmptyTurns = conversation.transcript.length === 0;
  const shouldRetitle =
    hadEmptyTurns || conversation.title === "New chat" || !conversation.title;
  const result = await runAgent(trimmed, {
    transcript: conversation.transcript,
    workspaceRoot: workspace.folderPath,
  });
  const title = shouldRetitle ? truncateTitle(trimmed) : undefined;
  const updated = updateConversationTranscript(
    db,
    conversationId,
    result.updatedTranscript,
    title !== undefined ? { title } : undefined,
  );
  setMeta(db, LAST_CONVERSATION_ID_KEY, conversationId);
  return toDetail(updated, workspace.folderPath);
}

export function forkConversationDetail(
  db: ChatDb,
  sourceId: string,
): ConversationDetail {
  const conversation = forkConversation(db, sourceId);
  const workspace = getWorkspace(db, conversation.workspaceId);
  if (!workspace) {
    throw new Error(
      `Workspace not found for conversation: ${conversation.id}`,
    );
  }
  setMeta(db, LAST_CONVERSATION_ID_KEY, conversation.id);
  return toDetail(conversation, workspace.folderPath);
}

/**
 * Truncate history to everything above the UI turn at `turnIndex`, then
 * treat `text` as a brand-new user message (re-run agent). Persist only
 * on success. Retitle when rewriting the first message (empty prefix).
 */
export async function rewriteMessage(
  db: ChatDb,
  conversationId: string,
  turnIndex: number,
  text: string,
  runAgent: RunAgentFn,
): Promise<ConversationDetail> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty");
  }
  const conversation = getConversation(db, conversationId);
  if (!conversation) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }
  const workspace = getWorkspace(db, conversation.workspaceId);
  if (!workspace) {
    throw new Error(`Workspace not found for conversation: ${conversationId}`);
  }
  if (!existsSync(workspace.folderPath)) {
    throw new Error(
      `Workspace folder does not exist on disk: ${workspace.folderPath}`,
    );
  }
  const prefix = transcriptPrefixBeforeTurn(
    conversation.transcript,
    turnIndex,
  );
  const result = await runAgent(trimmed, {
    transcript: prefix,
    workspaceRoot: workspace.folderPath,
  });
  const title =
    prefix.length === 0 ? truncateTitle(trimmed) : undefined;
  const updated = updateConversationTranscript(
    db,
    conversationId,
    result.updatedTranscript,
    title !== undefined ? { title } : undefined,
  );
  setMeta(db, LAST_CONVERSATION_ID_KEY, conversationId);
  return toDetail(updated, workspace.folderPath);
}

export function deleteConversationAndMaybeWorkspace(
  db: ChatDb,
  id: string,
): void {
  const lastId = getMeta(db, LAST_CONVERSATION_ID_KEY);
  deleteConversation(db, id);
  if (lastId !== id) {
    return;
  }
  const next = listConversationsForSidebar(db)[0]?.id ?? null;
  if (next) {
    setMeta(db, LAST_CONVERSATION_ID_KEY, next);
    return;
  }
  db.prepare(`DELETE FROM app_meta WHERE key = ?`).run(LAST_CONVERSATION_ID_KEY);
}

export function getBootstrap(db: ChatDb): BootstrapPayload {
  return {
    lastConversationId: getMeta(db, LAST_CONVERSATION_ID_KEY),
    sidebar: buildSidebarPayload(db),
  };
}

/** On-demand token estimate from the stored model transcript. */
export function getContextUsage(
  db: ChatDb,
  id: string,
): ContextUsage | null {
  const conversation = getConversation(db, id);
  if (!conversation) {
    return null;
  }
  return inspectContextUsage(conversation.transcript);
}
