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

  /* ── 1b. Intro paragraph float + scroll-tied parallax ───────── */

  /* Two layered effects so the intro body never feels static:
     - Continuous yoyo on yPercent for an ambient bob (always on).
     - Scroll-tied y-pixel parallax — the paragraph drifts upward as
       the section passes through the viewport, separating its plane
       from the rest of the body copy. yPercent and y are tracked as
       independent transform components in GSAP so the two compose
       without overwriting each other. */
  const introBody = document.querySelector('.about-intro-body');
  if (introBody && !prefersReduced) {
    /* Continuous bob */
    gsap.to(introBody, {
      yPercent: -2,
      duration: 3.6,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    /* Scroll-tied parallax — drift up 180px over the section's
       visible range. Beefier than the previous 60px so the effect
       reads clearly when scrolling past. */
    gsap.fromTo(introBody,
      { y: 80 },
      {
        y: -180,
        ease: 'none',
        scrollTrigger: {
          trigger: '.about-intro',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      }
    );
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

    /* Master scrub timeline — pinned to the story container for
       `total` viewport heights of scroll. Crossfades happen at each
       chapter boundary; the timeline's own duration is padded to
       `total` so scroll progress maps evenly across chapter slices.

       Why a master timeline (rather than per-tween ScrollTriggers
       referencing the same trigger): the previous version mixed pin
       + per-tween triggers using `top+=Npx top` syntax, which works
       in theory but ended up with only the first chapter visible.
       Consolidating into one scrub timeline lets GSAP own all the
       position math and matches the canonical pinned-narrative
       pattern from its own docs. */
    const FADE = 0.18; /* timeline-unit length of each crossfade */

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

    /* Text reveal triggers — separate ScrollTriggers per chapter so
       the reveal plays once when its slice enters, rather than
       scrubbing with scroll (which would jitter the cascade). Each
       trigger spans the back third of the previous slice (or the
       page top, for chapter 0). */
    chapters.forEach((chapter, i) => {
      if (i === 0) {
        /* Chapter 0 is visible on load — fire its reveal immediately
           rather than waiting for a scroll trigger. */
        reveals[0].play();
        return;
      }
      ScrollTrigger.create({
        trigger: story,
        start: () => `top+=${(i - 0.5) * window.innerHeight}px top`,
        end:   () => `top+=${i * window.innerHeight}px top`,
        onEnter:     () => reveals[i].play(),
        onEnterBack: () => reveals[i].play(),
        invalidateOnRefresh: true,
      });
    });
  } else if (prefersReduced && chapters.length) {
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
