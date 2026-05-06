/*
  frame.js — Scroll-driven studio section (KNOCH-008)
  ====================================================
  The section is 200vh tall with a CSS sticky panel. A single GSAP
  timeline is pinned to the full 200vh scroll range (scrub: 0.8), so
  every stage below maps directly to scroll position:

    0 %–100 %  BG scales 1.25 → 1.0 and drifts up  (full range)
    0 %– 20 %  Meta label fades in
    5 %– 55 %  Headline words stagger in, left → right
   50 %– 80 %  Stat 1 counts up (scrubbed) + label fades
   60 %– 90 %  Stat 2 counts up + label fades
   70 %–100 %  Stat 3 counts up + label fades

  prefers-reduced-motion: final values shown instantly, no animation.
*/

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ── Helpers ──────────────────────────────────────────────── */

/* Split an element's childNodes into individual word <span>s.
   Inline elements (em, strong) are treated as one word unit so
   italic amber styling is preserved. Returns the word spans array. */
function splitWords(el) {
  const fragments = [];

  el.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.split(/(\s+)/).forEach(part => {
        if (/\S/.test(part)) {
          const span = document.createElement('span');
          span.className = 'frame-word';
          span.textContent = part;
          fragments.push({ el: span, space: false });
        } else if (part) {
          fragments.push({ el: document.createTextNode(part), space: true });
        }
      });
    } else {
      const span = document.createElement('span');
      span.className = 'frame-word';
      span.appendChild(node.cloneNode(true));
      fragments.push({ el: span, space: false });
    }
  });

  el.innerHTML = '';
  fragments.forEach(f => el.appendChild(f.el));
  return fragments.filter(f => !f.space).map(f => f.el);
}

/* ── Main init ────────────────────────────────────────────── */

export function initFrame() {
  const section  = document.querySelector('.pinned-frame');
  if (!section) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const bg         = section.querySelector('.bg');
  const metaTag    = section.querySelector('.meta-tag');
  const bigEl      = section.querySelector('.big');
  const stripTrack = section.querySelector('.frame-strip-track');
  const statNums   = gsap.utils.toArray('.pinned-frame .stat .n');
  const statLbls   = gsap.utils.toArray('.pinned-frame .stat .l');

  /* Ensure counters always read their final value as the baseline.
     On the animated path these get reset to 0 below; on the reduced-
     motion path this is the only write that happens. */
  statNums.forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    if (!target) return;
    const hasEm = !!el.querySelector('em');
    el.innerHTML = hasEm ? `<em>${target.toLocaleString()}</em>` : target.toLocaleString();
  });

  if (prefersReduced) return;

  /* Word-split the headline for per-word scrubbed reveal */
  const words = bigEl ? splitWords(bigEl) : [];

  /* Set all animated elements to their initial (hidden) state */
  gsap.set(metaTag, { opacity: 0, y: 14 });
  gsap.set(words,   { opacity: 0, y: 22 });
  statNums.forEach(el => {
    const hasEm = !!el.querySelector('em');
    el.innerHTML = hasEm ? '<em>0</em>' : '0';
  });
  gsap.set(statLbls, { opacity: 0 });

  /* ── Main scroll-driven timeline ──────────────────────── */

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom top',   /* full 200vh travel */
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });

  /* BG: dramatic scale-in + gentle upward drift — entire scroll range */
  tl.fromTo(bg,
    { scale: 1.25, yPercent: 0 },
    { scale: 1.0,  yPercent: -10, ease: 'none', duration: 1 },
    0
  );

  /* Contact-sheet strip: drifts counter-scroll (right → left) across full range.
     Uses invalidateOnRefresh via x function so the travel distance recalculates
     if the window is resized. */
  if (stripTrack) {
    tl.fromTo(stripTrack,
      { x: 0 },
      { x: () => -(stripTrack.scrollWidth * 0.22), ease: 'none', duration: 1 },
      0
    );
  }

  /* Meta label: 0 %→ 20 % */
  tl.to(metaTag, { opacity: 1, y: 0, ease: 'expo.out', duration: 0.2 }, 0);

  /* Headline words: 5 %→~55 % (stagger 0.05 × word count + 0.15 each) */
  if (words.length) {
    tl.to(words, {
      opacity: 1, y: 0,
      ease: 'expo.out',
      stagger: 0.05,
      duration: 0.15,
    }, 0.05);
  }

  /* Stat counters: scroll-scrubbed, staggered across 50 %→100 % */
  statNums.forEach((el, i) => {
    const target = parseInt(el.dataset.count, 10);
    if (!target) return;

    const hasEm = !!el.querySelector('em');
    const proxy = { v: 0 };
    const start = 0.5 + i * 0.1;   /* 0.5, 0.6, 0.7 */

    tl.fromTo(proxy,
      { v: 0 },
      {
        v: target,
        ease: 'none',
        duration: 0.3,
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
        { opacity: 1, ease: 'none', duration: 0.1 },
        start
      );
    }
  });
}
