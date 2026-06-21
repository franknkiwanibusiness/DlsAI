const STAR = (
  <svg width="12" height="12" viewBox="0 0 13 13" fill="#fbbf24">
    <path d="M6.5 1l1.18 2.39L10.5 3.82l-2 1.94.47 2.74L6.5 7.23 4.03 8.5l.47-2.74L2.5 3.82l2.82-.43Z" />
  </svg>
);
export const STARS_5 = [STAR, STAR, STAR, STAR, STAR];

export const ROW1_REVIEWS = [
  {
    badge: 'pro',
    text: '"Sold my SaaS in 11 days. The escrow process was seamless — I didn\'t have to think twice about security. Best marketplace for digital assets by far."',
    avatarBg: 'linear-gradient(135deg,#a855f7,#818cf8)',
    avatarLetter: 'M',
    name: 'Marcus R.',
    sub: 'SaaS Seller · Growth',
    dealAmount: '$8,400',
    dealLabel: 'deal size',
  },
  {
    badge: 'pro',
    text: '"Bought a content site for $3.2k and it\'s already cash-flowing. Managed hosting is incredible — never touched a server config."',
    avatarBg: 'linear-gradient(135deg,#38bdf8,#818cf8)',
    avatarLetter: 'S',
    name: 'Sofia K.',
    sub: 'Site Buyer · Pro',
    dealAmount: '$3,200',
    dealLabel: 'deal size',
  },
  {
    badge: 'starter',
    text: '"Listed 3 sites in one week. Starter plan paid for itself on my first deal. Analytics show me exactly which buyers viewed each listing."',
    avatarBg: 'linear-gradient(135deg,#34d399,#38bdf8)',
    avatarLetter: 'A',
    name: 'Alex T.',
    sub: 'Indie Hacker · Starter',
    dealAmount: '$5,700',
    dealLabel: '3 deals',
  },
  {
    badge: 'pro',
    text: '"Pro plan paid for itself in 3 weeks. 5% platform fee vs 30%? That\'s a no-brainer. I run all my flips through Siterifty now."',
    avatarBg: 'linear-gradient(135deg,#fbbf24,#818cf8)',
    avatarLetter: 'J',
    name: 'Jamie L.',
    sub: 'Serial Seller · Pro',
    dealAmount: '$22k+',
    dealLabel: 'total sold',
  },
  {
    badge: 'starter',
    text: '"Got my first offer within 48 hours of listing. The buyer communication tools are top notch — everything stays on-platform, no email chaos."',
    avatarBg: 'linear-gradient(135deg,#818cf8,#38bdf8)',
    avatarLetter: 'R',
    name: 'Raj P.',
    sub: 'Blog Seller · Starter',
    dealAmount: '$4,100',
    dealLabel: 'deal size',
  },
];

export const ROW2_REVIEWS = [
  {
    badge: 'pro',
    text: '"The AI valuation tool gave me a realistic price before listing. Ended up selling for $12k — 2.8× revenue. Couldn\'t be happier."',
    avatarBg: 'linear-gradient(135deg,#818cf8,#fbbf24)',
    avatarLetter: 'N',
    name: 'Nina W.',
    sub: 'Newsletter · Pro',
    dealAmount: '$12,000',
    dealLabel: 'deal size',
  },
  {
    badge: 'starter',
    text: '"As a first-time buyer this platform made the whole process understandable. The escrow held my funds safely and I felt protected every step."',
    avatarBg: 'linear-gradient(135deg,#34d399,#a855f7)',
    avatarLetter: 'D',
    name: 'David C.',
    sub: 'First-time buyer',
    dealAmount: '$6,500',
    dealLabel: 'deal size',
  },
  {
    badge: 'pro',
    text: '"Flipped 6 micro-SaaS products in 90 days. The wallet system means I can instantly re-invest proceeds without waiting for bank transfers."',
    avatarBg: 'linear-gradient(135deg,#818cf8,#818cf8)',
    avatarLetter: 'K',
    name: 'Kenji M.',
    sub: 'Portfolio Builder · Pro',
    dealAmount: '$61k',
    dealLabel: '6 deals',
  },
  {
    badge: 'starter',
    text: '"The listing quality here is miles above Flippa. Every site has real metrics, no fake traffic. I found my acquisition in under 2 hours."',
    avatarBg: 'linear-gradient(135deg,#fbbf24,#34d399)',
    avatarLetter: 'L',
    name: 'Lena F.',
    sub: 'Strategic Buyer',
    dealAmount: '$18,500',
    dealLabel: 'deal size',
  },
  {
    badge: 'pro',
    text: '"Support team resolved my transfer question in 20 minutes via chat. The AI assistant even walked me through the domain transfer steps live."',
    avatarBg: 'linear-gradient(135deg,#38bdf8,#34d399)',
    avatarLetter: 'T',
    name: 'Tom H.',
    sub: 'eCommerce Buyer · Pro',
    dealAmount: '$9,200',
    dealLabel: 'deal size',
  },
];

// Rating distribution for the aggregate bar chart (5-star down to 1-star)
export const RATING_BARS = [
  { stars: 5, pct: 88, gradient: null },
  { stars: 4, pct: 9, gradient: 'linear-gradient(90deg,#818cf8,#a855f7)' },
  { stars: 3, pct: 2, gradient: 'rgba(255,255,255,0.2)' },
  { stars: 2, pct: 1, gradient: 'rgba(255,255,255,0.1)' },
  { stars: 1, pct: 0, gradient: null },
];
