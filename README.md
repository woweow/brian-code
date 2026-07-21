# brian-code

Headless OpenAI agent you run from the terminal. Tools live as individual files under `tools/`; register new tools in [`tools/index.ts`](tools/index.ts).

## Setup

1. Create a `.env` file in the project root (already gitignored):

```bash
OPENAI_API_KEY=your-key-here
```

2. Install dependencies:

```bash
npm install
```

## Commands

**Run the agent** with a prompt:

```bash
npm run agent -- "Use your available tools to create a person."
```

You should see debug logs from `[getFirstName]` and `[getAge]` when the model calls those tools, then a final response under `--- Response ---`.

**Tests:**

```bash
npm test
```

## Adding a tool

1. Add a new file under `tools/` (export an `AgentTool` with `definition` + `execute`).
2. Import it in [`tools/index.ts`](tools/index.ts) and append it to `registeredTools`.

Model is fixed to `gpt-5.4-mini` in [`src/openai-client.ts`](src/openai-client.ts).
