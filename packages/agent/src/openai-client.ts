import OpenAI from "openai";

export const MODEL = "gpt-5.4-mini";

export function requireApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to your .env file in the project root.",
    );
  }
  return apiKey;
}

export function createOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: requireApiKey() });
}
