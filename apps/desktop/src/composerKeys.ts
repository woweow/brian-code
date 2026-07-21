/** Enter sends; Shift+Enter inserts a newline. */
export function isSendEnterKey(key: string, shiftKey: boolean): boolean {
  return key === "Enter" && !shiftKey;
}

export function shouldShowComposer(selectedId: string | null): boolean {
  return selectedId !== null;
}
