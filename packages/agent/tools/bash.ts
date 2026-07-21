import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { AgentTool } from "./types.js";

const execAsync = promisify(exec);

const RM_PATTERN = /\brm\b/;

export const bashTool: AgentTool = {
  definition: {
    type: "function",
    name: "bash",
    description:
      "Run a shell command in the current workspace folder. The rm command is blocked; ask the user to delete files themselves.",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "Shell command to run",
        },
      },
      required: ["command"],
      additionalProperties: false,
    },
    strict: true,
  },
  execute: async (args, ctx) => {
    const command =
      typeof args === "object" &&
      args !== null &&
      "command" in args &&
      typeof (args as { command: unknown }).command === "string"
        ? (args as { command: string }).command
        : null;
    if (command === null) {
      return JSON.stringify({ error: "command must be a string" });
    }
    if (RM_PATTERN.test(command)) {
      return JSON.stringify({
        error:
          "The rm command is blocked. Ask the user to delete files themselves.",
      });
    }
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: ctx.workspaceRoot,
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
      });
      return JSON.stringify({
        stdout,
        stderr,
        exitCode: 0,
      });
    } catch (error) {
      const err = error as {
        message?: string;
        stdout?: string;
        stderr?: string;
        code?: number;
      };
      return JSON.stringify({
        error: err.message ?? String(error),
        stdout: err.stdout ?? "",
        stderr: err.stderr ?? "",
        exitCode: typeof err.code === "number" ? err.code : 1,
      });
    }
  },
};
