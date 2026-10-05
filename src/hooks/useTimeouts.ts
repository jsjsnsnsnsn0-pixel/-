import { useCallback, useEffect, useRef } from 'react';

/** Cancel pending UI work on unmount or when the current dialog/chat changes. */
export function useTimeouts(scope?: unknown) {
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const pending = timers.current;
    return () => {
      mounted.current = false;
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, [scope]);

  return useCallback((callback: () => void, delay: number, key = 'default') => {
    if (!mounted.current) return;
    const previous = timers.current.get(key);
    if (previous !== undefined) clearTimeout(previous);
    timers.current.set(key, setTimeout(() => {
      timers.current.delete(key);
      callback();
    }, delay));
  }, []);
}
