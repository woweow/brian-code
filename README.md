# brian-code

Local agent (OpenAI + tools) with a thin CLI and an Electron desktop UI (React Native Web). One desktop app: the UI talks to the agent over Electron IPC, not HTTP.

## Setup

1. Create a `.env` file in the project root (gitignored):

```bash
OPENAI_API_KEY=your-key-here
```

2. Install dependencies:

```bash
npm install
```

## Commands

**Run the agent from the terminal:**

```bash
npm run agent -- "Use your available tools to create a person."
```

**Headless chat CLI** (SQLite at `BRIAN_CODE_DB` or `~/.brian-code/dev.sqlite`):

```bash
npm run chat -- new --folder /path/to/workspace
npm run chat -- list
npm run chat -- show <conversation-id>
npm run chat -- send <conversation-id> "Hello"
npm run chat -- delete <conversation-id>
```

**Run the desktop app** (build renderer + Electron, then launch):

```bash
npm run desktop
```

**Dev desktop** (Vite HMR + Electron; optional):

```bash
npm run desktop:dev
```

**UI in the browser only** (layout preview; Submit cannot reach the agent without Electron IPC):

```bash
npm run ui:dev
```

Then open [http://localhost:5173](http://localhost:5173). Use `npm run desktop` or `desktop:dev` when you need a real agent response.

**Tests:**

```bash
npm test
```

**Typecheck:**

```bash
npm run typecheck
```

## Repository layout

```
packages/agent/       @brian-code/agent — multi-turn runAgent (+ transcript), OpenAI client, tools/
packages/chat-store/  @brian-code/chat-store — SQLite workspaces, conversations, UI transcript projector
apps/cli/             Terminal entrypoints (agent one-shot + chat CRUD)
apps/desktop/         Electron main/preload + RN Web UI (Vite)
```

The desktop **main process** opens SQLite under Electron `userData` (`brian-code.sqlite`), wires chat IPC to `@brian-code/chat-store`, and runs multi-turn `runAgent` on `sendMessage`. Preload exposes `window.api` (`pickFolder`, `listSidebar`, `getBootstrap`, `createConversation`, `getConversation`, `sendMessage`, `deleteConversation`). Browser-only `ui:dev` uses the mock API instead.

If `better-sqlite3` fails to load in Electron after install, rebuild native bindings for the Electron ABI (e.g. `npx electron-rebuild -f -w better-sqlite3` from the repo root).

## Adding a tool

1. Add a file under `packages/agent/tools/` (`AgentTool` with `definition` + `execute`).
2. Register it in `packages/agent/tools/index.ts`.

Model is fixed to `gpt-5.4-mini` in `packages/agent/src/openai-client.ts`.
