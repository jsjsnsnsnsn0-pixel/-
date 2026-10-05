import type { SyntheticEvent } from 'react';

export function setImageFallback(event: SyntheticEvent<HTMLImageElement>, fallback: string) {
  const image = event.currentTarget;
  // Do not reload a broken fallback indefinitely.
  if (image.src !== new URL(fallback, document.baseURI).href) image.src = fallback;
}
