'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Mirrors the original `wireBgSkeleton`: keeps a loading skeleton visible
 * until the paired image has actually finished loading (or errored, so it
 * doesn't block forever on a broken image).
 *
 * Usage:
 *   const { imgRef, loaded } = useBgSkeleton();
 *   <img ref={imgRef} ... />
 *   <div className={`bg-img-skeleton${loaded ? ' is-loaded' : ''}`} />
 */
export default function useBgSkeleton() {
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const reveal = () => setLoaded(true);

    if (img.complete && img.naturalWidth > 0) {
      reveal();
    } else {
      img.addEventListener('load', reveal, { once: true });
      img.addEventListener('error', reveal, { once: true });
      return () => {
        img.removeEventListener('load', reveal);
        img.removeEventListener('error', reveal);
      };
    }
  }, []);

  return { imgRef, loaded };
}
