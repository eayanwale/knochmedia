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

/* Index → background image. Files in src/public/assets/testimonials/
   are named testimonial-01.webp…testimonial-NN.webp (KNOCH-019 - the
   .jpg sources stay alongside as the optimize-images.mjs pipeline
   inputs, but runtime loads the .webp sibling for ~50% byte savings).
   testimonials[i] pairs with testimonial-(i+1) matching Sanity's
   `order asc` sort. */
function getTestimonialImage(idx) {
  const num = String((idx ?? 0) + 1).padStart(2, '0');
  return `/assets/testimonials/testimonial-${num}.webp`;
}
/* Cooldown tuned to match the word-stagger reveal duration so the user
   can advance again as soon as the text has visually settled.
   fade-out 0.18s + fade-in 0.25s + last word start (~0.66s) ≈ 0.85s total. */
const WHEEL_WAIT  = 850;

/* Spotlight reveal — KNOCH-036 (matched to the #frame section's bg-reveal
   in src/js/frame.js so both atmospheric reveals on the homepage feel
   consistent — same gradient shape, same radius default).
   - SPOT_RADIUS px : the radial mask's outer radius (where alpha hits 0).
   - BG_OPACITY     : peak opacity of the background image while hovered. */
const SPOT_RADIUS = 200;
const BG_OPACITY  = 1.0;

/* Simple two-stop falloff — same gradient as #frame's spotlight: black at
   the centre fading to transparent at 82% of the radius. The defined
   edge reads cleanly against the section's dark surround. To keep the
   reveal from feeling like a hard cut-out, .testimonial-bg's filter
   stays slightly grayscale-d so the revealed image blends with the
   section colour palette rather than punching through saturated. */
function buildSpotMask(x, y) {
  return `radial-gradient(circle ${SPOT_RADIUS}px at ${x}px ${y}px, black 0%, transparent 82%)`;
}

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

/* Set up the outlined initial state for an item — words start as ghost text.
   Does NOT auto-reveal. Returns { words, attr, mark } refs for scroll-reveal. */
function prepareItem(item) {
  const mark  = item.querySelector('.testimonial-mark');
  const words = Array.from(item.querySelectorAll('.testimonial-word'));
  const attr  = item.querySelector('.testimonial-attr');

  if (mark)  { mark.style.opacity = '0'; mark.style.transform = 'scale(0.5)'; }
  words.forEach(w => {
    w.style.color = 'transparent';
    w.style.webkitTextStroke = '0.5px rgba(237, 230, 216, 0.35)';
    w.style.transform = 'translateY(6px)';
  });
  if (attr)  { attr.style.opacity = '0'; attr.style.transform = 'translateY(8px)'; }

  /* Reveal quote mark immediately (structural element, not text content) */
  if (mark) gsap.to(mark, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2.5)' });

  return { words, attr };
}

/* Reveal a batch of words (called per scroll gesture). Returns new index.
   8 words per tick means a ~30-word quote fills in 4 quick scrolls. */
const WORDS_PER_SCROLL = 8;

function revealBatch(words, attr, startIdx) {
  const batch = words.slice(startIdx, startIdx + WORDS_PER_SCROLL);
  if (!batch.length) return startIdx;

  gsap.to(batch, {
    color: 'var(--paper)',
    webkitTextStroke: '0px transparent',
    y: 0,
    stagger: 0.04,
    duration: 0.5,
    ease: 'expo.out',
    clearProps: 'all',
  });

  const newIdx = startIdx + batch.length;

  /* Reveal attribution once all words are done */
  if (newIdx >= words.length && attr) {
    gsap.to(attr, { opacity: 1, y: 0, duration: 0.35, ease: 'expo.out', delay: 0.15, clearProps: 'all' });
  }

  return newIdx;
}

/* Inverse of revealBatch — fades the most recently revealed batch back to
   the outlined ghost state on scroll-up. Called only with the slice that
   actually transitioned (oldIdx-1 down to newIdx) so we don't re-animate
   already-hidden words. */
