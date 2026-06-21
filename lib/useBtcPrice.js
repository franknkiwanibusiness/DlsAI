'use client';

import { useEffect, useState } from 'react';

/**
 * Mirrors the original fetchBtcPrice(): fetches BTC price + 24h change
 * from CoinGecko's free public API, once on mount. Silent fail to '$—'
 * matches the original's error handling (price is cosmetic, not critical).
 */
export default function useBtcPrice() {
  const [price, setPrice] = useState(null); // null = loading, '$—' = failed
  const [change, setChange] = useState(null);

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true')
      .then((r) => r.json())
      .then((d) => {
        const p = d.bitcoin;
        if (!p) return;
        setPrice(`$${Number(p.usd).toLocaleString()}`);
        if (p.usd_24h_change !== undefined) {
          const ch = p.usd_24h_change;
          const sign = ch >= 0 ? '+' : '';
          setChange({ text: `${sign}${ch.toFixed(1)}%`, up: ch >= 0 });
        }
      })
      .catch(() => setPrice('$—'));
  }, []);

  return { price: price ?? '—', change };
}
