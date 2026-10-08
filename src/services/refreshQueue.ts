/** Coalesce bursts and retain changes arriving while a request is running. */
export function createRefreshQueue(tasks: Record<string, () => Promise<unknown>>, onError: (error: unknown) => void, delay = 100) {
  const dirty = new Set<string>();
  let disposed = false;
  let running = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const drain = async () => {
    timer = undefined;
    if (disposed || running || !dirty.size) return;
    running = true;
    const keys = [...dirty]; dirty.clear();
    const results = await Promise.allSettled(keys.map(key => Promise.resolve().then(tasks[key])));
    if (!disposed) for (const result of results) if (result.status === 'rejected') onError(result.reason);
    running = false;
    if (!disposed && dirty.size) timer = setTimeout(() => void drain(), delay);
  };
  return {
    enqueue(...keys: string[]) {
      if (disposed) return;
      keys.forEach(key => { if (tasks[key]) dirty.add(key); });
      if (!running && timer === undefined) timer = setTimeout(() => void drain(), delay);
    },
    dispose() { disposed = true; dirty.clear(); clearTimeout(timer); },
  };
}
