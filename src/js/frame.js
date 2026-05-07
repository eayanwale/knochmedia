/*
  frame.js — Scroll-driven studio section (KNOCH-008)
  ====================================================
  150vh section, CSS sticky panel. Two animation layers:

  Layer 1 — scrubbed timeline (scroll-driven):
    0–100 %   BG scales 1.6 → 1.0 (dramatic pull-back) + drifts up
    0– 20 %   Meta label fades in
    5– 50 %   Headline lines clip up from below + blur clears (focus reveal)

  Layer 2 — triggered (plays at full speed, non-scrubbed):
    When scroll progress crosses 0.55, each stat block floats up
    (y 40 → 0) and counts from 0 → target over 1.4 s with expo.out.
    Staggered 0.12 s apart so they arrive in sequence, not all at once.

  prefers-reduced-motion: final values shown instantly.
*/

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initFrame() {
  const section  = document.querySelector('.pinned-frame');
  if (!section) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* KNOCH-041: mobile takes the same static path as prefers-reduced-motion -
     the scrub-tied parallax + count-up was glitching on iOS Safari, sometimes
     leaving stats stuck on 0. Final values are already written above. */
  const isMobile       = window.matchMedia('(max-width: 800px)').matches;

  const bg       = section.querySelector('.bg');
  const metaTag  = section.querySelector('.meta-tag');
  const bigEl    = section.querySelector('.big');
  const statEls  = gsap.utils.toArray('.pinned-frame .stat');
  const statNums = gsap.utils.toArray('.pinned-frame .stat .n');
  const statLbls = gsap.utils.toArray('.pinned-frame .stat .l');

  /* Always write final values as baseline (readable without JS / reduced motion) */
  statNums.forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    if (!target) return;
    const hasEm = !!el.querySelector('em');
    el.innerHTML = hasEm ? `<em>${target.toLocaleString()}</em>` : target.toLocaleString();
  });

  if (prefersReduced || isMobile) return;

  const lines = bigEl ? Array.from(bigEl.querySelectorAll('.frame-line')) : [];

  /* Initial hidden states */
  gsap.set(metaTag, { opacity: 0, y: 10 });
  gsap.set(lines,   { y: '115%', filter: 'blur(12px)' });
  gsap.set(statEls, { opacity: 0, y: 40 });
  statNums.forEach(el => {
    const hasEm = !!el.querySelector('em');
    el.innerHTML = hasEm ? '<em>0</em>' : '0';
  });
  gsap.set(statLbls, { opacity: 0 });

  /* ── Layer 1: scrubbed timeline ─────────────────────────────── */

  let statsPlayed = false;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.8,
      invalidateOnRefresh: true,
      onUpdate(self) {
        if (self.progress >= 0.3 && !statsPlayed) {
          statsPlayed = true;
          playStats();
        } else if (self.progress < 0.15 && statsPlayed) {
          /* Scrolled back above trigger — reset so stats count again on re-entry */
          statsPlayed = false;
          gsap.killTweensOf([...statEls, ...statNums, ...statLbls]);
          gsap.set(statEls, { opacity: 0, y: 40 });
          statNums.forEach(el => {
            const hasEm = !!el.querySelector('em');
            el.innerHTML = hasEm ? '<em>0</em>' : '0';
          });
          gsap.set(statLbls, { opacity: 0 });
        }
      },
    },
  });

  /* BG pull-back */
  tl.fromTo(bg,
    { scale: 1.6, yPercent: 0 },
    { scale: 1.0, yPercent: -10, ease: 'none', duration: 1 },
    0
  );

  /* ── Cursor interactions on .sticky ─────────────────────────────────────
     Two effects share the same mousemove listener:
     1. Magnetic parallax — dark base bg (bg) drifts toward cursor (x/y pixels,
        composing with scrub's scale + yPercent independently).
     2. Spotlight reveal — a second natural-filter image (bgReveal) is masked
        by a radial-gradient that follows the cursor, revealing the actual photo
        in a soft feathered circle while the dark base shows everywhere else.
     KNOCH-041: skipped on touch / coarse pointers. The whole feature is
     mouse-driven; on a phone the .bg-reveal element loads a second copy
     of the studio banner image (~218 KB WebP via image-set) and never
     becomes visible because the mousemove listener never fires.
     Building it on touch was wasted bandwidth + a memory hit. */
  const sticky = section.querySelector('.sticky');
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  if (sticky && !isCoarsePointer) {
    const bgReveal = document.createElement('div');
    bgReveal.className = 'bg-reveal';
    bgReveal.setAttribute('aria-hidden', 'true');
    const overlay = sticky.querySelector('.overlay');
    if (overlay) sticky.insertBefore(bgReveal, overlay);
    else sticky.appendChild(bgReveal);

    const revealPos = { x: 0, y: 0 };

    sticky.addEventListener('mousemove', (e) => {
      const rect = sticky.getBoundingClientRect();
      const xRel = (e.clientX - rect.left) / rect.width  - 0.5;
      const yRel = (e.clientY - rect.top)  / rect.height - 0.5;

      gsap.to(bg, {
        x: xRel * 22,
        y: yRel * 14,
        duration: 1.4,
        ease: 'power2.out',
        overwrite: 'auto',
      });

      gsap.to(revealPos, {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
        onUpdate() {
          const m = `radial-gradient(circle 200px at ${revealPos.x}px ${revealPos.y}px, black 0%, transparent 82%)`;
          bgReveal.style.maskImage = m;
          bgReveal.style.webkitMaskImage = m;
        },
      });

      gsap.to(bgReveal, { opacity: 1, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
    }, { passive: true });

    sticky.addEventListener('mouseleave', () => {
      gsap.to(bg, { x: 0, y: 0, duration: 1.6, ease: 'power2.out', overwrite: 'auto' });
      gsap.to(bgReveal, { opacity: 0, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
    }, { passive: true });
  }

  /* Meta label */
  tl.to(metaTag, { opacity: 1, y: 0, ease: 'expo.out', duration: 0.2 }, 0);

  /* Headline: clip-slide-up + blur focus reveal */
  if (lines.length) {
    tl.to(lines, {
      y: '0%',
      filter: 'blur(0px)',
      ease: 'expo.out',
      stagger: 0.08,
      duration: 0.18,
    }, 0.05);
  }

  /* ── Layer 2: stats — non-scrubbed, full-speed ──────────────── */

  function playStats() {
    /* Float each stat block up with stagger */
    gsap.to(statEls, {
      opacity: 1,
      y: 0,
      stagger: 0.2,
      duration: 1.2,
      ease: 'expo.out',
    });

    /* Count each number up independently */
    statNums.forEach((el, i) => {
      const target = parseInt(el.dataset.count, 10);
      if (!target) return;
      const hasEm = !!el.querySelector('em');
      const proxy = { v: 0 };

      gsap.to(proxy, {
        v: target,
        delay: i * 0.2,
        duration: 2.6,
        ease: 'expo.out',
        onUpdate() {
          const n = Math.round(proxy.v).toLocaleString();
          el.innerHTML = hasEm ? `<em>${n}</em>` : n;
        },
        onComplete() {
          /* Write exact final value to avoid rounding artifacts */
          el.innerHTML = hasEm ? `<em>${target.toLocaleString()}</em>` : target.toLocaleString();
        },
      });

      if (statLbls[i]) {
        gsap.to(statLbls[i], {
          opacity: 1,
          delay: i * 0.2 + 0.3,
          duration: 0.7,
          ease: 'expo.out',
        });
      }
    });
  }
}
