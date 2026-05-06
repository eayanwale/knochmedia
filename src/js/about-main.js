/*
  about-main.js — Entry point for src/about.html (KNOCH-013)
  ============================================================
  Slim entry that loads only what the About page needs:
    - lazy-load   (any future [data-bg] images)
    - chrome      (timecode, scroll progress, nav links)
    - cursor      (custom cursor — desktop only)
    - char-hover  (per-character hollow text on .headline-hover targets)
    - lenis       (smooth scroll, after window.load so layout is settled)
    - about       (chapter sync, stat counters, hero entrance)

  Deliberately does NOT import initHero, initInterlude, initReel, etc. —
  those modules touch homepage-only DOM and would be dead code on the
  About page even though they early-return on missing elements. Keeping
  the About entry separate also means the about.html bundle stays small.
*/

import { initLazyLoad } from './lazy-load.js';
import { initChrome }   from './chrome.js';
import { initCursor }   from './cursor.js';
import { initCharHover } from './char-hover.js';
import { initLenis }    from './lenis.js';
import { initAbout }    from './about.js';

initLazyLoad();
initChrome();
initCursor();
initCharHover();
initAbout();

/* Boot Lenis after window.load so any image / font dimensions are
   final before ScrollTrigger registers its proxy. The About page has
   no film-counter loader, so there's no other event to wait on. */
window.addEventListener('load', () => {
  initLenis();
});
