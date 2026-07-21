export {
  openDb,
  closeDb,
  normalizeFolderPath,
  type ChatDb,
} from "./db.js";
export {
  findOrCreateWorkspace,
  createConversation,
  listConversationsForSidebar,
  getConversation,
  updateConversationTranscript,
  deleteConversation,
  getMeta,
  setMeta,
  type Workspace,
  type Conversation,
  type SidebarConversation,
} from "./chat.js";
export { projectTranscript, type UiTurn } from "./project.js";
export {
  LAST_CONVERSATION_ID_KEY,
  buildSidebarPayload,
  createConversationInFolder,
  getConversationDetail,
  sendMessage,
  deleteConversationAndMaybeWorkspace,
  getBootstrap,
  truncateTitle,
  type SidebarGroupConversation,
  type SidebarWorkspaceGroup,
  type SidebarPayload,
  type ConversationDetail,
  type BootstrapPayload,
  type RunAgentFn,
} from "./service.js";
