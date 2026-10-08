/** Bound network waits without retrying writes whose outcome may be unknown. */
export async function fetchWithDeadline(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const upstream = init?.signal || (input instanceof Request ? input.signal : undefined);
  const abort = () => controller.abort(upstream?.reason);
  if (upstream?.aborted) abort(); else upstream?.addEventListener('abort', abort, {once: true});
  const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeoutMs);
  try { return await fetch(input, {...init, signal: controller.signal}); }
  finally { clearTimeout(timer); upstream?.removeEventListener('abort', abort); }
}
