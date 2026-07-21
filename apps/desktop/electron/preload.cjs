const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  runAgent: (prompt) => ipcRenderer.invoke("agent:run", prompt),
});
