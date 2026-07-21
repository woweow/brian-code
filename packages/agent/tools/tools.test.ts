import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bashTool } from "./bash.js";
import { fileReadTool } from "./file-read.js";
import { fileWriteTool } from "./file-write.js";
import { getAgeTool } from "./get-age.js";
import { getFirstNameTool } from "./get-first-name.js";
import type { ToolContext } from "./types.js";
import { resolveWorkspacePath } from "./workspace-path.js";

const ctx = (workspaceRoot: string): ToolContext => ({ workspaceRoot });

describe("getFirstNameTool", () => {
  it("returns Alex as firstName", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await getFirstNameTool.execute({}, ctx("/tmp"));
    expect(JSON.parse(result)).toEqual({ firstName: "Alex" });
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("[getFirstName]"),
    );
    logSpy.mockRestore();
  });
});

describe("getAgeTool", () => {
  it("returns age 28", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await getAgeTool.execute({}, ctx("/tmp"));
    expect(JSON.parse(result)).toEqual({ age: 28 });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[getAge]"));
    logSpy.mockRestore();
  });
});

describe("resolveWorkspacePath", () => {
  it("rejects paths containing ..", () => {
    const result = resolveWorkspacePath("/ws", "foo/../bar");
    expect(result).toEqual({ ok: false, error: 'Path must not contain ".."' });
  });

  it("resolves relative paths under the workspace", () => {
    const result = resolveWorkspacePath("/ws", "src/a.ts");
    expect(result).toEqual({
      ok: true,
      absolutePath: path.resolve("/ws", "src/a.ts"),
    });
  });
});

describe("fileRead and fileWrite", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "brian-tools-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("writes and reads a file", async () => {
    const writeResult = await fileWriteTool.execute(
      { path: "notes/hello.txt", content: "hi" },
      ctx(dir),
    );
    expect(JSON.parse(writeResult)).toEqual({
      path: "notes/hello.txt",
      written: true,
    });
    const readResult = await fileReadTool.execute(
      { path: "notes/hello.txt" },
      ctx(dir),
    );
    expect(JSON.parse(readResult)).toEqual({
      path: "notes/hello.txt",
      content: "hi",
    });
  });

  it("rejects .. in fileRead", async () => {
    const result = await fileReadTool.execute(
      { path: "../secret" },
      ctx(dir),
    );
    expect(JSON.parse(result)).toEqual({
      error: 'Path must not contain ".."',
    });
  });

  it("rejects .. in fileWrite", async () => {
    const result = await fileWriteTool.execute(
      { path: "a/../../b", content: "x" },
      ctx(dir),
    );
    expect(JSON.parse(result)).toEqual({
      error: 'Path must not contain ".."',
    });
  });

  it("returns an error when the file is missing", async () => {
    const result = await fileReadTool.execute(
      { path: "missing.txt" },
      ctx(dir),
    );
    expect(JSON.parse(result).error).toBeTruthy();
  });
});

describe("bashTool", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "brian-bash-"));
    writeFileSync(path.join(dir, "hello.txt"), "world");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("runs a command in the workspace", async () => {
    const result = await bashTool.execute({ command: "cat hello.txt" }, ctx(dir));
    const parsed = JSON.parse(result);
    expect(parsed.exitCode).toBe(0);
    expect(parsed.stdout).toBe("world");
  });

  it("blocks rm and asks the user to delete files", async () => {
    const result = await bashTool.execute(
      { command: "rm hello.txt" },
      ctx(dir),
    );
    expect(JSON.parse(result)).toEqual({
      error:
        "The rm command is blocked. Ask the user to delete files themselves.",
    });
  });

  it("blocks rm when embedded in a pipeline", async () => {
    const result = await bashTool.execute(
      { command: "echo hi && rm -rf ." },
      ctx(dir),
    );
    expect(JSON.parse(result).error).toContain("rm command is blocked");
  });
});

describe("toolDefinitions registry", () => {
  it("includes person and workspace tools", async () => {
    const { toolDefinitions, toolExecutors } = await import("./index.js");
    const names = toolDefinitions.map((d) => d.name).sort();
    expect(names).toEqual([
      "bash",
      "fileRead",
      "fileWrite",
      "get_age",
      "get_first_name",
    ]);
    expect(typeof toolExecutors.get_first_name).toBe("function");
    expect(typeof toolExecutors.get_age).toBe("function");
    expect(typeof toolExecutors.fileRead).toBe("function");
    expect(typeof toolExecutors.fileWrite).toBe("function");
    expect(typeof toolExecutors.bash).toBe("function");
  });
});
