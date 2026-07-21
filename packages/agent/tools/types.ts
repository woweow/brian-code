import type OpenAI from "openai";

export type ToolContext = {
  workspaceRoot: string;
};

export type AgentTool = {
  definition: OpenAI.Responses.FunctionTool;
  execute: (
    args: unknown,
    ctx: ToolContext,
  ) => Promise<string> | string;
};
