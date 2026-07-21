type TurnList = {
  turns: Array<{ role: "user" | "assistant"; text: string }>;
};

export function appendOptimisticUserTurn<T extends TurnList>(
  conversation: T,
  text: string,
): T {
  return {
    ...conversation,
    turns: [...conversation.turns, { role: "user", text }],
  };
}

export function rollbackOptimisticUserTurn<T extends TurnList>(
  conversation: T,
  text: string,
): T {
  const last = conversation.turns.at(-1);
  if (!last || last.role !== "user" || last.text !== text) {
    return conversation;
  }
  return {
    ...conversation,
    turns: conversation.turns.slice(0, -1),
  };
}
