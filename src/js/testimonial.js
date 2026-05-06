/*
  testimonial.js — Dynamic testimonial section wired to Sanity CMS (KNOCH-024)
  =============================================================================
  Fetches all testimonials from Sanity via getTestimonials() and renders them
  as a stacked vertical list of pull-quotes. Each item is ~120 chars max
  (truncated at a word boundary) so no quote overwhelms the home page.

  Animation strategy:
  - Each .testimonial-item has its own IntersectionObserver so the reveal
    fires when THAT item enters the viewport, not all at once.
  - Each item runs a 3-step GSAP timeline:
      1. Quote mark:  opacity 0→1, scale 0.5→1  (back.out snap)
      2. Quote words: each .testimonial-word span, staggered 0.04s  (expo.out)
      3. Attribution: opacity 0→1, y 10→0  (expo.out)
  - IntersectionObserver (not GSAP ScrollTrigger) is used so the reveal is
    completely independent of the Lenis proxy timing. The Sanity fetch resolves
    at ~200ms; Lenis doesn't init until ~2s (hero.js onComplete). Triggers
    registered before the proxy produce wrong positions.
  - Initial hidden state is applied via JS inline styles, never via CSS, so
    items are always visible without JS and can never be permanently stuck.
  - prefers-reduced-motion: JS skips all inline hiding and IO registration;
    items render at their natural visible state.
*/

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getTestimonials } from './sanity.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Trim a quote to at most `max` characters, breaking at the last word
 * boundary so no word is cut mid-way. Appends an ellipsis if truncated.
 */
function clampQuote(text, max = 120) {
  if (!text || text.length <= max) return text ?? '';
  const cut = text.lastIndexOf(' ', max);
  return (cut > 0 ? text.slice(0, cut) : text.slice(0, max)) + '…';
}

/**
 * Build a single .testimonial-item DOM node from a Sanity testimonial record.
 * The quote text is split into .testimonial-word spans so GSAP can stagger
 * a per-word translateY reveal without breaking normal text flow.
 *
 * @param {Object} t
 * @param {string} t.quote      — full quote text (plain string from Sanity)
 * @param {string} t.clientName — client or company name
 */
function buildItem(t) {
  const item = document.createElement('div');
  item.className = 'testimonial-item';

  /* Decorative opening quotation mark */
  const mark = document.createElement('div');
  mark.className = 'testimonial-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.innerHTML = '&ldquo;';

  /* Pull-quote — truncated, split into per-word spans for the stagger reveal */
  const quote = document.createElement('p');
  quote.className = 'testimonial-quote';

  const truncated = clampQuote(t.quote);
  truncated.split(' ').forEach((word, i) => {
    if (i > 0) quote.appendChild(document.createTextNode(' '));
    const span = document.createElement('span');
    span.className = 'testimonial-word';
    span.textContent = word;
    quote.appendChild(span);
  });

  /* Attribution — trim trailing whitespace Sanity occasionally leaves */
  const attr = document.createElement('p');
  attr.className = 'testimonial-attr';
  attr.textContent = `— ${(t.clientName ?? '').trim()}`;

  item.append(mark, quote, attr);
  return item;
}

/**
 * Register a per-item reveal for one .testimonial-item.
 * Fires when the item enters the viewport (IntersectionObserver).
 * Runs a 3-step GSAP timeline: mark → words → attribution.
 */
function revealItem(item) {
  const mark  = item.querySelector('.testimonial-mark');
  const words = item.querySelectorAll('.testimonial-word');
  const attr  = item.querySelector('.testimonial-attr');

  /* Apply initial hidden state via inline styles */
  if (mark)  { mark.style.opacity = '0'; mark.style.transform = 'scale(0.5)'; }
  words.forEach(w => { w.style.opacity = '0'; w.style.transform = 'translateY(16px)'; });
  if (attr)  { attr.style.opacity = '0'; attr.style.transform = 'translateY(10px)'; }

  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      /* 1. Quote mark snaps in */
      if (mark) {
        tl.to(mark, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2.5)' });
      }

      /* 2. Words stagger up — overlap slightly with the mark reveal */
      if (words.length) {
        tl.to(
          words,
          { opacity: 1, y: 0, stagger: 0.04, duration: 0.7, clearProps: 'all' },
          mark ? '-=0.25' : 0
        );
      }

      /* 3. Attribution fades up after most words are visible */
      if (attr) {
        tl.to(
          attr,
          { opacity: 1, y: 0, duration: 0.5, clearProps: 'all' },
          '-=0.35'
        );
      }
    },
    /* Trigger when the item is 15% inside the viewport from the bottom */
    { rootMargin: '0px 0px -15% 0px', threshold: 0 }
  );

  io.observe(item);
}

/**
 * Initialise the testimonial section. Fetches from Sanity, renders items,
 * and wires up per-item scroll reveals.
 *
 * Call without await in main.js — the fetch runs independently without
 * blocking the rest of the boot sequence.
 */
export async function initTestimonial() {
  const section = document.querySelector('.testimonial');
  if (!section) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Build the list wrapper */
  const list = document.createElement('div');
  list.className = 'testimonial-list';

  /* Skeleton — shows while the fetch is in flight */
  const skeleton = document.createElement('div');
  skeleton.className = 'testimonial-item';
  skeleton.setAttribute('aria-hidden', 'true');
  skeleton.innerHTML = `
    <div class="testimonial-mark" aria-hidden="true">&ldquo;</div>
    <p class="testimonial-quote" style="opacity:0.2">Loading…</p>
  `.trim();
  list.appendChild(skeleton);
  section.appendChild(list);

  try {
    const testimonials = await getTestimonials();

    list.innerHTML = '';

    if (!testimonials?.length) return;

    testimonials.forEach(t => list.appendChild(buildItem(t)));

    /* Wire per-item reveals (skipped entirely for reduced-motion) */
    if (!prefersReduced) {
      list.querySelectorAll('.testimonial-item').forEach(revealItem);
    }

    /* Recalculate all ScrollTrigger positions now that section height changed
       (skeleton → 5 real items). Frame, interlude, reel triggers sit above
       this section and need accurate offsets after the height change. */
    ScrollTrigger.refresh();

  } catch (err) {
    console.warn('[testimonial] fetch failed, hiding section', err);
    list.remove();
  }
}
