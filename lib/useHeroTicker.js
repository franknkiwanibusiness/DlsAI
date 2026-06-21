'use client';

import { useEffect, useRef, useState } from 'react';

const PHRASES = [
  'Buy & sell sites',
  'Lowest fees',
  'Vetted listings',
  'Secure escrow',
  'For indie hackers',
  '10K+ buyers',
  'Close deals fast',
];

/**
 * Mirrors the original hero ticker: rotates phrases every 2s, with a
 * 290ms "leaving" transition before swapping text and "entering" again.
 * Returns { text, phase } where phase is 'entering' | 'leaving', matching
 * the original CSS class names used to slide text up from the bottom.
 */
export default function useHeroTicker() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState('entering');
  const idxRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase('leaving');
      setTimeout(() => {
        idxRef.current = (idxRef.current + 1) % PHRASES.length;
        setIdx(idxRef.current);
        setPhase('entering');
      }, 290);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return { text: PHRASES[idx], phase };
}
