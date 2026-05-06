/*
  testimonial.js — Single-quote carousel with scroll-step navigation
  ===================================================================
  Fetches testimonials, shows one at a time. Three ways to advance:
    1. Mouse-wheel / trackpad — one scroll gesture = one testimonial
    2. Auto-advance every 7 s (pauses on hover, stops when off-screen)
    3. Dot navigation — click to jump to any quote

  Scroll behaviour:
  - When the section enters the viewport (IO ≥ 60%), Lenis is paused and
    wheel events are intercepted so each swipe advances one testimonial.
  - At the last testimonial scrolling down: Lenis resumes → page scrolls
    naturally to the CTA section below.
  - At the first testimonial scrolling up: Lenis resumes → page scrolls
    back to the frame section above.
  - An 850 ms cooldown (matches word-stagger duration) prevents a fast
    trackpad swipe from skipping multiple quotes in one gesture.

  Animation per item:
  - Slide in: slider opacity 0→1, y 12→0 (0.4 s expo.out)
  - Quote mark: opacity 0→1, scale 0.5→1 (back.out snap)
  - Words: per-.testimonial-word span stagger (0.03 s, expo.out)
  - Attribution: opacity/y fade last
  - prefers-reduced-motion: instant swap, no animation
*/

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getTestimonials } from './sanity.js';
import { stopLenis, startLenis, getLenis } from './lenis.js';

gsap.registerPlugin(ScrollTrigger);

const ADVANCE_MS  = 7000;
const QUOTE_MAX   = 180;

/* Client-name → portfolio image lookup for the hover bg reveal.
   Keys are partial matches (case-insensitive). Add entries as
   testimonials are added to Sanity. */
const TESTIMONIAL_IMAGES = {
  'rapha':   '/assets/portfolio/cover-rapha-records.jpg',
  'alex':    '/assets/portfolio/cover-alex-morgan.jpg',
  'fayo':    '/assets/portfolio/cover-fayo-femi.jpg',
  'shawn':   '/assets/portfolio/cover-shawn-bekki.jpg',
  'bekki':   '/assets/portfolio/cover-shawn-bekki.jpg',
  'morgan':  '/assets/portfolio/cover-alex-morgan.jpg',
};

function getTestimonialImage(clientName) {
  if (!clientName) return '/assets/portfolio/cover-alex-morgan.jpg';
  const name = clientName.toLowerCase();
  const key = Object.keys(TESTIMONIAL_IMAGES).find(k => name.includes(k));
  return TESTIMONIAL_IMAGES[key] ?? '/assets/portfolio/cover-alex-morgan.jpg';
}
/* Cooldown tuned to match the word-stagger reveal duration so the user
   can advance again as soon as the text has visually settled.
   fade-out 0.18s + fade-in 0.25s + last word start (~0.66s) ≈ 0.85s total. */
const WHEEL_WAIT  = 850;

/* ── Helpers ────────────────────────────────────────────────────── */

/* Truncate at a natural break, in priority order:
   1. Full quote if it fits within max.
   2. Last sentence end (. ! ?) found at or before max, at least 60 chars in.
   3. Last clause break (, ;) in the same window — append ellipsis.
   4. Last word boundary — append ellipsis. */
function clampQuote(text, max = QUOTE_MAX) {
  if (!text || text.length <= max) return text ?? '';

  const MIN = 60;

  for (let i = Math.min(max, text.length - 1); i >= MIN; i--) {
    if ('.!?'.includes(text[i])) return text.slice(0, i + 1);
  }
  for (let i = Math.min(max, text.length - 1); i >= MIN; i--) {
    if (',;'.includes(text[i])) return text.slice(0, i + 1) + '…';
  }
  const cut = text.lastIndexOf(' ', max);
  return (cut > MIN ? text.slice(0, cut) : text.slice(0, max)) + '…';
}

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

