const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  pickFolder: () => ipcRenderer.invoke("chat:pickFolder"),
  listSidebar: () => ipcRenderer.invoke("chat:listSidebar"),
  getBootstrap: () => ipcRenderer.invoke("chat:getBootstrap"),
  createConversation: (folderPath) =>
    ipcRenderer.invoke("chat:createConversation", folderPath),
  getConversation: (id) => ipcRenderer.invoke("chat:getConversation", id),
  sendMessage: (conversationId, text) =>
    ipcRenderer.invoke("chat:sendMessage", conversationId, text),
  forkConversation: (id) => ipcRenderer.invoke("chat:forkConversation", id),
  rewriteMessage: (conversationId, turnIndex, text) =>
    ipcRenderer.invoke("chat:rewriteMessage", conversationId, turnIndex, text),
  deleteConversation: (id) =>
    ipcRenderer.invoke("chat:deleteConversation", id),
});
