import type OpenAI from "openai";
import { createOpenAIClient, MODEL } from "./openai-client.js";
import { toolDefinitions, toolExecutors } from "../tools/index.js";

const MAX_STEPS = 10;

const DEFAULT_INSTRUCTIONS =
  "You are a helpful assistant. When the user asks you to create or describe a person using your tools, call the relevant tools first, then summarize the result clearly.";

export type AgentRunOptions = {
  instructions?: string;
  transcript?: OpenAI.Responses.ResponseInputItem[];
};

export type AgentRunResult = {
  finalText: string;
  updatedTranscript: OpenAI.Responses.ResponseInputItem[];
};

/** Copy transcript and append the user prompt without mutating the caller array. */
export function seedTranscript(
  prompt: string,
  transcript: OpenAI.Responses.ResponseInputItem[] = [],
): OpenAI.Responses.ResponseInputItem[] {
  return [...transcript, { role: "user", content: prompt }];
}

export async function runAgent(
  prompt: string,
  options?: AgentRunOptions,
): Promise<AgentRunResult> {
  const openai = createOpenAIClient();
  const input = seedTranscript(prompt, options?.transcript);

  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await openai.responses.create({
      model: MODEL,
      tools: toolDefinitions,
      instructions: options?.instructions ?? DEFAULT_INSTRUCTIONS,
      input,
    });

    input.push(...response.output);

    const functionCalls = response.output.filter(
      (item): item is OpenAI.Responses.ResponseFunctionToolCallItem =>
        item.type === "function_call",
    );

    if (functionCalls.length === 0) {
      return {
        finalText: response.output_text ?? "",
        updatedTranscript: input,
      };
    }

    console.log(
      `[agent] step ${step + 1}: executing ${functionCalls.length} tool call(s)`,
    );

    for (const call of functionCalls) {
      const execute = toolExecutors[call.name];
      if (!execute) {
        input.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify({ error: `Unknown tool: ${call.name}` }),
        });
        continue;
      }

      const args =
        call.arguments.trim() === "" ? {} : JSON.parse(call.arguments);
      const output = await execute(args);
      input.push({
        type: "function_call_output",
        call_id: call.call_id,
        output,
      });
    }
  }

  throw new Error(`Agent exceeded maximum of ${MAX_STEPS} steps`);
}
