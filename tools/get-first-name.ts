import type { AgentTool } from "./types.js";

export const getFirstNameTool: AgentTool = {
  definition: {
    type: "function",
    name: "get_first_name",
    description: "Returns a first name to use when building a person.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
    strict: true,
  },
  execute: async () => {
    const firstName = "Alex";
    console.log(`[getFirstName] returning first name: ${firstName}`);
    return JSON.stringify({ firstName });
  },
};
