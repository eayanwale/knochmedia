/*
  frame.js — Scroll-driven studio section (KNOCH-008)
  ====================================================
  The section is 150vh tall with a CSS sticky panel. A single GSAP
  timeline is scrubbed across the 50vh of pin travel (start: top top,
  end: bottom top), mapping scroll to animation progress:

    0–100 %   BG scales 1.6 → 1.0 (dramatic pull-back) + drifts up
    0– 20 %   Meta label fades in
    5– 50 %   Headline lines clip up from below + blur clears (focus reveal)
   55– 75 %   Stat 1 counts up (scrubbed) + label fades in
   65– 85 %   Stat 2 counts up + label fades in
   75– 95 %   Stat 3 counts up + label fades in

  prefers-reduced-motion: final values shown instantly, no animation.
*/

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initFrame() {
  const section  = document.querySelector('.pinned-frame');
  if (!section) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const bg       = section.querySelector('.bg');
  const metaTag  = section.querySelector('.meta-tag');
  const bigEl    = section.querySelector('.big');
  const statNums = gsap.utils.toArray('.pinned-frame .stat .n');
  const statLbls = gsap.utils.toArray('.pinned-frame .stat .l');

  statNums.forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    if (!target) return;
    const hasEm = !!el.querySelector('em');
    el.innerHTML = hasEm ? `<em>${target.toLocaleString()}</em>` : target.toLocaleString();
  });

  if (prefersReduced) return;

  const lines = bigEl ? Array.from(bigEl.querySelectorAll('.frame-line')) : [];

  gsap.set(metaTag, { opacity: 0, y: 10 });
  gsap.set(lines,   { y: '115%', filter: 'blur(12px)' });
  statNums.forEach(el => {
    const hasEm = !!el.querySelector('em');
    el.innerHTML = hasEm ? '<em>0</em>' : '0';
  });
  gsap.set(statLbls, { opacity: 0 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });

  /* BG: dramatic scale pull-back — entire scroll range */
  tl.fromTo(bg,
    { scale: 1.6, yPercent: 0 },
    { scale: 1.0, yPercent: -10, ease: 'none', duration: 1 },
    0
  );

  /* Meta label */
  tl.to(metaTag, { opacity: 1, y: 0, ease: 'expo.out', duration: 0.2 }, 0);

  /* Headline: clip-slide-up + blur-to-sharp (depth-of-field focus reveal) */
  if (lines.length) {
    tl.to(lines, {
      y: '0%',
      filter: 'blur(0px)',
      ease: 'expo.out',
      stagger: 0.08,
      duration: 0.18,
    }, 0.05);
  }

  /* Stat counters: scrubbed count-up, tighter range than before */
  statNums.forEach((el, i) => {
    const target = parseInt(el.dataset.count, 10);
    if (!target) return;

    const hasEm = !!el.querySelector('em');
    const proxy = { v: 0 };
    const start = 0.55 + i * 0.1;   /* 0.55, 0.65, 0.75 */

    tl.fromTo(proxy,
      { v: 0 },
      {
        v: target,
        ease: 'none',
        duration: 0.2,
        onUpdate() {
          const n = Math.round(proxy.v).toLocaleString();
          el.innerHTML = hasEm ? `<em>${n}</em>` : n;
        },
      },
      start
    );

    if (statLbls[i]) {
      tl.fromTo(statLbls[i],
        { opacity: 0 },
        { opacity: 1, ease: 'none', duration: 0.08 },
        start
      );
    }
  });
}
