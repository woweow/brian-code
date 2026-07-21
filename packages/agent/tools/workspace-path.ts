import path from "node:path";

export type ResolvePathResult =
  | { ok: true; absolutePath: string }
  | { ok: false; error: string };

/** Resolve a workspace-relative path; reject any path containing "..". */
export function resolveWorkspacePath(
  workspaceRoot: string,
  relativePath: string,
): ResolvePathResult {
  if (relativePath.includes("..")) {
    return {
      ok: false,
      error: 'Path must not contain ".."',
    };
  }
  return {
    ok: true,
    absolutePath: path.resolve(workspaceRoot, relativePath),
  };
}
