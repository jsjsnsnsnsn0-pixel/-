/** Server controls the offered quantity choices; the RPC remains authoritative. */
export const DEFAULT_GIFT_QUANTITIES = [1, 7, 77, 777] as const;
export const normalizeGiftQuantities = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [...DEFAULT_GIFT_QUANTITIES];
  const options = [...new Set(value.map(Number).filter(n => Number.isSafeInteger(n) && n > 0 && n <= 777))];
  return options.includes(1) ? options : [...DEFAULT_GIFT_QUANTITIES];
};
