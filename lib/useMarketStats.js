'use client';

import { useEffect, useState } from 'react';

const CACHE_KEY = 'sr_stats_cache';
const TTL = 24 * 60 * 60 * 1000; // 24 hours, same as original

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || !entry.ts || !entry.data) return null;
    if (Date.now() - entry.ts > TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // storage full or unavailable — stats are cosmetic, fail silently
  }
}

/**
 * Mirrors the original `/api/stats` fetch + 24h cache from script.js.
 * Returns { a, b, c } shape from the API (sellers/sites/countries counts)
 * or null while loading. Components format these into display strings
 * themselves (e.g. `${a}k+`) to match each section's original formatting.
 */
export default function useMarketStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setStats(cached);
      return;
    }

    fetch('/api/stats', { method: 'GET' })
      .then((r) => r.json())
      .then((d) => {
        if (!d || !d.a) return; // bad response — don't cache, retry next load
        setStats(d);
        writeCache(d);
      })
      .catch(() => {}); // silent fail — stats are cosmetic, matches original
  }, []);

  return stats;
}
