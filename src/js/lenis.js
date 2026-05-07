import Lenis from 'lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis = null;

/**
 * Call once, after the intro loader finishes (KNOCH-005).
 * Skips entirely on touch/mobile — native scroll is faster there.
 * Also skips under prefers-reduced-motion (KNOCH-021) — Lenis's
 * easing-driven smooth scroll is exactly the kind of motion that
 * vestibular-sensitive users opt out of, so we hand back to native
 * scroll. ScrollTrigger then reads native scrollY directly (no
 * proxy installed below), and the per-module GSAP entrance gates
 * already skip their own animations under the same media query.
 */
export function initLenis() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    autoRaf: false,
  });

  // Drive Lenis from GSAP's RAF — single rAF loop for both systems
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  // Disable lag compensation — without this GSAP fires catch-up frames
  // that cause visible jitter during fast wheel events
  gsap.ticker.lagSmoothing(0);

  // Proxy so ScrollTrigger reads scroll position through Lenis's
  // animated value rather than the raw DOM scroll offset
  ScrollTrigger.scrollerProxy(document.body, {
    scrollTop(value) {
      if (arguments.length && lenis) {
        lenis.scrollTo(value, { immediate: true });
      }
      return lenis ? lenis.scroll : window.scrollY;
    },
    getBoundingClientRect() {
      return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    },
  });

  // Notify ScrollTrigger on every Lenis tick so pinned sections stay locked
  lenis.on('scroll', ScrollTrigger.update);

  // Recalculate all ScrollTrigger start/end positions now that the Lenis
  // proxy is live. Any triggers registered before initLenis() (testimonial,
  // frame, interlude — registered at Sanity fetch time, ~200ms before this)
  // had positions measured against native scroll. This corrects them all.
  ScrollTrigger.refresh();
}

/** Returns the Lenis instance (null on touch devices or before init). */
export function getLenis() {
  return lenis;
}

/**
 * Pause Lenis — called by KNOCH-007 (horizontal reel) onEnter.
 * Prevents smooth-scroll from fighting the pinned section's own scroll hijack.
 */
export function stopLenis() {
  lenis?.stop();
}

/**
 * Resume Lenis — called by KNOCH-007 onLeave / onLeaveBack.
 */
export function startLenis() {
  lenis?.start();
}

/**
 * Smooth-scroll to a target element or Y offset.
 * Used by nav anchor links instead of native <a href="#id"> behavior.
 * Falls back to scrollIntoView on touch devices where Lenis is absent.
 *
 * @param {string|Element|number} target - CSS selector, DOM element, or pixel offset
 * @param {object} options - Lenis scrollTo options (merged over defaults)
 */
export function scrollTo(target, options = {}) {
  if (lenis) {
    /* Resume Lenis before issuing a programmatic scroll. Sections
       that hijack the wheel for their own paging (testimonial.js
       pauses Lenis on enter ≥ 60 %, KNOCH-007 reel pauses during
       its pinned timeline) intend that pause to apply to wheel
       gestures only. Without this, clicking the logo or a nav
       anchor while the visitor is mid-testimonial silently no-ops
       until the section's IntersectionObserver eventually resumes
       Lenis on its own — chrome navigation should always win. */
    lenis.start();
    lenis.scrollTo(target, {
      duration: 1.5,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      ...options,
    });
  } else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior: 'smooth' });
  }
}
