# brian-code

Local multi-turn agent (OpenAI + tools) with a ChatGPT-like Electron desktop shell and a headless chat CLI for verification. Conversations live in SQLite; each conversation belongs to a workspace folder on disk.

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

**One-shot agent** (no persistence):

```bash
npm run agent -- "Use your available tools to create a person."
```

**Headless chat CLI** — exercises the same store + agent path as desktop. DB path: `BRIAN_CODE_DB` or `~/.brian-code/dev.sqlite`.

```bash
BRIAN_CODE_DB=/tmp/brian-test.sqlite npm run chat -- new --folder /tmp
BRIAN_CODE_DB=/tmp/brian-test.sqlite npm run chat -- list
BRIAN_CODE_DB=/tmp/brian-test.sqlite npm run chat -- send <conversation-id> "Hello"
BRIAN_CODE_DB=/tmp/brian-test.sqlite npm run chat -- show <conversation-id>
BRIAN_CODE_DB=/tmp/brian-test.sqlite npm run chat -- fork <conversation-id>
BRIAN_CODE_DB=/tmp/brian-test.sqlite npm run chat -- delete <conversation-id>
```

**Desktop app** (real folder picker + IPC + SQLite under Electron `userData`/`brian-code.sqlite`):

```bash
npm run desktop
# or with Vite HMR:
npm run desktop:dev
```

**UI browser preview** (layout + mock data only — no real agent/IPC):

```bash
npm run ui:dev
```

Open [http://localhost:5173](http://localhost:5173). Use `desktop` / `desktop:dev` for real conversations. The composer is hidden until a chat is selected; Enter sends (Shift+Enter for a newline). Sidebar and thread scroll independently. While waiting on a reply, the composer locks and `apps/desktop/src/assets/loading-image.png` plays beside the status line.

**Tests / typecheck:**

```bash
npm test
npm run typecheck
```

## Data model

- **Workspace** — unique absolute `folderPath` (find-or-create on New)
- **Conversation** — belongs to a workspace; stores `model_transcript` (full OpenAI Responses item list) for resume
- **UI** — `projectTranscript` emits user + final assistant text only (tools stored, not shown yet)
- Persist only after a successful agent turn; fail send if the workspace folder is missing

## Repository layout

```
packages/agent/       @brian-code/agent — multi-turn runAgent (+ transcript), tools/
packages/chat-store/  @brian-code/chat-store — SQLite, service helpers, projector
apps/cli/             agent one-shot + chat CRUD CLI
apps/desktop/         Electron main/preload + RN Web ChatGPT-like shell
```

Desktop main opens SQLite, exposes `window.api` (`pickFolder`, `listSidebar`, `getBootstrap`, `createConversation`, `getConversation`, `sendMessage`, `forkConversation`, `deleteConversation`), and calls multi-turn `runAgent` on send.

## better-sqlite3 + Electron

`better-sqlite3` is a native module (Node ABI ≠ Electron ABI). `npm run desktop` / `desktop:dev` rebuild it for Electron automatically. `npm test` rebuilds it for Node first.

Manual flip if needed:

```bash
npm run rebuild:native:electron   # before desktop
npm run rebuild:native:node       # before CLI / tests
```

## Adding a tool

1. Add a file under `packages/agent/tools/` (`AgentTool` with `definition` + `execute(args, ctx)`).
2. Register it in `packages/agent/tools/index.ts`.

Built-in workspace tools (`fileRead`, `fileWrite`, `bash`) resolve paths relative to the conversation `folderPath` (one-shot agent uses `process.cwd()`). Paths containing `..` are rejected. `bash` blocks `rm` and tells the model to ask the user to delete files.

Model is fixed to `gpt-5.4-mini` in `packages/agent/src/openai-client.ts`.
