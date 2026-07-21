type TurnList = {
  turns: Array<{ role: "user" | "assistant"; text: string }>;
};

/** Keep turns above `turnIndex`, replace that user turn with `text`, drop the rest. */
export function applyOptimisticRewrite<T extends TurnList>(
  conversation: T,
  turnIndex: number,
  text: string,
): T {
  return {
    ...conversation,
    turns: [
      ...conversation.turns.slice(0, turnIndex),
      { role: "user", text },
    ],
  };
}
