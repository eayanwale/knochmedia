/*
  testimonial.js — Single-quote carousel wired to Sanity CMS
  ===========================================================
  Fetches testimonials, renders one at a time, auto-advances every 7 s.
  IntersectionObserver starts/stops the timer as the section enters/leaves
  the viewport. Dots let the visitor jump to any quote.

  Animation approach:
  - Each reveal runs a 3-step GSAP timeline per item:
      1. Quote mark  — opacity 0→1, scale 0.5→1  (back.out snap)
      2. Quote words — .testimonial-word spans stagger up (expo.out)
      3. Attribution — opacity/y fade (expo.out)
  - Transitions between items: slider fades out (expo.in, 0.28 s),
    content swaps, slider fades in while the word stagger plays.
  - IntersectionObserver instead of GSAP ScrollTrigger: the Sanity fetch
    resolves at ~200 ms, long before Lenis inits at ~2 s (hero onComplete).
    IO has no proxy dependency and fires on real DOM intersection.
  - prefers-reduced-motion: animation skipped, content swaps instantly.
*/

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getTestimonials } from './sanity.js';

gsap.registerPlugin(ScrollTrigger);

const ADVANCE_MS   = 7000;   /* auto-advance interval */
const QUOTE_MAX    = 120;    /* max chars before ellipsis */

/* ── Helpers ──────────────────────────────────────────────────────── */

function clampQuote(text, max = QUOTE_MAX) {
  if (!text || text.length <= max) return text ?? '';
  const cut = text.lastIndexOf(' ', max);
  return (cut > 0 ? text.slice(0, cut) : text.slice(0, max)) + '…';
}

/**
 * Build one .testimonial-item node. The quote is truncated and each word
 * is wrapped in a .testimonial-word span for the per-word stagger reveal.
 */
function buildItem(t) {
  const item = document.createElement('div');
  item.className = 'testimonial-item';

  const mark = document.createElement('div');
  mark.className = 'testimonial-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.innerHTML = '&ldquo;';

  const quote = document.createElement('p');
  quote.className = 'testimonial-quote';
  clampQuote(t.quote).split(' ').forEach((word, i) => {
    if (i > 0) quote.appendChild(document.createTextNode(' '));
    const span = document.createElement('span');
    span.className = 'testimonial-word';
    span.textContent = word;
    quote.appendChild(span);
  });

  const attr = document.createElement('p');
  attr.className = 'testimonial-attr';
  attr.textContent = `— ${(t.clientName ?? '').trim()}`;

  item.append(mark, quote, attr);
  return item;
}

/**
 * Animate a freshly-mounted item into view.
 * Assumes the slider is already at opacity 1 (or animating toward it).
 * Calls onDone when the timeline completes.
 */
