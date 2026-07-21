import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AgentTool } from "./types.js";
import { resolveWorkspacePath } from "./workspace-path.js";

export const fileWriteTool: AgentTool = {
  definition: {
    type: "function",
    name: "fileWrite",
    description:
      "Write a UTF-8 text file relative to the current workspace folder (creates parent dirs). Paths must not contain \"..\".",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path relative to the workspace root",
        },
        content: {
          type: "string",
          description: "UTF-8 file contents to write",
        },
      },
      required: ["path", "content"],
      additionalProperties: false,
    },
    strict: true,
  },
  execute: async (args, ctx) => {
    if (
      typeof args !== "object" ||
      args === null ||
      !("path" in args) ||
      !("content" in args) ||
      typeof (args as { path: unknown }).path !== "string" ||
      typeof (args as { content: unknown }).content !== "string"
    ) {
      return JSON.stringify({ error: "path and content must be strings" });
    }
    const { path: relativePath, content } = args as {
      path: string;
      content: string;
    };
    const resolved = resolveWorkspacePath(ctx.workspaceRoot, relativePath);
    if (!resolved.ok) {
      return JSON.stringify({ error: resolved.error });
    }
    try {
      await mkdir(path.dirname(resolved.absolutePath), { recursive: true });
      await writeFile(resolved.absolutePath, content, "utf8");
      return JSON.stringify({ path: relativePath, written: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ error: message });
    }
  },
};
