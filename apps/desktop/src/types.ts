export type UiTurn = {
  role: "user" | "assistant";
  text: string;
};

export type SidebarConversation = {
  id: string;
  title: string;
  updatedAt: number;
};

export type SidebarWorkspaceGroup = {
  workspaceId: string;
  folderPath: string;
  conversations: SidebarConversation[];
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

export type ContextCategory = "conversation" | "toolCalls" | "other";

export type ContextUsageBucket = {
  category: ContextCategory;
  label: string;
  tokens: number;
};

export type ContextUsage = {
  totalTokens: number;
  budgetTokens: number;
  fillRatio: number;
  buckets: ContextUsageBucket[];
};

export type BootstrapPayload = {
  lastConversationId: string | null;
  sidebar: SidebarPayload;
};

export type DesktopApi = {
  pickFolder: () => Promise<string | null>;
  listSidebar: () => Promise<SidebarPayload>;
  getBootstrap: () => Promise<BootstrapPayload>;
  createConversation: (folderPath: string) => Promise<ConversationDetail>;
  getConversation: (id: string) => Promise<ConversationDetail | null>;
  sendMessage: (
    conversationId: string,
    text: string,
  ) => Promise<ConversationDetail>;
  forkConversation: (id: string) => Promise<ConversationDetail>;
  rewriteMessage: (
    conversationId: string,
    turnIndex: number,
    text: string,
  ) => Promise<ConversationDetail>;
  deleteConversation: (id: string) => Promise<void>;
  getContextUsage: (id: string) => Promise<ContextUsage | null>;
};
