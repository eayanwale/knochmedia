import { initChrome } from './chrome.js';
import { initCursor } from './cursor.js';
import { initHero } from './hero.js';
import { initInterlude } from './interlude.js';
import { initReel } from './reel.js';
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

// Horizontal reel — fetch featured collections from Sanity then init (KNOCH-007 + KNOCH-025)
getFeaturedCollections().then(collections => {
  const cards = collections.map((col, i) => ({
    index: String(i + 1).padStart(2, '0'),
    scene: col.category ?? 'Work',
    title: col.title,
    subtitle: col.subtitle ?? col.category ?? '',
    img: col.coverImage ? imageUrl(col.coverImage, 1200) : '',
    url: col.url ?? '#',
    linkType: col.linkType ?? 'external-gallery',
  }));
  initReel(cards.length ? cards : undefined);
});
