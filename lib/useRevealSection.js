'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Mirrors the original page-wide `.reveal-section` IntersectionObserver:
 * adds a visible flag once the element scrolls into view, then stops
 * observing (fires once, matches original `io.unobserve` behavior).
 *
 * Usage:
 *   const { ref, isVisible } = useRevealSection();
 *   <div ref={ref} className={`orbit-section reveal-section${isVisible ? ' is-visible' : ''}`}>
 */
export default function useRevealSection(threshold = 0.12) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
