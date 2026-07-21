import type OpenAI from "openai";
import { bashTool } from "./bash.js";
import { fileReadTool } from "./file-read.js";
import { fileWriteTool } from "./file-write.js";
import { getAgeTool } from "./get-age.js";
import { getFirstNameTool } from "./get-first-name.js";
import type { AgentTool } from "./types.js";

/** Add new tools here when you add a file under tools/ */
const registeredTools: AgentTool[] = [
  getFirstNameTool,
  getAgeTool,
  fileReadTool,
  fileWriteTool,
  bashTool,
];

export const toolDefinitions: OpenAI.Responses.FunctionTool[] =
  registeredTools.map((t) => t.definition);

export const toolExecutors: Record<
  string,
  AgentTool["execute"]
> = Object.fromEntries(
  registeredTools.map((t) => [t.definition.name, t.execute]),
);
