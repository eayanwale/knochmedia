/*
  testimonial.js — Scroll-stagger reveal for the editorial pull-quote (KNOCH-009)
  ================================================================================
  Animates the three direct children of .testimonial in sequence:
    1. .testimonial-mark  (decorative opening quote mark)
    2. .testimonial-quote (the pull-quote paragraph)
    3. .testimonial-attr  (attribution line)

  Design decisions:
  - gsap.from() on '.testimonial > *' targets all three direct children in
    DOM order, letting GSAP handle the stagger automatically. This means
    KNOCH-024 can add or reorder children without touching this module.
  - trigger start: 'top 75%' fires when the top of the section is 75% down
    the viewport, so the animation begins just as the section scrolls into
    comfortable reading view — not too early (jarring) or too late (missed).
  - expo.out easing matches the hero reveal and interlude animations,
    maintaining a consistent deceleration feel across the page.
  - once: true prevents the animation from replaying on scroll-up/scroll-down
    loops — the quote should feel like a single deliberate reveal.
  - prefers-reduced-motion guard: exits early so no GSAP animations are
    registered. CSS (testimonial.css) already resets opacity/transform for
    reduced-motion users, so the section remains fully readable either way.
*/

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initTestimonial() {
  const section = document.querySelector('.testimonial');
  if (!section) return;

  /* Bail out for users who prefer reduced motion. The CSS already
     keeps children at their final visible state, so no animation needed. */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.from('.testimonial > *', {
    y: 40,
    opacity: 0,
    duration: 1.2,
    stagger: 0.15,
    ease: 'expo.out',
    scrollTrigger: {
      trigger: '.testimonial',
      start: 'top 75%',
      once: true,   /* fire once — the testimonial is a deliberate single reveal */
    },
  });
}