function unrevealBatch(words, attr, newIdx, oldIdx) {
  const batch = words.slice(newIdx, oldIdx);
  if (!batch.length) return;

  gsap.to(batch, {
    color: 'transparent',
    webkitTextStroke: '0.5px rgba(237, 230, 216, 0.35)',
    y: 6,
    stagger: { from: 'end', amount: 0.18 },
    duration: 0.32,
    ease: 'expo.in',
    overwrite: 'auto',
  });

  /* Hide attribution — text is no longer fully revealed */
  if (attr) {
    gsap.to(attr, { opacity: 0, y: 8, duration: 0.25, ease: 'expo.in', overwrite: 'auto' });
  }
}

/* ── Main init ──────────────────────────────────────────────────── */

export async function initTestimonial() {
  const section = document.querySelector('.testimonial');
  if (!section) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* KNOCH-021: drop the scroll-tied per-word reveal on phones — touch
     visitors can't generate the wheel events that drive the reveal,
     so the section was rendering as outlined ghost text that never
     filled in. Treat mobile the same as prefers-reduced-motion for
     the text-reveal flow: render the full quote immediately on each
     slide, and skip the wheel-intercept setup since there are no
     wheel events to intercept anyway. */
  const isMobile = window.matchMedia('(max-width: 800px)').matches;
  const skipScrollWrite = prefersReduced || isMobile;

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
      if (skipScrollWrite) { ambientIdx.textContent = label; return; }
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

    let current        = -1;
    let busy           = false;
    let timer          = null;
    let inView         = false;
    let intercepting   = false;
    let wheelReady     = true;   /* cooldown flag */
    let sectionHovered = false;  /* spotlight active flag */

    /* Scroll-write state — tracks progressive word reveal per testimonial */
    let currentWords   = [];
    let currentAttr    = null;
    let revealedIdx    = 0;      /* how many words revealed so far */
    let textRevealed   = false;  /* true once all words in current quote shown */

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

      /* Cross-fade the background image so slide changes don't snap abruptly.
         If spotlight is active: fade out → swap image → fade back in.
         If not hovered: just swap silently. */
      const newBg = `url('${getTestimonialImage(idx)}')`;
      if (sectionHovered) {
        gsap.to(bgEl, { opacity: 0, duration: 0.2, ease: 'power2.in', overwrite: 'auto',
          onComplete: () => {
            bgEl.style.backgroundImage = newBg;
            if (sectionHovered) gsap.to(bgEl, { opacity: BG_OPACITY, duration: 0.4, ease: 'power2.out' });
          }
        });
      } else {
        bgEl.style.backgroundImage = newBg;
      }

      const mount = () => {
        current = idx;
        slider.innerHTML = '';
        const item = buildItem(testimonials[idx]);
        slider.appendChild(item);

        if (skipScrollWrite) {
          busy = false;
          textRevealed = true;
          return;
        }

        gsap.set(slider, { opacity: 0, y: 8 });
        gsap.to(slider, { opacity: 1, y: 0, duration: 0.25, ease: 'expo.out' });

        /* Prepare outlined state — text will reveal via scroll gestures */
        const refs = prepareItem(item);
        currentWords  = refs.words;
        currentAttr   = refs.attr;
        revealedIdx   = 0;
        textRevealed  = currentWords.length === 0;
        busy = false;

        /* Auto-reveal first batch immediately so text doesn't feel laggy */
        if (!textRevealed) {
          setTimeout(() => {
            revealedIdx = revealBatch(currentWords, currentAttr, revealedIdx);
            textRevealed = revealedIdx >= currentWords.length;
          }, 200);
        }
      };

      if (current === -1 || skipScrollWrite || wasAnimating) {
        mount();
      } else {
        gsap.to(slider, {
          opacity: 0, y: -8, duration: 0.18, ease: 'expo.in',
          onComplete: mount,
        });
      }
    }

    function next() {
      /* Auto-advance: reveal text first if not yet shown, then advance */
      if (!textRevealed) {
        revealedIdx = revealBatch(currentWords, currentAttr, revealedIdx);
        textRevealed = revealedIdx >= currentWords.length;
        return;
      }
      goTo((current + 1) % total);
    }

    function startTimer() {
      clearInterval(timer);
      timer = setInterval(next, ADVANCE_MS);
    }
    function stopTimer() {
      clearInterval(timer);
      timer = null;
    }

    /* ── Wheel interception ──────────────────────────────── */

    /* Short cooldown for word reveal (feels immediate), longer for slide transitions */
    const REVEAL_WAIT = 120;

    const onWheel = (e) => {
      const goingDown = e.deltaY > 0;

      /* At the last testimonial scrolling down AND text fully revealed → release */
      if (goingDown && current >= total - 1 && textRevealed) {
        stopIntercepting();
        return;
      }

      /* At the first testimonial scrolling up AND nothing left to un-reveal
         → release to prev section. revealedIdx === 0 means the quote is
         already in its outlined ghost state. */
      if (!goingDown && current <= 0 && revealedIdx === 0) {
        stopIntercepting();
        return;
      }

      /* Consume the scroll event */
      e.preventDefault();

      stopTimer();

      /* Scroll-write down: reveal next batch (fast cooldown) */
      if (goingDown && !textRevealed) {
        if (!wheelReady) return;
        wheelReady = false;
        setTimeout(() => { wheelReady = true; }, REVEAL_WAIT);

        revealedIdx = revealBatch(currentWords, currentAttr, revealedIdx);
        textRevealed = revealedIdx >= currentWords.length;
        if (inView) startTimer();
        return;
      }

      /* Scroll-write up: un-reveal the previous batch before changing slides.
         Mirrors the typing motion — words ghost back from end to start with
         the same cooldown as a forward reveal. Only fires while there's
         still revealed text on the current testimonial. */
      if (!goingDown && revealedIdx > 0) {
        if (!wheelReady) return;
        wheelReady = false;
        setTimeout(() => { wheelReady = true; }, REVEAL_WAIT);

        const oldIdx = revealedIdx;
        revealedIdx = Math.max(0, revealedIdx - WORDS_PER_SCROLL);
        unrevealBatch(currentWords, currentAttr, revealedIdx, oldIdx);
        textRevealed = false;
        if (inView) startTimer();
        return;
      }

      /* Slide transitions use longer cooldown to prevent skipping.
         Reached only at testimonial boundaries (top of current quote
         scrolling up, or fully revealed quote scrolling down). */
      if (!wheelReady) return;
      wheelReady = false;
      setTimeout(() => { wheelReady = true; }, WHEEL_WAIT);

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

    /* ── Spotlight — radial-gradient mask follows cursor across the section ── */

    /* Smooth spotlight position — GSAP tweens a proxy so the circle eases
       toward the cursor rather than jumping frame to frame. */
    const spotPos = { x: 0, y: 0 };

    section.addEventListener('mousemove', (e) => {
      const rect = section.getBoundingClientRect();
      gsap.to(spotPos, {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        duration: 0.25,
        ease: 'power2.out',
        overwrite: 'auto',
        onUpdate() {
          const m = buildSpotMask(spotPos.x, spotPos.y);
          bgEl.style.maskImage = m;
          bgEl.style.webkitMaskImage = m;
        },
      });
    }, { passive: true });

    /* ── Section hover — timer + bg opacity ────────────────────────────── */

    section.addEventListener('mouseenter', (e) => {
      stopTimer();
      sectionHovered = true;
      /* Set initial spotlight at entry point before fading in — prevents
         full-image flash while the first mousemove hasn't fired yet. */
      const rect = section.getBoundingClientRect();
      spotPos.x = e.clientX - rect.left;
      spotPos.y = e.clientY - rect.top;
      const m = buildSpotMask(spotPos.x, spotPos.y);
      bgEl.style.maskImage = m;
      bgEl.style.webkitMaskImage = m;
      gsap.to(bgEl, { opacity: BG_OPACITY, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
    });
    section.addEventListener('mouseleave', () => {
      sectionHovered = false;
      gsap.to(bgEl, { opacity: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
      if (inView) startTimer();
    });

    /* ── IntersectionObserver ────────────────────────────── */

    const sectionIO = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) {
          if (current === -1) goTo(0);
          startTimer();
          if (!skipScrollWrite) startIntercepting();
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
