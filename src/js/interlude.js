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

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    lines.forEach(l => (l.style.transform = 'translateY(0)'));
    if (accentLine) accentLine.style.transform = 'scaleX(1)';
    section.classList.add('is-visible');
    return;
  }

  gsap.set(lines, { y: '115%' });
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
    stagger: 0.13,
    duration: 0.95,
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
