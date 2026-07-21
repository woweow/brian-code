import { config } from "dotenv";
import { app, BrowserWindow, ipcMain } from "electron";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runAgent } from "@brian-code/agent";

const repoRoot = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../..",
);
config({ path: resolve(repoRoot, ".env") });

const isDev = process.env.DESKTOP_DEV === "1";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
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

ipcMain.handle("agent:run", async (_event, prompt: unknown) => {
  if (typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("Prompt must be a non-empty string");
  }
  // Wave 1: runAgent now returns { finalText, updatedTranscript }.
  // Wave 2 will wire multi-turn transcript through IPC.
  const { finalText } = await runAgent(prompt.trim());
  return finalText;
});

app.whenReady().then(() => {
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
