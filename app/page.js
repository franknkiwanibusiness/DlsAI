import Hero from '@/components/sections/Hero';
import FinalCta from '@/components/sections/FinalCta';
import Plans from '@/components/sections/Plans';
import Orbit from '@/components/sections/Orbit';
import Pulse from '@/components/sections/Pulse';
import Flow from '@/components/sections/Flow';
import Ticker from '@/components/sections/Ticker';
import Reviews from '@/components/sections/Reviews';
import PreHero from '@/components/legacy/PreHero';
import PostReviews from '@/components/legacy/PostReviews';

// Render order matches the live site exactly:
//  1. PreHero   — loading screen, bg layer, all auth/ban modals (legacy HTML)
//  2. 8 marketing sections — fully React-componentized (see PROGRESS.md)
//  3. PostReviews — AI valuator, compare, FAQ, plans modals, dashboard,
//                   admin, chat, footer (legacy HTML via dangerouslySetInnerHTML)
export default function HomePage() {
  return (
    <>
      <PreHero />
      <Hero />
      <FinalCta />
      <Plans />
      <Orbit />
      <Pulse />
      <Flow />
      <Ticker />
      <Reviews />
      <PostReviews />
    </>
  );
}
