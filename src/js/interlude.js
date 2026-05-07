/**
 * KNOCH-006 — Interlude / Manifesto Section
 *
 * Three pre-split lines in .interlude-line-wrap/.interlude-line elements
 * slide up from below their overflow:hidden clip containers. An amber
 * underline sweeps across "beautiful." once the lines are in place.
 *
 * All devices use ScrollTrigger (toggleActions, not scrub) so the reveal
 * plays at full speed when the section enters view — no mobile branch needed.
 *
 * prefers-reduced-motion: lines snap to final position immediately.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initInterlude() {
  const section = document.querySelector('.interlude');
  if (!section) return;

  const lines      = section.querySelectorAll('.interlude-line');
  const accentLine = section.querySelector('.interlude-accent-line');
  const stripTrack = section.querySelector('.interlude-strip-track');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile       = window.matchMedia('(max-width: 800px)').matches;

  /* ── Strip scroll-reactive ──────────────────────────────────────────────
     Scroll down → strip drifts right (x: -600 → 0).
     Scroll up  → strip drifts left  (x: 0 → -600).
     scrub: 1.2 gives a smooth lag that reads as physical weight.
     fromTo so GSAP owns the initial position — no CSS starting offset needed.
     KNOCH-020: skip on mobile - Lenis is off (touch device), so scrub
     against native scroll feels janky on iOS rubber-band. The strip
     animates via its CSS marquee instead which gives the same
     ambient drift without the scroll-tied tween. */
  if (stripTrack && !prefersReduced && !isMobile) {
    gsap.fromTo(stripTrack,
      { x: -600 },
      {
        x: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      }
    );
  } else if (stripTrack) {
    gsap.set(stripTrack, { x: -300 }); /* reduced-motion / mobile: static midpoint */
  }

  if (prefersReduced) {
    lines.forEach(l => { l.style.transform = 'translateY(0)'; l.style.filter = 'none'; });
    if (accentLine) accentLine.style.transform = 'scaleX(1)';
    section.classList.add('is-visible');
    return;
  }

  /* Lines start below clip AND out-of-focus — blur clears as they rise,
     like a lens pulling focus on text emerging from negative space. */
  gsap.set(lines, { y: '115%', filter: 'blur(14px)', letterSpacing: '0.12em' });
  if (accentLine) gsap.set(accentLine, { scaleX: 0 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 75%',
      toggleActions: 'play none none none',
      onEnter: () => section.classList.add('is-visible'),
    },
  });

  tl.to(lines, {
    y: '0%',
    filter: 'blur(0px)',
    letterSpacing: '-0.015em',
    stagger: 0.16,
    duration: 1.1,
    ease: 'expo.out',
  }, 0);

  if (accentLine) {
    tl.to(accentLine, {
      scaleX: 1,
      duration: 0.7,
      ease: 'expo.out',
    }, 0.48);
  }
}
