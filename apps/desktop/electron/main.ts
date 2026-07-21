import { config } from "dotenv";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runAgent, type AgentRunOptions } from "@brian-code/agent";
import {
  buildSidebarPayload,
  closeDb,
  createConversationInFolder,
  deleteConversationAndMaybeWorkspace,
  forkConversationDetail,
  getBootstrap,
  getConversationDetail,
  openDb,
  sendMessage,
  rewriteMessage,
  type ChatDb,
} from "@brian-code/chat-store";

const repoRoot = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../..",
);
config({ path: resolve(repoRoot, ".env") });

const isDev = process.env.DESKTOP_DEV === "1";

let db: ChatDb | null = null;

function requireDb(): ChatDb {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    webPreferences: {
      preload: resolve(
        fileURLToPath(new URL(".", import.meta.url)),
        "../electron/preload.cjs",
      ),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    void win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    void win.loadFile(
      resolve(fileURLToPath(new URL(".", import.meta.url)), "../dist/index.html"),
    );
  }

  win.webContents.on("preload-error", (_event, preloadPath, error) => {
    console.error("[electron] preload failed:", preloadPath, error);
  });
}

function registerIpcHandlers(): void {
  ipcMain.handle("chat:pickFolder", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0] ?? null;
  });

  ipcMain.handle("chat:listSidebar", async () => {
    return buildSidebarPayload(requireDb());
  });

  ipcMain.handle("chat:getBootstrap", async () => {
    return getBootstrap(requireDb());
  });

  ipcMain.handle(
    "chat:createConversation",
    async (_event, folderPath: unknown) => {
      if (typeof folderPath !== "string" || folderPath.trim() === "") {
        throw new Error("folderPath must be a non-empty string");
      }
      return createConversationInFolder(requireDb(), folderPath.trim());
    },
  );

  ipcMain.handle("chat:getConversation", async (_event, id: unknown) => {
    if (typeof id !== "string" || id.trim() === "") {
      throw new Error("id must be a non-empty string");
    }
    return getConversationDetail(requireDb(), id.trim());
  });

  ipcMain.handle(
    "chat:sendMessage",
    async (_event, conversationId: unknown, text: unknown) => {
      if (typeof conversationId !== "string" || conversationId.trim() === "") {
        throw new Error("conversationId must be a non-empty string");
      }
      if (typeof text !== "string") {
        throw new Error("text must be a string");
      }
      return sendMessage(
        requireDb(),
        conversationId.trim(),
        text,
        async (prompt, options) =>
          runAgent(prompt, {
            transcript: options?.transcript as AgentRunOptions["transcript"],
            workspaceRoot: options?.workspaceRoot,
          }),
      );
    },
  );

  ipcMain.handle("chat:forkConversation", async (_event, id: unknown) => {
    if (typeof id !== "string" || id.trim() === "") {
      throw new Error("id must be a non-empty string");
    }
    return forkConversationDetail(requireDb(), id.trim());
  });

  ipcMain.handle(
    "chat:rewriteMessage",
    async (
      _event,
      conversationId: unknown,
      turnIndex: unknown,
      text: unknown,
    ) => {
      if (typeof conversationId !== "string" || conversationId.trim() === "") {
        throw new Error("conversationId must be a non-empty string");
      }
      if (typeof turnIndex !== "number" || !Number.isInteger(turnIndex)) {
        throw new Error("turnIndex must be an integer");
      }
      if (typeof text !== "string") {
        throw new Error("text must be a string");
      }
      return rewriteMessage(
        requireDb(),
        conversationId.trim(),
        turnIndex,
        text,
        async (prompt, options) =>
          runAgent(prompt, {
            transcript: options?.transcript as AgentRunOptions["transcript"],
            workspaceRoot: options?.workspaceRoot,
          }),
      );
    },
  );

  ipcMain.handle("chat:deleteConversation", async (_event, id: unknown) => {
    if (typeof id !== "string" || id.trim() === "") {
      throw new Error("id must be a non-empty string");
    }
    deleteConversationAndMaybeWorkspace(requireDb(), id.trim());
  });
}

app.whenReady().then(() => {
  db = openDb(join(app.getPath("userData"), "brian-code.sqlite"));
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (db) {
    closeDb(db);
    db = null;
  }
});
