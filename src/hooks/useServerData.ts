import { useCallback, useEffect, useRef, useState } from 'react';
import { backendMessage } from '../services/backend';

// Scope every result to its current screen/account, including manual reloads.
export function useServerData<T>(load: () => Promise<T>, initial: T) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true); setError(null);
    try { const next = await load(); if (current === generation.current) setData(next); }
    catch (e) { if (current === generation.current) setError(backendMessage(e)); }
    finally { if (current === generation.current) setLoading(false); }
  }, [load]);
  useEffect(() => { setData(initial); void reload(); return () => { generation.current++; }; }, [reload]);
  return {data, loading, error, reload};
}
