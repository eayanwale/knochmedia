/*
  testimonial.js — Dynamic testimonial section wired to Sanity CMS (KNOCH-024)
  =============================================================================
  Fetches all testimonials from Sanity via getTestimonials() and renders them
  as a stacked vertical list of editorial pull-quotes. Each item uses the same
  centered typography established in KNOCH-009 (quote mark, quote text,
  attribution line).

  Design decisions (KNOCH-024 additions):
  - buildItem() creates DOM nodes imperatively rather than innerHTML templates
    to avoid XSS issues with CMS-provided text content.
  - A skeleton loading state (opacity 0.3 "Loading…" item) renders immediately
    so the section doesn't appear blank during the fetch; it is replaced by
    real content or removed silently on failure.
  - getTestimonials() returns a plain string `quote` field — Sanity is set up
    with a plain-text field, not portable text. So no em-italic treatment is
    applied to dynamic content (the em in KNOCH-009 was a design mock for the
    single hardcoded quote only).
  - Attribution format: "— Name · Role · Year" when role present,
    "— Name · Year" for company-only clients (Rapha Records, Mont Alto
    Woodsmen) where role is null.
  - The stagger reveal uses IntersectionObserver (not GSAP ScrollTrigger).
    ScrollTrigger depends on the Lenis proxy being live when it registers;
    the Sanity fetch resolves at ~200ms, before Lenis inits at ~2s (hero.js
    onComplete). IO has no proxy dependency — it fires on real DOM intersection.
    GSAP still runs the animation once IO fires; ScrollTrigger is only used
    for the post-render refresh() call.
  - Initial hidden state (opacity:0, translateY(40px)) is applied via JS inline
    styles so items are always visible without JS and can never be permanently
    stuck invisible if the reveal mechanism fails for any reason.
  - prefers-reduced-motion: JS skips inline hidden-state + IO entirely; items
    render at their natural visible state immediately.
  - If the fetch fails, list.remove() silently collapses the section — the
    .testimonial shell has padding, so it won't cause layout breaks.
*/

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getTestimonials } from './sanity.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Build a single .testimonial-item DOM node from a Sanity testimonial record.
 * @param {Object} t — testimonial object from getTestimonials()
 * @param {string} t.quote — full quote text (plain string)
 * @param {string} t.clientName — client or company name
 * @param {string|null} t.role — job title (null for company-only clients)
 * @param {string|number} t.year — year the work was delivered
 */
function buildItem(t) {
  const item = document.createElement('div');
  item.className = 'testimonial-item';

  /* Decorative opening quotation mark — aria-hidden, purely visual */
  const mark = document.createElement('div');
  mark.className = 'testimonial-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.innerHTML = '&ldquo;';

  /* Pull-quote — plain text from Sanity; no em treatment for dynamic content */
  const quote = document.createElement('p');
  quote.className = 'testimonial-quote';
  quote.textContent = t.quote ?? '';

  /* Attribution: "— Name · Role · Year" or "— Name · Year" */
  const attr = document.createElement('p');
  attr.className = 'testimonial-attr';
  const parts = ['—', t.clientName];
  if (t.role) parts.push(t.role);
  if (t.year) parts.push(String(t.year));
  /* join with · but fix the "— ·" that would appear if clientName were empty */
  attr.textContent = parts.join(' · ').replace('— ·', '—');

  item.append(mark, quote, attr);
  return item;
}

/**
 * Initialise the testimonial section. Fetches from Sanity, renders items,
 * and registers the GSAP scroll-stagger reveal.
 *
 * This function is async — call it without await in main.js so the fetch
 * runs independently without blocking the rest of the boot sequence.
 */
export async function initTestimonial() {
  const section = document.querySelector('.testimonial');
  if (!section) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Build the .testimonial-list wrapper that will hold all items */
  const list = document.createElement('div');
  list.className = 'testimonial-list';

  /* Skeleton loading state — replaced when fetch resolves */
  const skeleton = document.createElement('div');
  skeleton.className = 'testimonial-item';
  skeleton.setAttribute('aria-hidden', 'true');
  skeleton.innerHTML = `
    <div class="testimonial-mark" aria-hidden="true">&ldquo;</div>
    <p class="testimonial-quote" style="opacity:0.3">Loading…</p>
  `.trim();
  list.appendChild(skeleton);
  section.appendChild(list);

  try {
    const testimonials = await getTestimonials();

    /* Clear skeleton regardless of result count */
    list.innerHTML = '';

    /* Silently collapse if CMS returns nothing */
    if (!testimonials?.length) return;

    /* Render each testimonial in the order returned by Sanity (order asc) */
    testimonials.forEach(t => list.appendChild(buildItem(t)));

    const items = [...list.querySelectorAll('.testimonial-item')];

    if (!prefersReduced) {
      /* Set initial hidden state via JS inline styles — NOT via CSS.
         This ensures items are visible without JS and are never permanently
         stuck at opacity:0 if the reveal mechanism fails.

         IntersectionObserver is used instead of GSAP ScrollTrigger because
         ScrollTrigger depends on the Lenis proxy being live, but the Sanity
         fetch resolves (~200ms) long before Lenis initialises (~2s inside
         hero.js onComplete). IO has no proxy dependency and fires reliably
         the moment the list enters the viewport. */
      items.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(40px)';
      });

      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          io.disconnect();
          gsap.to(items, {
            opacity: 1,
            y: 0,
            duration: 1.2,
            stagger: 0.15,
            ease: 'expo.out',
            clearProps: 'opacity,transform',
          });
        },
        /* rootMargin shifts the trigger line 25% up from the bottom of the
           viewport — equivalent to ScrollTrigger's "top 75%" start. */
        { rootMargin: '0px 0px -25% 0px', threshold: 0 }
      );
      io.observe(list);
    }

    /* Recalculate all ScrollTrigger positions now that the section height has
       changed (skeleton → 5 real items). Frame, interlude, and reel triggers
       all sit above this section and need accurate offsets. */
    ScrollTrigger.refresh();

  } catch (err) {
    /* Fetch failure — remove list silently so section collapses cleanly */
    console.warn('[testimonial] fetch failed, hiding section', err);
    list.remove();
  }
}
