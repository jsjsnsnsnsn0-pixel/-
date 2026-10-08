/** Accepted friendships from the authenticated/RLS-scoped friendships table. */
export type FriendshipPair = {
  user_a: string | null;
  user_b: string | null;
  status: string | null;
};

/** Room-owner identities must come from actual accepted friendships, never list order. */
export function acceptedFriendOwnerIds(userId: string, rows: readonly FriendshipPair[]): ReadonlySet<string> {
  const owners = new Set<string>();
  if (!userId) return owners;
  for (const row of rows) {
    if (row.status !== 'accepted') continue;
    if (row.user_a === userId && row.user_b && row.user_b !== userId) owners.add(row.user_b);
    if (row.user_b === userId && row.user_a && row.user_a !== userId) owners.add(row.user_a);
  }
  return owners;
}
