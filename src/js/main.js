import { initChrome } from './chrome.js';
import { initCursor } from './cursor.js';
import { initHero } from './hero.js';
import { initInterlude } from './interlude.js';
import { initReel } from './reel.js';
import { initFrame } from './frame.js';
import { initTestimonial } from './testimonial.js';
import { initPortfolioGrid } from './portfolio-grid.js';
import { getFeaturedCollections, imageUrl } from './sanity.js';

// NOTE: initLenis() is intentionally NOT called here.
// hero.js calls initLenis() inside the loader's onComplete callback
// (after the film-counter loader fades out) so that Lenis smooth scroll
// only activates once the hero image is loaded and the intro has played.
// Calling it here would allow scrolling during the loader and would set up
// the ScrollTrigger proxy before the page is visually ready.

// Chrome navigation + timecode bar (KNOCH-003)
initChrome();

// Custom cursor + film-grain overlay (KNOCH-004)
initCursor();

// Hero loader + reveal sequence + scroll exit (KNOCH-005)
// Also bootstraps Lenis (KNOCH-016) in its onComplete callback.
initHero();

// Interlude manifesto — word-by-word scroll-driven reveal (KNOCH-006)
initInterlude();

// Pinned frame — parallax bg + animated studio stats (KNOCH-008)
initFrame();

// Testimonial pull-quote — Sanity-driven stacked list (KNOCH-009 / KNOCH-024)
// async — fetches from Sanity independently, does not block other inits.
// Content renders when the promise resolves; ScrollTrigger.refresh() is called
// inside initTestimonial() after DOM is updated.
initTestimonial();

// Portfolio archive grid — asymmetric 12-col contact-sheet (KNOCH-010)
initPortfolioGrid();

// Horizontal reel — fetch featured collections from Sanity then init (KNOCH-007 + KNOCH-025)
// Per-card background-position overrides — keyed by Sanity title.
// Adjust these values if the focal point needs reframing.
const REEL_BG_POSITIONS = {
  'BCF Gala Night': '50% 25%',
};

getFeaturedCollections().then(collections => {
  const cards = collections.map((col, i) => ({
    index: String(i + 1).padStart(2, '0'),
    scene: col.category ?? 'Work',
    title: col.title,
    subtitle: col.subtitle ?? col.category ?? '',
    img: col.coverImage ? imageUrl(col.coverImage, 1200) : '',
    url: col.url ?? '#',
    linkType: col.linkType ?? 'external-gallery',
    bgPosition: REEL_BG_POSITIONS[col.title] ?? 'center',
  }));
  initReel(cards.length ? cards : undefined);
});
