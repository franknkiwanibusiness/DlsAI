export default function PlanCheckIcon({ stroke = 'rgba(255,255,255,0.35)', checkStroke = 'rgba(255,255,255,0.55)' }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="5.5" stroke={stroke} strokeWidth="1.1" />
      <path d="M4 6.5l1.8 1.8 3.2-3.2" stroke={checkStroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
