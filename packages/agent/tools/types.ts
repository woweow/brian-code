import type OpenAI from "openai";

export type AgentTool = {
  definition: OpenAI.Responses.FunctionTool;
  execute: (args: unknown) => Promise<string> | string;
};
