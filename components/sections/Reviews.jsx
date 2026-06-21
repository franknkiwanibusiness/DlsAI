'use client';

import useRevealSection from '@/lib/useRevealSection';
import { STARS_5, ROW1_REVIEWS, ROW2_REVIEWS, RATING_BARS } from './reviewsData';

function ReviewCard({ review, hidden }) {
  return (
    <div className="review-card" aria-hidden={hidden || undefined}>
      <div className="review-card-top">
        <div className="review-stars">{STARS_5.map((s, i) => <span key={i}>{s}</span>)}</div>
        <span className={`review-plan-badge ${review.badge}`}>
          {review.badge === 'pro' ? 'Pro' : 'Starter'}
        </span>
      </div>
      <p className="review-text">{review.text}</p>
      <div className="review-divider" />
      <div className="review-author">
        <div className="review-avatar" style={{ background: review.avatarBg }}>{review.avatarLetter}</div>
        <div>
          <div className="review-name">{review.name}</div>
          <div className="review-sub">{review.sub}</div>
        </div>
        <div className="review-deal-tag">
          <span className="review-deal-amount">{review.dealAmount}</span>
          <span className="review-deal-label">{review.dealLabel}</span>
        </div>
      </div>
    </div>
  );
}

export default function Reviews() {
  const { ref, isVisible } = useRevealSection();

  return (
    <div
      ref={ref}
      className={`reviews-section reveal-section${isVisible ? ' is-visible' : ''}`}
      id="reviewsSection"
    >
      <div className="reviews-header">
        <p className="reviews-label reveal-fade" style={{ '--reveal-delay': '0ms' }}>What sellers &amp; buyers say</p>
        <h2 className="reviews-title reveal-fade" style={{ '--reveal-delay': '80ms' }}>Trusted by thousands of deal-makers</h2>

        {/* Aggregate rating widget */}
        <div className="reviews-agg reveal-fade" style={{ '--reveal-delay': '140ms' }}>
          <span className="reviews-agg-score">4.9</span>
          <div className="reviews-agg-detail">
            <div className="reviews-agg-stars">{STARS_5.map((s, i) => <span key={i}>{s}</span>)}</div>
            <span className="reviews-agg-count">2,400+ verified reviews</span>
          </div>
          <div className="reviews-bars">
            {RATING_BARS.map((bar) => (
              <div className="reviews-bar-row" key={bar.stars}>
                <span className="reviews-bar-label">{bar.stars}</span>
                <div className="reviews-bar-track">
                  <div
                    className="reviews-bar-fill"
                    style={{ width: `${bar.pct}%`, ...(bar.gradient ? { background: bar.gradient } : {}) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 1 — scrolls left */}
      <div className="reviews-track-wrap">
        <div className="reviews-track" id="reviewsTrack">
          {ROW1_REVIEWS.map((r, i) => <ReviewCard key={`r1-${i}`} review={r} />)}
          {/* Duplicates for seamless loop */}
          {ROW1_REVIEWS.map((r, i) => <ReviewCard key={`r1-dup-${i}`} review={r} hidden />)}
        </div>
      </div>

      {/* Row 2 — scrolls right */}
      <div className="reviews-track-wrap">
        <div className="reviews-track reviews-track-r">
          {ROW2_REVIEWS.map((r, i) => <ReviewCard key={`r2-${i}`} review={r} />)}
          {/* Duplicates row 2 */}
          {ROW2_REVIEWS.map((r, i) => <ReviewCard key={`r2-dup-${i}`} review={r} hidden />)}
        </div>
      </div>
    </div>
  );
}
