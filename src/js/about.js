/*
  about.js — About / Story page interactions (KNOCH-013, redesigned KNOCH-036)
  =============================================================================
  Four responsibilities:

  1. Hero entrance reveal — meta / headline / sub-text fade up in a
     short timeline so the page doesn't snap into existence on load.

  2. Chapter scroll-in animations — each .about-chapter section gets
     a per-element reveal timeline driven by ScrollTrigger when the
     section enters the viewport. Label fades up, title clip-wipes
     in (or splits into per-character cascade matching the homepage
     reel intro pattern), body text words stagger in, bg image
     scales down slightly for a "settle into frame" effect.

     The chapters are full-bleed sections (KNOCH-036 redesign)
     replacing the previous sticky-text + scrolling-images split.
     Each section is 100vh tall, so reveals happen as the visitor
     scrolls section-to-section.

  3. Stat counters — three numerals in the "By the numbers" row tween
     from 0 to their data-count target on first scroll-in. Reuses the
     proxy-tween pattern from KNOCH-008's frame counters.

  4. Process step reveals — the three "How we work" steps get a
     simple fade-up stagger when the section scrolls into view.

  prefers-reduced-motion: skips all entrance timelines and stat tweens.
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

  /* ── 1b. Intro paragraph parallax ──────────────────────────── */

  /* The studio statement under the hero floats slightly counter to the
     scroll direction so it reads as a separate plane from the rest of
     the page. Subtle — the y range is small but enough to feel like
     parallax depth as the visitor scrolls past. */
  const introBody = document.querySelector('.about-intro-body');
  if (introBody && !prefersReduced) {
    gsap.to(introBody, {
      y: -60,
      ease: 'none',
      scrollTrigger: {
        trigger: '.about-intro',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });
  }

  /* ── 2. Pinned chapter overlay narrative ───────────────────── */

  /* Wrap each chapter body's words in <span class="about-word"> spans so
     the stagger reveal can target individual words. Skipped on reduced
     motion — body text just shows at full opacity in that case. */
  function splitWords(el) {
    if (!el) return [];
    const text = el.textContent;
    el.innerHTML = '';
    const words = [];
    text.split(/(\s+)/).forEach(token => {
      if (/^\s+$/.test(token)) {
        el.appendChild(document.createTextNode(token));
      } else if (token.length) {
        const span = document.createElement('span');
        span.className = 'about-word';
        span.style.display = 'inline-block';
        span.textContent = token;
        el.appendChild(span);
        words.push(span);
      }
    });
    return words;
  }

  const story    = document.querySelector('.about-story');
  const chapters = Array.from(document.querySelectorAll('.about-chapter'));
  const total    = chapters.length;

  if (story && total && !prefersReduced) {
    /* Pin the story container for total × 100vh of scroll. The fade
       tweens below scrub against this same scroll range. */
    ScrollTrigger.create({
      trigger: story,
      start: 'top top',
      end: () => `+=${total * window.innerHeight}px`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    });

    chapters.forEach((chapter, i) => {
      const bg    = chapter.querySelector('.about-chapter-bg');
      const label = chapter.querySelector('.about-chapter-label');
      const title = chapter.querySelector('.about-chapter-title');
      const body  = chapter.querySelector('.about-chapter-body');

      /* Set initial states — chapter 0 starts visible, rest hidden */
      gsap.set(chapter, { opacity: i === 0 ? 1 : 0 });
      if (bg) gsap.set(bg, { scale: 1.12 });
      gsap.set(label, { opacity: 0, y: 16 });
      gsap.set(title, { opacity: 0, y: 30 });
      const words = splitWords(body);
      if (words.length) gsap.set(words, { opacity: 0, y: 12 });

      /* Build a paused reveal timeline for each chapter — text + bg
         settle when this chapter becomes the active layer. */
      const reveal = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
      if (bg)    reveal.to(bg,    { scale: 1, duration: 1.6, ease: 'power3.out' }, 0);
      if (label) reveal.to(label, { opacity: 1, y: 0, duration: 0.7 }, 0.1);
      if (title) reveal.to(title, { opacity: 1, y: 0, duration: 1.0 }, 0.2);
      if (words.length) {
        reveal.to(words, { opacity: 1, y: 0, duration: 0.6, stagger: { amount: 0.6 } }, 0.4);
      }

      /* Each chapter "owns" a 100vh slice of the pinned scroll range.
         Fade-in scrubs across the trailing 30% of the previous slice
         (so the new chapter is fully visible by the time its slice
         starts) and fade-out scrubs across the trailing 30% of its
         own slice (so the next chapter overlays cleanly). */

      const SEG_PX = () => window.innerHeight;

      /* Fade-IN — except the first chapter, which is visible on load */
      if (i > 0) {
        gsap.to(chapter, {
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: story,
            start: () => `top+=${(i * SEG_PX()) - SEG_PX() * 0.4}px top`,
            end:   () => `top+=${i * SEG_PX()}px top`,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      }

      /* Fade-OUT — except the last chapter, which sticks around at the end */
      if (i < total - 1) {
        gsap.to(chapter, {
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: story,
            start: () => `top+=${((i + 1) * SEG_PX()) - SEG_PX() * 0.4}px top`,
            end:   () => `top+=${(i + 1) * SEG_PX()}px top`,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      }

      /* Text reveal trigger — fires once when the chapter's slice
         comes within fade-in range. The reveal timeline plays
         independently of scroll (paused/play model) so the text
         doesn't scrub jitter with cursor scroll position. Reverse
         on leave-back so re-entering chapters re-runs the cascade. */
      ScrollTrigger.create({
        trigger: story,
        start: () => `top+=${(i * SEG_PX()) - SEG_PX() * 0.5}px top`,
        end:   () => `top+=${i * SEG_PX()}px top`,
        onEnter:     () => reveal.play(),
        onEnterBack: () => reveal.play(),
        invalidateOnRefresh: true,
      });
    });

    /* Chapter 0's text isn't behind a scroll trigger because the chapter
       starts visible — fire its reveal on init so the page doesn't open
       with the first chapter blank. */
    const firstReveal = chapters[0]?.dataset?.revealFired;
    if (!firstReveal) {
      const ch0 = chapters[0];
      const bg    = ch0.querySelector('.about-chapter-bg');
      const label = ch0.querySelector('.about-chapter-label');
      const title = ch0.querySelector('.about-chapter-title');
      const words = ch0.querySelectorAll('.about-word');
      const tl0 = gsap.timeline({ defaults: { ease: 'expo.out' } });
      if (bg)    tl0.to(bg,    { scale: 1, duration: 1.6, ease: 'power3.out' }, 0);
      if (label) tl0.to(label, { opacity: 1, y: 0, duration: 0.7 }, 0.1);
      if (title) tl0.to(title, { opacity: 1, y: 0, duration: 1.0 }, 0.2);
      if (words.length) {
        tl0.to(words, { opacity: 1, y: 0, duration: 0.6, stagger: { amount: 0.6 } }, 0.4);
      }
      ch0.dataset.revealFired = '1';
    }
  } else if (prefersReduced) {
    /* Reduced-motion: snap chapters to fully visible state, all stacked.
       Without the pin, they'd just show as overlapping content — accept
       that the section won't tell its story scroll-wise, but at least
       remains readable. */
    chapters.forEach(c => gsap.set(c, { opacity: 1 }));
  }

  /* ── 2b. Process step reveals ──────────────────────────────── */

  /* Three step blocks fade up in stagger when the process section
     enters view. Cheap visual lift that mirrors the homepage section
     reveal vocabulary without adding bespoke timeline complexity. */
  const processSteps = document.querySelectorAll('.about-process-step');
  if (processSteps.length && !prefersReduced) {
    gsap.from(processSteps, {
      opacity: 0,
      y: 30,
      duration: 0.9,
      ease: 'expo.out',
      stagger: 0.12,
      scrollTrigger: {
        trigger: processSteps[0].parentElement,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });
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
