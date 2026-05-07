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
  /* KNOCH-041: mobile takes the same path as prefers-reduced-motion
     across this entire module. The pinned-chapter timeline + stat
     count-up + hero/intro fades all need ScrollTrigger + Lenis
     positioning that on iOS Safari was leaving sections invisible
     or in half-faded states. Mobile gets a static stacked layout
     (CSS handles the position: absolute -> position: relative
     override under @media (max-width: 800px)). */
  const isMobile       = window.matchMedia('(max-width: 800px)').matches;
  const skipMotion     = prefersReduced || isMobile;

  /* ── 1. Hero entrance ──────────────────────────────────────── */

  if (!skipMotion) {
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

  /* ── 1b. Intro paragraph entrance ──────────────────────────── */

  /* The previous build tried a scroll-tied parallax + continuous bob
     on this paragraph, but Lenis-smoothed scroll combined with the
     mixed yPercent/y transforms produced visibly choppy increments.
     Replaced with a single smooth entrance animation — opacity + y
     fade-up when the section enters view, then no further motion. */
  const introBody = document.querySelector('.about-intro-body');
  if (introBody && !skipMotion) {
    gsap.from(introBody, {
      opacity: 0,
      y: 60,
      duration: 2.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.about-intro',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
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

  if (story && total && !skipMotion) {
    /* Reveal timelines per chapter — text settles when the chapter
       becomes the active layer. Paused; played by ScrollTrigger
       callbacks below. */
    const reveals = chapters.map((chapter, i) => {
      const bg    = chapter.querySelector('.about-chapter-bg');
      const label = chapter.querySelector('.about-chapter-label');
      const title = chapter.querySelector('.about-chapter-title');
      const body  = chapter.querySelector('.about-chapter-body');

      /* Initial states — chapter 0 starts visible, others hidden. */
      gsap.set(chapter, { opacity: i === 0 ? 1 : 0 });
      if (bg) gsap.set(bg, { scale: 1.12 });
      gsap.set(label, { opacity: 0, y: 16 });
      gsap.set(title, { opacity: 0, y: 30 });
      const words = splitWords(body);
      if (words.length) gsap.set(words, { opacity: 0, y: 12 });

      const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
      if (bg)    tl.to(bg,    { scale: 1, duration: 1.6, ease: 'power3.out' }, 0);
      if (label) tl.to(label, { opacity: 1, y: 0, duration: 0.7 }, 0.1);
      if (title) tl.to(title, { opacity: 1, y: 0, duration: 1.0 }, 0.2);
      if (words.length) {
        tl.to(words, { opacity: 1, y: 0, duration: 0.6, stagger: { amount: 0.6 } }, 0.4);
      }
      return tl;
    });

    /* Master scrub timeline — pinned to the story container. Owns the
       chapter crossfades. Text reveals are NOT in this timeline (they
       play once per chapter on a one-shot basis, via onUpdate progress
       monitoring below — scrubbing the cascades with scroll position
       would jitter them).

       The previous build registered text-reveal ScrollTriggers as
       separate per-chapter triggers using `top+=Npx top` syntax. Under
       Lenis-smoothed scroll those triggers didn't fire, so the chapter
       images crossfaded but their text never appeared. Replaced with
       a single onUpdate handler on the master ScrollTrigger that
       watches progress and plays the appropriate paused reveal
       timeline when crossing chapter thresholds. */
    const FADE = 0.18;
    let lastChapter = -1;

    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger: story,
        start: 'top top',
        end: () => `+=${total * window.innerHeight}px`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          /* Activate-early offset of 0.05 so the text cascade starts
             part-way through the crossfade (when the new chapter is
             ~50% visible), not at the very end. */
          const idx = Math.max(0, Math.min(
            total - 1,
            Math.floor((self.progress + 0.05) * total)
          ));
          if (idx !== lastChapter) {
            reveals[idx].play();
            lastChapter = idx;
          }
        },
      },
    });

    /* Crossfades at each boundary i+1 (timeline position = boundary).
       Both fade-out (current chapter) and fade-in (next chapter) are
       placed at the same timeline position, with `FADE * 2` duration. */
    for (let i = 0; i < total - 1; i++) {
      const t = (i + 1) - FADE;
      masterTl.to(chapters[i],     { opacity: 0, duration: FADE * 2, ease: 'none' }, t)
              .to(chapters[i + 1], { opacity: 1, duration: FADE * 2, ease: 'none' }, t);
    }

    /* Pad the timeline so its total duration matches `total` chapter
       units — without this, scroll-progress maps unevenly across
       chapter slices and the last chapter only gets a sliver of the
       visible scroll range. */
    masterTl.set({}, {}, total);

    /* Chapter 0's reveal fires on init since its content is visible
       on page load — onUpdate doesn't fire until first scroll. */
    reveals[0].play();
    lastChapter = 0;
  } else if (skipMotion && chapters.length) {
    /* Reduced-motion + mobile: snap chapters to fully visible state.
       The CSS mobile media query overrides .about-chapter from
       position: absolute; inset: 0 to position: relative; height: auto
       so that with all opacity: 1 the chapters flow vertically as a
       stacked narrative instead of overlapping in the same 90vh box. */
    chapters.forEach(c => gsap.set(c, { opacity: 1 }));
  }

  /* ── 2b. Process step reveals ──────────────────────────────── */

  /* Three step blocks fade up in stagger when the process section
     enters view. Lazier pacing than the homepage section reveals so
     the editorial tone of the About page reads as deliberate rather
     than reactive — duration 1.6s with a 0.3s stagger and a wider
     y offset so each step has its own beat. */
  const processSteps = document.querySelectorAll('.about-process-step');
  if (processSteps.length && !skipMotion) {
    gsap.from(processSteps, {
      opacity: 0,
      y: 50,
      duration: 1.6,
      ease: 'power2.out',
      stagger: 0.3,
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

    if (skipMotion) {
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
