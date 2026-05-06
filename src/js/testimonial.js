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
  - ScrollTrigger.refresh() is called after content renders to recalculate
    scroll positions — required because the section height changes substantially
    when 5 items replace the skeleton.
  - once: true on the ScrollTrigger keeps the stagger reveal as a single
    deliberate moment, matching the KNOCH-009 behaviour.
  - prefers-reduced-motion: no GSAP animations registered, but content still
    renders (CSS keeps items at final visible state).
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

    /* Register GSAP scroll-stagger reveal after DOM nodes exist.
       Uses .testimonial-list as trigger so the animation fires when the
       list enters the viewport rather than the section top (which may be
       many rems above the first item due to section padding). */
    if (!prefersReduced) {
      gsap.from('.testimonial-item', {
        y: 40,
        opacity: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: '.testimonial-list',
          start: 'top 75%',
          once: true,   /* single deliberate reveal — matches KNOCH-009 behaviour */
        },
      });
    }

    /* Recalculate scroll positions now that section height has changed.
       Required because the skeleton → 5-item swap substantially alters
       document height and all downstream ScrollTrigger start/end positions. */
    ScrollTrigger.refresh();

  } catch (err) {
    /* Fetch failure — remove list silently so section collapses cleanly */
    console.warn('[testimonial] fetch failed, hiding section', err);
    list.remove();
  }
}