function revealItem(item, onDone) {
  const mark  = item.querySelector('.testimonial-mark');
  const words = item.querySelectorAll('.testimonial-word');
  const attr  = item.querySelector('.testimonial-attr');

  /* Set initial hidden state via inline styles */
  if (mark)        { mark.style.opacity = '0'; mark.style.transform = 'scale(0.5)'; }
  words.forEach(w => { w.style.opacity = '0'; w.style.transform = 'translateY(14px)'; });
  if (attr)        { attr.style.opacity = '0'; attr.style.transform = 'translateY(8px)'; }

  const tl = gsap.timeline({ onComplete: onDone });

  if (mark)        tl.to(mark,  { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2.5)' }, 0);
  if (words.length) tl.to(words, { opacity: 1, y: 0, stagger: 0.03, duration: 0.55, ease: 'expo.out', clearProps: 'all' }, 0.12);
  if (attr)        tl.to(attr,  { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out', clearProps: 'all' }, '-=0.15');
}

/* ── Main init ────────────────────────────────────────────────────── */

export async function initTestimonial() {
  const section = document.querySelector('.testimonial');
  if (!section) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* List wrapper */
  const list = document.createElement('div');
  list.className = 'testimonial-list';

  /* Skeleton while fetching */
  const skeleton = document.createElement('div');
  skeleton.className = 'testimonial-slider';
  skeleton.setAttribute('aria-hidden', 'true');
  skeleton.innerHTML = `
    <div class="testimonial-item">
      <div class="testimonial-mark">&ldquo;</div>
      <p class="testimonial-quote" style="opacity:0.2">Loading…</p>
    </div>`.trim();
  list.appendChild(skeleton);
  section.appendChild(list);

  try {
    const testimonials = await getTestimonials();

    list.innerHTML = '';
    if (!testimonials?.length) return;

    /* ── DOM structure ─────────────────────────────────── */

    const slider = document.createElement('div');
    slider.className = 'testimonial-slider';
    slider.setAttribute('aria-live', 'polite');
    slider.setAttribute('aria-atomic', 'true');

    const nav = document.createElement('nav');
    nav.className = 'testimonial-nav';
    nav.setAttribute('aria-label', 'Testimonials');

    const dots = testimonials.map((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'testimonial-dot';
      btn.setAttribute('aria-label', `Show testimonial ${i + 1}`);
      btn.addEventListener('click', () => {
        goTo(i);
        /* Reset the auto-advance timer so the user gets a full 7 s
           after manually choosing, not the remainder of the old cycle. */
        stopTimer();
        if (inView) startTimer();
      });
      nav.appendChild(btn);
      return btn;
    });

    list.appendChild(slider);
    list.appendChild(nav);

    /* ── State ─────────────────────────────────────────── */

    let current  = -1;   /* index of visible testimonial (-1 = none yet) */
    let busy     = false; /* animation lock — prevents overlapping tweens  */
    let timer    = null;  /* setInterval handle for auto-advance           */
    let inView   = false; /* true while section is in the viewport         */

    /* ── Navigation helpers ───────────────────────────── */

    function setDots(idx) {
      dots.forEach((d, i) => {
        d.classList.toggle('active', i === idx);
        d.setAttribute('aria-current', i === idx ? 'true' : 'false');
      });
    }

    /**
     * Transition to testimonial at `idx`.
     * If this is the first render, skips the fade-out step.
     */
    function goTo(idx) {
      if (busy || idx === current) return;
      busy = true;
      setDots(idx);

      const mount = () => {
        current = idx;
        slider.innerHTML = '';
        const item = buildItem(testimonials[idx]);
        slider.appendChild(item);

        if (prefersReduced) {
          busy = false;
          return;
        }

        /* Fade slider in while word stagger plays */
        gsap.set(slider, { opacity: 0, y: 12 });
        gsap.to(slider, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out' });
        revealItem(item, () => { busy = false; });
      };

      if (current === -1 || prefersReduced) {
        /* First render — no fade-out */
        mount();
      } else {
        /* Fade out current content, then swap */
        gsap.to(slider, {
          opacity: 0, y: -10, duration: 0.28, ease: 'expo.in',
          onComplete: mount,
        });
      }
    }

    function next() { goTo((current + 1) % testimonials.length); }

    function startTimer() {
      clearInterval(timer);
      timer = setInterval(next, ADVANCE_MS);
    }

    function stopTimer() {
      clearInterval(timer);
      timer = null;
    }

    /* ── Hover — pause auto-advance ───────────────────── */

    list.addEventListener('mouseenter', stopTimer);
    list.addEventListener('mouseleave', () => { if (inView) startTimer(); });

    /* ── IntersectionObserver — start/stop on visibility ─ */
    /*
     * Using IO rather than ScrollTrigger: the fetch resolves at ~200 ms,
     * before Lenis initialises at ~2 s. IO fires on real intersection
     * with no proxy dependency.
     */
    const sectionIO = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) {
          if (current === -1) goTo(0); /* first appearance */
          startTimer();
        } else {
          stopTimer();
        }
      },
      { threshold: 0.25 }
    );
    sectionIO.observe(section);

    /* Correct downstream ScrollTrigger positions (frame, interlude, reel)
       now that the skeleton has been replaced and section height is final. */
    ScrollTrigger.refresh();

  } catch (err) {
    console.warn('[testimonial] fetch failed, hiding section', err);
    list.remove();
  }
}
