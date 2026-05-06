/*
  about.js — About / Story page interactions (KNOCH-013)
  =======================================================
  Three responsibilities:

  1. Hero entrance reveal — meta / headline / sub-text fade up in a
     short timeline so the page doesn't snap into existence on load.

  2. Chapter sync — IntersectionObserver on the right column's
     <figure data-image="N"> elements. The matching .chapter[data-chapter="N"]
     in the sticky left column gets a .active class while its image is
     >= 50% in view. Only one chapter is .active at a time so the amber
     highlight reads as a single moving accent rather than a column of
     equally-bright headings.

     Image 5 maps to chapter 4 — the page has 5 photos but only 4 narrative
     chapters, so the final image keeps chapter 4 lit while the user reads
     the closing paragraph and lands on the stats section.

  3. Stat counters — three numerals in the "By the numbers" row tween
     from 0 to their data-count target on first scroll-in. Reuses the
     proxy-tween pattern from KNOCH-008's frame counters.

  prefers-reduced-motion: skips the hero timeline and snaps stats to
  their final values; the chapter sync is kept (it's a colour toggle
  with a CSS transition that the @media block already disables).
*/

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initAbout() {
  /* Page guard — bail if we're not on the about page. Lets this module
     be safely imported from a shared entry that might also load on
     index.html in future. */
  const aboutHero = document.querySelector('.about-hero');
  if (!aboutHero) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Hero entrance ──────────────────────────────────────── */

  if (!prefersReduced) {
    const heroMeta     = aboutHero.querySelector('.about-hero-meta');
    const heroHeadline = aboutHero.querySelector('.about-hero-headline');
    const heroSub      = aboutHero.querySelector('.about-hero-sub');

    /* Set initial off-state before the timeline starts so the elements
       don't flash in their final position before GSAP kicks in. */
    gsap.set([heroMeta, heroSub].filter(Boolean), { opacity: 0, y: 18 });
    gsap.set(heroHeadline, { opacity: 0, y: 40 });

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    if (heroMeta)     tl.to(heroMeta,     { opacity: 1, y: 0, duration: 0.8 }, 0);
    if (heroHeadline) tl.to(heroHeadline, { opacity: 1, y: 0, duration: 1.0 }, 0.15);
    if (heroSub)      tl.to(heroSub,      { opacity: 1, y: 0, duration: 0.7 }, 0.5);
  }

  /* ── 2. Chapter sync ───────────────────────────────────────── */

  const images   = document.querySelectorAll('.about-image[data-image]');
  const chapters = document.querySelectorAll('.chapter[data-chapter]');

  if (images.length && chapters.length) {
    /* Map "N" → .chapter element for O(1) lookup inside the IO callback. */
    const chapterMap = new Map();
    chapters.forEach(ch => chapterMap.set(ch.dataset.chapter, ch));

    /* Threshold 0.5 — chapter activates when its paired image is at least
       half visible. Lower would activate too eagerly and bounce as the
       user scrolls past short images; higher would leave dead zones
       between images where no chapter is highlighted. */
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.dataset.image;
        const chapter = chapterMap.get(id);
        if (!chapter) return;
        chapters.forEach(c => c.classList.remove('active'));
        chapter.classList.add('active');
      });
    }, { threshold: 0.5 });

    images.forEach(img => io.observe(img));

    /* Initial state — make sure chapter 1 starts active even before the
       first scroll event fires. Otherwise the page loads with all chapters
       at 0.45 opacity until the user moves the wheel. */
    const first = chapterMap.get('1');
    if (first) first.classList.add('active');
  }

  /* ── 3. Stat counters ──────────────────────────────────────── */

  const stats = document.querySelectorAll('.about-stat-n[data-count]');
  stats.forEach(stat => {
    const target = parseInt(stat.dataset.count, 10);
    if (!Number.isFinite(target)) return;

    /* Preserve the optional <em> wrap so the amber italic styling on the
       1st and 3rd stats survives the textContent rewrite during tween. */
    const hasEm = !!stat.querySelector('em');
    const wrap  = (n) => {
      const fmt = n.toLocaleString();
      return hasEm ? `<em>${fmt}</em>` : fmt;
    };

    if (prefersReduced) {
      stat.innerHTML = wrap(target);
      return;
    }

    /* Start at zero so the tween is visible from the first frame. */
    stat.innerHTML = wrap(0);

    const proxy = { val: 0 };
    ScrollTrigger.create({
      trigger: stat,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(proxy, {
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => { stat.innerHTML = wrap(Math.ceil(proxy.val)); },
          onComplete: () => { stat.innerHTML = wrap(target); },
        });
      },
    });
  });
}
