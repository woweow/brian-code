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
  deleteConversation: (id) =>
    ipcRenderer.invoke("chat:deleteConversation", id),
});
