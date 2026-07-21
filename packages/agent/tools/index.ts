import type OpenAI from "openai";
import { getAgeTool } from "./get-age.js";
import { getFirstNameTool } from "./get-first-name.js";
import type { AgentTool } from "./types.js";

/** Add new tools here when you add a file under tools/ */
const registeredTools: AgentTool[] = [getFirstNameTool, getAgeTool];

export const toolDefinitions: OpenAI.Responses.FunctionTool[] =
  registeredTools.map((t) => t.definition);

export const toolExecutors: Record<
  string,
  (args: unknown) => Promise<string> | string
> = Object.fromEntries(
  registeredTools.map((t) => [t.definition.name, t.execute]),
);
