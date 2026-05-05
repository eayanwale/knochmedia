import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Update these constants when bookings fill or projects are added
const DATES_LEFT = 6;
const TOTAL_PROJECTS = 47;
const TOTAL_FRAMES = 12884;

export function initFrame() {
  const section = document.querySelector('.pinned-frame');
  if (!section) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Parallax: bg drifts up -15% as the section scrolls through the viewport.
  // scrub:1 adds slight lag so the motion reads as weighty, not mechanical.
  if (!prefersReduced) {
    gsap.to('.pinned-frame .bg', {
      yPercent: -15,
      scale: 1.05,
      ease: 'none',
      scrollTrigger: {
        trigger: '.pinned-frame',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });
  }

  // Headline slides up from off-position as it enters the viewport
  gsap.from('.pinned-frame .big', {
    y: 60,
    opacity: 0,
    duration: 1.4,
    ease: 'expo.out',
    scrollTrigger: {
      trigger: '.pinned-frame .big',
      start: 'top 80%',
    },
  });

  // Animated counters — count from 0 → data-count when scrolled into view.
  // once: true prevents re-triggering on scroll-back (the count-up is the payoff).
  gsap.utils.toArray('.pinned-frame .stat .n').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    if (!target) return;

    const hasEm = !!el.querySelector('em');
    const obj = { v: 0 };

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter() {
        gsap.to(obj, {
          v: target,
          duration: 2.2,
          ease: 'power3.out',
          onUpdate() {
            const formatted = Math.round(obj.v).toLocaleString();
            el.innerHTML = hasEm ? `<em>${formatted}</em>` : formatted;
          },
        });
      },
    });
  });
}
