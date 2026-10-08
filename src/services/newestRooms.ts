/** Latest rooms first; an unknown creation date sorts after verified dates. */
export function newestRooms<T extends {createdAt?: string}>(rooms: readonly T[]): T[] {
  const stamp = (value?: string) => {
    const parsed = value ? Date.parse(value) : NaN;
    return Number.isFinite(parsed) ? parsed : 0;
  };
  return [...rooms].sort((a, b) => stamp(b.createdAt) - stamp(a.createdAt));
}
