import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'Siterifty — Buy & Sell Small Websites | Cheap Websites For Sale | Indie Hacker Marketplace',
  description:
    'Siterifty.com — Buy & Sell Small Websites, Web Templates & Online Businesses. Free to List. Instant Escrow. Reach 10,000+ buyers worldwide and close deals fast.',
  keywords:
    'Siterifty, buy and sell websites, buy small websites, sell small websites, cheap websites for sale, buy cheap websites, affordable websites for sale, small website marketplace, indie hacker marketplace, indie hackers buy website, indie hackers sell website, web templates for sale, buy web templates, sell web templates, website templates marketplace, buy and sell web templates, indie site marketplace, buy indie sites, sell indie sites, micro SaaS for sale, buy micro SaaS, sell micro SaaS, SaaS marketplace, buy online business, sell online business, website marketplace, website broker, website flipping, site flipping, flip websites, buy a website, sell a website, buy blog, sell blog, blog for sale, buy SaaS, sell SaaS, ecommerce site for sale, buy ecommerce site, affiliate site for sale, newsletter for sale, buy newsletter, content site for sale, niche website for sale, buy niche website, domain and website marketplace, online business for sale, digital asset marketplace, website acquisition, website valuation, buy starter sites, sell starter sites, buy side project, sell side project, bootstrapped startup for sale, buy bootstrapped startup, indie developer marketplace, website trading platform, buy sell sites, web app for sale, buy web app, sell web app',
  authors: [{ name: 'Siterifty' }],
  robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  alternates: {
    canonical: 'https://siterifty.com/',
  },
  openGraph: {
    type: 'website',
    url: 'https://siterifty.com/',
    title: 'Siterifty — Buy & Sell Small Websites | Cheap Websites For Sale | Indie Hacker Marketplace',
    description:
      'Buy & Sell Small Websites, Web Templates & Online Businesses on Siterifty. Free to List. Instant Escrow. Reach 10,000+ qualified buyers worldwide and close deals fast.',
    siteName: 'Siterifty',
    locale: 'en_US',
    images: [
      {
        url: 'https://i.imgur.com/n5LhUiV.jpeg',
        width: 1200,
        height: 630,
        alt: 'Siterifty — Buy and Sell Small Websites & Web Templates Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@siterifty',
    creator: '@siterifty',
    title: 'Siterifty — Buy & Sell Small Websites | Indie Hacker Marketplace',
    description:
      'Buy & Sell Small Websites, Web Templates & Online Businesses. Free to List. Instant Escrow. 10,000+ buyers worldwide. Siterifty.',
    images: ['https://i.imgur.com/n5LhUiV.jpeg'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#060f08',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Structured data — WebSite + Organization + WebPage + ItemList + FAQPage + ImageObject */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://siterifty.com/#website",
                  "url": "https://siterifty.com/",
                  "name": "Siterifty",
                  "alternateName": ["Siterifty Marketplace", "Siterifty.com", "Indie Website Marketplace", "Small Website Marketplace"],
                  "description": "The #1 marketplace to buy and sell small websites, web templates, micro SaaS, and online businesses.",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": { "@type": "EntryPoint", "urlTemplate": "https://siterifty.com/browse?q={search_term_string}" },
                    "query-input": "required name=search_term_string"
                  },
                  "inLanguage": "en-US"
                },
                {
                  "@type": "Organization",
                  "@id": "https://siterifty.com/#organization",
                  "name": "Siterifty",
                  "url": "https://siterifty.com/",
                  "logo": { "@type": "ImageObject", "url": "https://i.imgur.com/8EEl86u.jpeg", "width": 512, "height": 512 },
                  "sameAs": ["https://twitter.com/siterifty", "https://x.com/siterifty"]
                },
                {
                  "@type": "WebPage",
                  "@id": "https://siterifty.com/#webpage",
                  "url": "https://siterifty.com/",
                  "name": "Siterifty — Buy & Sell Small Websites | Cheap Websites For Sale | Indie Hacker Marketplace",
                  "isPartOf": { "@id": "https://siterifty.com/#website" },
                  "about": { "@id": "https://siterifty.com/#organization" },
                  "inLanguage": "en-US"
                }
              ]
            })
          }}
        />
        {/* Resource hints */}
        <link rel="icon" type="image/jpeg" href="https://i.imgur.com/8EEl86u.jpeg" />
        <link rel="shortcut icon" href="https://i.imgur.com/8EEl86u.jpeg" />
        <link rel="apple-touch-icon" href="https://i.imgur.com/8EEl86u.jpeg" />
        <link rel="preload" as="image" href="https://i.imgur.com/n5LhUiV.jpeg" />
        <link rel="preload" as="image" href="https://i.imgur.com/8EEl86u.jpeg" fetchPriority="low" />
        <link rel="preconnect" href="https://i.imgur.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebasedatabase.app" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;700;800&family=DM+Sans:wght@300;400;500&family=Plus+Jakarta+Sans:wght@700;800&family=Montserrat:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="alternate" hrefLang="en" href="https://siterifty.com/" />
        <link rel="alternate" hrefLang="x-default" href="https://siterifty.com/" />
      </head>
      <body className="loader-lock">
        {children}

        {/*
          Load order matters:
          1. PayPal SDK first (beforeInteractive) so it's ready when firebase.js init runs
          2. firebase.js (module, afterInteractive) — sets window._fbDb, _fbAuth, etc.
          3. script.js (afterInteractive) — reads those globals
        */}
        <Script
          id="paypalCaptureSDK"
          src="https://www.paypal.com/sdk/js?client-id=AW7nmsZqdabjCrj62j0qekUqalJJ3T53ngjrime14foH5HMhNLmpUzULQV-OvV82KSuZQoBoEP4Rkwi4&currency=USD&intent=capture&components=buttons"
          data-namespace="paypalCapture"
          data-sdk-integration-source="button-factory"
          strategy="beforeInteractive"
        />
        <Script type="module" src="/firebase.js" strategy="afterInteractive" />
        <Script src="/script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
