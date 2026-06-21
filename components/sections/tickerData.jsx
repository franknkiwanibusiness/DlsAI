export const SITES = [
  { name: 'NicheReviews.io', niche: 'Affiliate / SEO', rev: '$420/mo', price: '$8,200', type: 'saas' },
  { name: 'TaskFlowApp', niche: 'SaaS / Productivity', rev: '$1,100/mo', price: '$22,000', type: 'saas' },
  { name: 'GardenHacks.net', niche: 'Content / Display', rev: '$310/mo', price: '$5,800', type: 'blog' },
  { name: 'InvoiceKit.co', niche: 'SaaS / Finance', rev: '$740/mo', price: '$14,900', type: 'saas' },
  { name: 'TechDealsToday', niche: 'Newsletter', rev: '$590/mo', price: '$10,200', type: 'news' },
  { name: 'FitTrack.app', niche: 'SaaS / Health', rev: '$2,100/mo', price: '$42,000', type: 'saas' },
  { name: 'RecipeFinder.io', niche: 'Content / Ads', rev: '$180/mo', price: '$3,100', type: 'blog' },
  { name: 'ShipBuilder.dev', niche: 'Tool / Dev', rev: '$330/mo', price: '$7,600', type: 'tool' },
  { name: 'LegalDocs.app', niche: 'SaaS / Legal', rev: '$920/mo', price: '$18,500', type: 'saas' },
  { name: 'PixelStock.co', niche: 'Marketplace / Media', rev: '$460/mo', price: '$9,200', type: 'mkt' },
  { name: 'CryptoAlert.io', niche: 'SaaS / Crypto', rev: '$1,400/mo', price: '$28,000', type: 'saas' },
  { name: 'RemoteJobsHQ', niche: 'Jobs / Directory', rev: '$680/mo', price: '$12,200', type: 'dir' },
  { name: 'WeddingGuide.net', niche: 'Content / Ads', rev: '$240/mo', price: '$4,400', type: 'blog' },
  { name: 'PodcastTools.app', niche: 'SaaS / Media', rev: '$810/mo', price: '$16,200', type: 'saas' },
  { name: 'EcoShop.store', niche: 'eCommerce / Green', rev: '$1,900/mo', price: '$38,000', type: 'shop' },
  { name: 'StudyFlash.io', niche: 'SaaS / Edtech', rev: '$560/mo', price: '$11,200', type: 'saas' },
  { name: 'HackerDigest', niche: 'Newsletter / Tech', rev: '$390/mo', price: '$7,000', type: 'news' },
  { name: 'LinkVault.app', niche: 'Tool / Productivity', rev: '$270/mo', price: '$4,900', type: 'tool' },
];

export const TYPE_ICONS = {
  saas: {
    bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)',
    svg: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="3" width="13" height="10" rx="2" stroke="#a855f7" strokeWidth="1.2" />
        <path d="M5 8h6M5 10.5h3" stroke="#a855f7" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    ),
  },
  blog: {
    bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.3)',
    svg: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 4h10M3 7h10M3 10h6" stroke="#818cf8" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  news: {
    bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)',
    svg: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="#fbbf24" strokeWidth="1.2" />
        <path d="M4 6h4M4 8.5h6M4 11h3" stroke="#fbbf24" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    ),
  },
  tool: {
    bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.25)',
    svg: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M9.5 3.5a3 3 0 0 1-4 4L3 10a1.41 1.41 0 0 0 2 2l2.5-2.5a3 3 0 0 1 4-4l-1.5 1.5 1 1 1.5-1.5Z" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  shop: {
    bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)',
    svg: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2.5 2h1.8l2 7h5.4l1.8-5H5.5" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7" cy="13" r="1" fill="#34d399" />
        <circle cx="11" cy="13" r="1" fill="#34d399" />
      </svg>
    ),
  },
  mkt: {
    bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.25)',
    svg: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke="#818cf8" strokeWidth="1.2" />
        <path d="M5.5 8h5M8 5.5v5" stroke="#818cf8" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  dir: {
    bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)',
    svg: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="5" height="5" rx="1" stroke="#f87171" strokeWidth="1.2" />
        <rect x="9" y="2" width="5" height="5" rx="1" stroke="#f87171" strokeWidth="1.2" />
        <rect x="2" y="9" width="5" height="5" rx="1" stroke="#f87171" strokeWidth="1.2" />
        <rect x="9" y="9" width="5" height="5" rx="1" stroke="#f87171" strokeWidth="1.2" />
      </svg>
    ),
  },
};

// Cycles 'Sold' x3, 'Listed' x2, 'Under offer' x1 — matches original distribution
export const STATUSES = ['Sold', 'Sold', 'Sold', 'Listed', 'Listed', 'Under offer'];
