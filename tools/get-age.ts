import type { AgentTool } from "./types.js";

export const getAgeTool: AgentTool = {
  definition: {
    type: "function",
    name: "get_age",
    description: "Returns an age to use when building a person.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
    strict: true,
  },
  execute: async () => {
    const age = 28;
    console.log(`[getAge] returning age: ${age}`);
    return JSON.stringify({ age });
  },
};
