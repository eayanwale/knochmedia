import { initLazyLoad } from './lazy-load.js';
import { initChrome } from './chrome.js';
import { initCursor } from './cursor.js';
import { initCharHover } from './char-hover.js';
import { initHero } from './hero.js';
import { initHeroReel } from './hero-reel.js';
import { initInterlude } from './interlude.js';
import { initReel } from './reel.js';
import { initFrame } from './frame.js';
import { initTestimonial } from './testimonial.js';
import { initPortfolioGrid } from './portfolio-grid.js';
import { initInquiry } from './inquiry.js';
import { initVideoLightbox } from './video-lightbox.js';
import { initFooter } from './footer.js';
import { getFeaturedCollections, imageUrl } from './sanity.js';

// NOTE: initLenis() is intentionally NOT called here.
// hero.js calls initLenis() inside the loader's onComplete callback
// (after the film-counter loader fades out) so that Lenis smooth scroll
// only activates once the hero image is loaded and the intro has played.
// Calling it here would allow scrolling during the loader and would set up
// the ScrollTrigger proxy before the page is visually ready.

// Lazy-load: set up IntersectionObserver for [data-bg] elements (KNOCH-030)
// Must run before section inits so crosshatch placeholders are in place
// when GSAP animations reference .tile-img elements.
initLazyLoad();

// Chrome navigation + timecode bar (KNOCH-003)
initChrome();

// Custom cursor + film-grain overlay (KNOCH-004)
initCursor();

// Per-character hollow-text hover on all .headline-hover elements
initCharHover();

// Hero loader + reveal sequence + scroll exit (KNOCH-005)
// Also bootstraps Lenis (KNOCH-016) in its onComplete callback.
initHero();

// Hero PLAY REEL CTA — paints YouTube thumb + binds lightbox open (KNOCH-017).
// Runs immediately after initHero() so the thumbnail Image() probe starts
// while the loader is playing; by the time the hero reveal fades the button
// in, the bg-image is already in cache. The reveal opacity tween itself
// lives in hero.js so all hero choreography stays in one place.
initHeroReel();

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

// Qualified inquiry form — 4-step aperture iris wizard (KNOCH-030)
initInquiry();

// Video lightbox modal (KNOCH-012) — used by archive tiles + reel cards
// for video-typed projects. Builds the modal DOM lazily on first open.
initVideoLightbox();

// Footer — minimal credits bar variant on the homepage (KNOCH-015).
// Mounts into <footer id="site-footer"> at the bottom of index.html.
initFooter('minimal');

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
