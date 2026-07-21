import type {
  BootstrapPayload,
  ConversationDetail,
  DesktopApi,
  SidebarPayload,
  UiTurn,
} from "./types.js";

type MockConversation = {
  id: string;
  workspaceId: string;
  title: string;
  turns: UiTurn[];
  updatedAt: number;
};

type MockWorkspace = {
  id: string;
  folderPath: string;
};

function seedFixtures(now: number): {
  workspaces: MockWorkspace[];
  conversations: MockConversation[];
  lastConversationId: string;
} {
  return {
    workspaces: [
      { id: "ws-brian", folderPath: "/Users/brian/coding/brian-code" },
      { id: "ws-notes", folderPath: "/Users/brian/Documents/notes" },
    ],
    conversations: [
      {
        id: "conv-agent-loop",
        workspaceId: "ws-brian",
        title: "Agent loop design",
        updatedAt: now - 1000 * 60 * 5,
        turns: [
          {
            role: "user",
            text: "How should we structure the agent tool loop?",
          },
          {
            role: "assistant",
            text: "Keep a single transcript blob, append tool calls in place, and project user + final assistant text for the UI.",
          },
          {
            role: "user",
            text: "Should the renderer see the raw OpenAI items?",
          },
          {
            role: "assistant",
            text: "No — projectTranscript should emit UiTurn[] so the shell stays simple.",
          },
        ],
      },
      {
        id: "conv-sqlite",
        workspaceId: "ws-brian",
        title: "SQLite workspace store",
        updatedAt: now - 1000 * 60 * 60 * 2,
        turns: [
          {
            role: "user",
            text: "Where should conversation state live?",
          },
          {
            role: "assistant",
            text: "In a local SQLite file under Electron userData, with workspaces keyed by folder path.",
          },
        ],
      },
      {
        id: "conv-empty",
        workspaceId: "ws-notes",
        title: "New chat",
        updatedAt: now - 1000 * 60 * 60 * 24,
        turns: [],
      },
      {
        id: "conv-journal",
        workspaceId: "ws-notes",
        title: "Weekly journal outline",
        updatedAt: now - 1000 * 60 * 30,
        turns: [
          {
            role: "user",
            text: "Draft a short weekly journal outline.",
          },
          {
            role: "assistant",
            text: "1) Wins\n2) Friction\n3) Next week focus\n4) One gratitude note",
          },
        ],
      },
    ],
    lastConversationId: "conv-agent-loop",
  };
}

function delay(ms = 80): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function truncateTitle(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 48) {
    return trimmed;
  }
  return `${trimmed.slice(0, 45)}…`;
}

export function createMockApi(): DesktopApi {
  const seed = seedFixtures(Date.now());
  const workspaces = seed.workspaces;
  const conversations = seed.conversations;
  let lastConversationId: string | null = seed.lastConversationId;
  let folderCounter = 0;

  function buildSidebar(): SidebarPayload {
    const groups = workspaces
      .map((ws) => {
        const convs = conversations
          .filter((c) => c.workspaceId === ws.id)
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .map((c) => ({
            id: c.id,
            title: c.title,
            updatedAt: c.updatedAt,
          }));
        return {
          workspaceId: ws.id,
          folderPath: ws.folderPath,
          conversations: convs,
        };
      })
      .filter((g) => g.conversations.length > 0)
      .sort((a, b) => {
        const aMax = a.conversations[0]?.updatedAt ?? 0;
        const bMax = b.conversations[0]?.updatedAt ?? 0;
        return bMax - aMax;
      });
    return { groups };
  }

  function toDetail(conv: MockConversation): ConversationDetail {
    const ws = workspaces.find((w) => w.id === conv.workspaceId);
    if (!ws) {
      throw new Error(`Workspace missing for conversation ${conv.id}`);
    }
    return {
      id: conv.id,
      workspaceId: conv.workspaceId,
      folderPath: ws.folderPath,
      title: conv.title,
      turns: [...conv.turns],
      updatedAt: conv.updatedAt,
    };
  }

  function findOrCreateWorkspace(folderPath: string): MockWorkspace {
    const existing = workspaces.find((w) => w.folderPath === folderPath);
    if (existing) {
      return existing;
    }
    const ws: MockWorkspace = {
      id: `ws-${crypto.randomUUID()}`,
      folderPath,
    };
    workspaces.push(ws);
    return ws;
  }

  return {
    async pickFolder(): Promise<string | null> {
      await delay();
      folderCounter += 1;
      return `/Users/brian/mock-workspace-${folderCounter}`;
    },

    async listSidebar(): Promise<SidebarPayload> {
      await delay();
      return buildSidebar();
    },

    async getBootstrap(): Promise<BootstrapPayload> {
      await delay();
      return {
        lastConversationId,
        sidebar: buildSidebar(),
      };
    },

    async createConversation(folderPath: string): Promise<ConversationDetail> {
      await delay();
      const ws = findOrCreateWorkspace(folderPath);
      const conv: MockConversation = {
        id: `conv-${crypto.randomUUID()}`,
        workspaceId: ws.id,
        title: "New chat",
        turns: [],
        updatedAt: Date.now(),
      };
      conversations.unshift(conv);
      lastConversationId = conv.id;
      return toDetail(conv);
    },

    async getConversation(id: string): Promise<ConversationDetail | null> {
      await delay();
      const conv = conversations.find((c) => c.id === id);
      if (!conv) {
        return null;
      }
      lastConversationId = conv.id;
      return toDetail(conv);
    },

    async sendMessage(
      conversationId: string,
      text: string,
    ): Promise<ConversationDetail> {
      await delay(200);
      const conv = conversations.find((c) => c.id === conversationId);
      if (!conv) {
        throw new Error("Conversation not found");
      }
      const trimmed = text.trim();
      if (!trimmed) {
        throw new Error("Message cannot be empty");
      }
      if (conv.turns.length === 0) {
        conv.title = truncateTitle(trimmed);
      }
      conv.turns.push({ role: "user", text: trimmed });
      conv.turns.push({
        role: "assistant",
        text: `Mock reply to: ${trimmed}`,
      });
      conv.updatedAt = Date.now();
      lastConversationId = conv.id;
      return toDetail(conv);
    },

    async deleteConversation(id: string): Promise<void> {
      await delay();
      const idx = conversations.findIndex((c) => c.id === id);
      if (idx < 0) {
        return;
      }
      const [removed] = conversations.splice(idx, 1);
      if (!removed) {
        return;
      }
      const remaining = conversations.some(
        (c) => c.workspaceId === removed.workspaceId,
      );
      if (!remaining) {
        const wsIdx = workspaces.findIndex((w) => w.id === removed.workspaceId);
        if (wsIdx >= 0) {
          workspaces.splice(wsIdx, 1);
        }
      }
      if (lastConversationId === id) {
        lastConversationId = conversations[0]?.id ?? null;
      }
    },
  };
}
