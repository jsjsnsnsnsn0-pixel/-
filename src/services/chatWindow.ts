/** Show a bounded recent window of a chronological message feed without mutating its order. */
export function recentChatMessages<T>(messages: readonly T[], requestedCount: number): T[] {
  const count = Number.isFinite(requestedCount) ? Math.max(0, Math.floor(requestedCount)) : 80;
  return messages.slice(Math.max(0, messages.length - count));
}
