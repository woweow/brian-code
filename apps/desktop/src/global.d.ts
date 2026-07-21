import type { DesktopApi } from "./types.js";

export type {
  BootstrapPayload,
  ConversationDetail,
  DesktopApi,
  SidebarConversation,
  SidebarPayload,
  SidebarWorkspaceGroup,
  UiTurn,
} from "./types.js";

declare global {
  interface Window {
    api?: DesktopApi;
  }
}

export {};
