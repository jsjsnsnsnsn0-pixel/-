export function isSpeakingSamples(samples: Uint8Array, muted: boolean): boolean {
  if (muted || !samples.length) return false;
  const energy = samples.reduce((sum,value) => sum + ((value - 128) / 128) ** 2, 0);
  return Math.sqrt(energy / samples.length) > 0.025;
}