function revealItem(item, onDone) {
  const mark  = item.querySelector('.testimonial-mark');
  const words = item.querySelectorAll('.testimonial-word');
  const attr  = item.querySelector('.testimonial-attr');

  if (mark)         { mark.style.opacity = '0'; mark.style.transform = 'scale(0.5)'; }
  words.forEach(w => { w.style.opacity = '0'; w.style.transform = 'translateY(14px)'; });
  if (attr)         { attr.style.opacity = '0'; attr.style.transform = 'translateY(8px)'; }

  const tl = gsap.timeline({ onComplete: onDone });
  if (mark)          tl.to(mark,  { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2.5)' }, 0);
  if (words.length)  tl.to(words, { opacity: 1, y: 0, stagger: 0.04, duration: 0.5, ease: 'expo.out', clearProps: 'all' }, 0.1);
  if (attr)          tl.to(attr,  { opacity: 1, y: 0, duration: 0.35, ease: 'expo.out', clearProps: 'all' }, '-=0.15');
}

/* ── Main init ──────────────────────────────────────────────────── */

export async function initTestimonial() {
  const section = document.querySelector('.testimonial');
  if (!section) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const list = document.createElement('div');
  list.className = 'testimonial-list';

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

    const total = testimonials.length;

    /* ── Hover background image ──────────────────────────── */

    const bgEl = document.createElement('div');
    bgEl.className = 'testimonial-bg';
    bgEl.setAttribute('aria-hidden', 'true');
    section.appendChild(bgEl);

    /* ── Ambient index ───────────────────────────────────── */

    const ambientIdx = document.createElement('div');
    ambientIdx.className = 'testimonial-ambient-idx';
    ambientIdx.setAttribute('aria-hidden', 'true');
    ambientIdx.textContent = '01';
    section.appendChild(ambientIdx);

    function updateAmbientIdx(idx) {
      const label = String(idx + 1).padStart(2, '0');
      if (prefersReduced) { ambientIdx.textContent = label; return; }
      gsap.to(ambientIdx, {
        opacity: 0, duration: 0.2, ease: 'expo.in',
        onComplete: () => {
          ambientIdx.textContent = label;
          gsap.to(ambientIdx, { opacity: 1, duration: 0.5, ease: 'expo.out' });
        },
      });
    }

    /* ── DOM ─────────────────────────────────────────────── */

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
        stopTimer();
        if (inView) startTimer();
      });
      nav.appendChild(btn);
      return btn;
    });

    list.appendChild(slider);
    list.appendChild(nav);

    /* ── State ───────────────────────────────────────────── */

    let current      = -1;
    let busy         = false;
    let timer        = null;
    let inView       = false;
    let intercepting = false;
    let wheelReady   = true;   /* cooldown flag */

    /* ── Navigation ──────────────────────────────────────── */

    function setDots(idx) {
      dots.forEach((d, i) => {
        d.classList.toggle('active', i === idx);
        d.setAttribute('aria-current', i === idx ? 'true' : 'false');
      });
    }

    function goTo(idx) {
      if (idx === current) return;
      gsap.killTweensOf(slider);
      const wasAnimating = busy;
      busy = true;
      setDots(idx);
      updateAmbientIdx(idx);
      bgEl.style.backgroundImage = `url('${getTestimonialImage(testimonials[idx]?.clientName)}')`;


      const mount = () => {
        current = idx;
        slider.innerHTML = '';
        const item = buildItem(testimonials[idx]);
        slider.appendChild(item);

        if (prefersReduced) { busy = false; return; }

        gsap.set(slider, { opacity: 0, y: 8 });
        gsap.to(slider, { opacity: 1, y: 0, duration: 0.25, ease: 'expo.out' });
        revealItem(item, () => { busy = false; });
      };

      if (current === -1 || prefersReduced || wasAnimating) {
        mount();
      } else {
        gsap.to(slider, {
          opacity: 0, y: -8, duration: 0.18, ease: 'expo.in',
          onComplete: mount,
        });
      }
    }

    function next() { goTo((current + 1) % total); }

    function startTimer() {
      clearInterval(timer);
      timer = setInterval(next, ADVANCE_MS);
    }
    function stopTimer() {
      clearInterval(timer);
      timer = null;
    }

    /* ── Wheel interception ──────────────────────────────── */

    const onWheel = (e) => {
      const goingDown = e.deltaY > 0;

      /* At the last testimonial scrolling down → release to next section */
      if (goingDown && current >= total - 1) {
        stopIntercepting();
        return;   /* don't preventDefault — let Lenis take the event */
      }

      /* At the first testimonial scrolling up → release to prev section */
      if (!goingDown && current <= 0) {
        stopIntercepting();
        return;
      }

      /* Otherwise: consume the scroll event and step one testimonial */
      e.preventDefault();

      if (!wheelReady) return;
      wheelReady = false;
      setTimeout(() => { wheelReady = true; }, WHEEL_WAIT);

      stopTimer();
      goTo(goingDown ? current + 1 : current - 1);
      if (inView) startTimer();
    };

    function startIntercepting() {
      if (intercepting) return;
      intercepting = true;
      /* Pause Lenis so the page doesn't drift while we handle wheel */
      stopLenis();
      window.addEventListener('wheel', onWheel, { passive: false });
    }

    function stopIntercepting() {
      if (!intercepting) return;
      intercepting = false;
      /* Reset Lenis's scroll target to the current position before resuming.
         While Lenis was stopped it still received wheel events and queued up
         scroll delta. Without this reset, startLenis() releases all that
         queued momentum at once, causing the page to jump past the section. */
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(window.scrollY, { immediate: true });
        startLenis();
      }
      window.removeEventListener('wheel', onWheel);
    }

    /* ── Hover — pause auto-advance + reveal bg image ───── */

    list.addEventListener('mouseenter', () => {
      stopTimer();
      gsap.to(bgEl, { opacity: 0.1, duration: 0.8, ease: 'power2.out' });
    });
    list.addEventListener('mouseleave', () => {
      if (inView) startTimer();
      gsap.to(bgEl, { opacity: 0, duration: 0.6, ease: 'power2.out' });
    });

    /* ── IntersectionObserver ────────────────────────────── */

    const sectionIO = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) {
          if (current === -1) goTo(0);
          startTimer();
          if (!prefersReduced) startIntercepting();
        } else {
          stopTimer();
          stopIntercepting();
        }
      },
      /* 0.95: section must be almost fully in the viewport before we freeze
         scroll. At 0.6 the dots were still below the fold when stopLenis()
         fired — the section looked cut off. At 0.95 only ~25px of bottom
         padding is off-screen, all content (mark, quote, attr, dots) is
         visible before interception begins. */
      { threshold: 0.95 }
    );
    sectionIO.observe(section);

    ScrollTrigger.refresh();

  } catch (err) {
    console.warn('[testimonial] fetch failed, hiding section', err);
    list.remove();
  }
}
