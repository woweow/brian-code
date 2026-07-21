import { config } from "dotenv";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runAgent } from "@brian-code/agent";
import {
  buildSidebarPayload,
  closeDb,
  createConversationInFolder,
  deleteConversationAndMaybeWorkspace,
  forkConversationDetail,
  getConversationDetail,
  openDb,
  rewriteMessage,
  sendMessage,
  type RunAgentFn,
} from "@brian-code/chat-store";

const repoRoot = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../..",
);
config({ path: resolve(repoRoot, ".env") });

function dbPath(): string {
  return (
    process.env.BRIAN_CODE_DB ?? join(homedir(), ".brian-code", "dev.sqlite")
  );
}

function usage(): never {
  console.error(`Usage:
  npm run chat -- new --folder <path>
  npm run chat -- list
  npm run chat -- show <id>
  npm run chat -- send <id> <message...>
  npm run chat -- rewrite <id> <turnIndex> <message...>
  npm run chat -- fork <id>
  npm run chat -- delete <id>`);
  process.exit(1);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  if (!command) {
    usage();
  }

  const path = dbPath();
  mkdirSync(dirname(path), { recursive: true });
  const db = openDb(path);
  try {
    if (command === "new") {
      const folderFlag = args.indexOf("--folder");
      const folder =
        folderFlag >= 0 ? args[folderFlag + 1]?.trim() : undefined;
      if (!folder) {
        console.error("new requires --folder <path>");
        process.exit(1);
      }
      const detail = createConversationInFolder(db, folder);
      console.log(detail.id);
      return;
    }

    if (command === "list") {
      const sidebar = buildSidebarPayload(db);
      console.log(JSON.stringify(sidebar, null, 2));
      return;
    }

    if (command === "show") {
      const id = args[1]?.trim();
      if (!id) {
        console.error("show requires <id>");
        process.exit(1);
      }
      const detail = getConversationDetail(db, id);
      if (!detail) {
        console.error(`Conversation not found: ${id}`);
        process.exit(1);
      }
      console.log(JSON.stringify(detail.turns, null, 2));
      return;
    }

    if (command === "send") {
      const id = args[1]?.trim();
      const message = args.slice(2).join(" ").trim();
      if (!id || !message) {
        console.error("send requires <id> <message...>");
        process.exit(1);
      }
      const detail = await sendMessage(
        db,
        id,
        message,
        runAgent as RunAgentFn,
      );
      console.log(detail.turns.at(-1)?.text ?? "");
      return;
    }

    if (command === "rewrite") {
      const id = args[1]?.trim();
      const turnRaw = args[2]?.trim();
      const message = args.slice(3).join(" ").trim();
      const turnIndex = turnRaw === undefined ? NaN : Number(turnRaw);
      if (!id || !Number.isInteger(turnIndex) || !message) {
        console.error("rewrite requires <id> <turnIndex> <message...>");
        process.exit(1);
      }
      const detail = await rewriteMessage(
        db,
        id,
        turnIndex,
        message,
        runAgent as RunAgentFn,
      );
      console.log(detail.turns.at(-1)?.text ?? "");
      return;
    }

    if (command === "fork") {
      const id = args[1]?.trim();
      if (!id) {
        console.error("fork requires <id>");
        process.exit(1);
      }
      const detail = forkConversationDetail(db, id);
      console.log(detail.id);
      return;
    }

    if (command === "delete") {
      const id = args[1]?.trim();
      if (!id) {
        console.error("delete requires <id>");
        process.exit(1);
      }
      deleteConversationAndMaybeWorkspace(db, id);
      console.log(`deleted ${id}`);
      return;
    }

    usage();
  } finally {
    closeDb(db);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[chat] error: ${message}`);
  process.exit(1);
});
