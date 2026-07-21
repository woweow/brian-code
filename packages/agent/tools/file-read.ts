import { readFile } from "node:fs/promises";
import type { AgentTool } from "./types.js";
import { resolveWorkspacePath } from "./workspace-path.js";

export const fileReadTool: AgentTool = {
  definition: {
    type: "function",
    name: "fileRead",
    description:
      "Read a UTF-8 text file relative to the current workspace folder. Paths must not contain \"..\".",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path relative to the workspace root",
        },
      },
      required: ["path"],
      additionalProperties: false,
    },
    strict: true,
  },
  execute: async (args, ctx) => {
    const relativePath =
      typeof args === "object" &&
      args !== null &&
      "path" in args &&
      typeof (args as { path: unknown }).path === "string"
        ? (args as { path: string }).path
        : null;
    if (relativePath === null) {
      return JSON.stringify({ error: "path must be a string" });
    }
    const resolved = resolveWorkspacePath(ctx.workspaceRoot, relativePath);
    if (!resolved.ok) {
      return JSON.stringify({ error: resolved.error });
    }
    try {
      const content = await readFile(resolved.absolutePath, "utf8");
      return JSON.stringify({ path: relativePath, content });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ error: message });
    }
  },
};
