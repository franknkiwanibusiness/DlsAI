'use client';

import { useEffect, useRef } from 'react';

const PALETTE = ['168,85,247', '129,140,248', '56,189,248', '129,140,248', '52,211,153'];

function makeParticle(W, H) {
  const p = {};
  function reset() {
    p.x = Math.random() * W;
    p.y = Math.random() * H;
    p.r = Math.random() * 1.4 + 0.3;
    p.vx = (Math.random() - 0.5) * 0.3;
    p.vy = -Math.random() * 0.5 - 0.1;
    p.alpha = Math.random() * 0.5 + 0.1;
    p.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  }
  p.reset = reset;
  reset();
  p.y = Math.random() * H; // start distributed, not all at bottom
  return p;
}

/**
 * Mirrors the original CTA particle field: a lightweight rising-particle
 * canvas animation that only runs while the section is scrolled into view
 * (paused via cancelAnimationFrame otherwise, for perf).
 *
 * Usage: const { canvasRef, sectionRef } = useCtaParticles();
 */
export default function useCtaParticles() {
  const canvasRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext('2d');
    let W, H, particles = [], raf;

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function init() {
      particles = Array.from({ length: 70 }, () => makeParticle(W, H));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -4 || p.x < -4 || p.x > W + 4) p.reset();
      });
      raf = requestAnimationFrame(draw);
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            resize();
            init();
            draw();
          } else {
            cancelAnimationFrame(raf);
          }
        });
      },
      { threshold: 0.05 }
    );
    io.observe(section);

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return { canvasRef, sectionRef };
}
