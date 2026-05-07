/*
  portfolio-main.js — Entry point for src/portfolio.html (KNOCH-011)
  ===================================================================
  Slim entry that loads only what the Portfolio page needs:
    - lazy-load        (any future [data-bg] tiles)
    - chrome           (timecode, scroll progress, nav links)
    - cursor           (custom cursor — desktop only)
    - char-hover       (per-character hollow text on .headline-hover)
    - lenis            (smooth scroll, after window.load)
    - portfolio-page   (filter logic, hash sync, load-more, animations)

  Same minimal-import pattern as about-main.js — keeps the per-page
  bundle small and avoids loading homepage-only modules (hero,
  interlude, frame, reel, testimonial, inquiry).
*/

import { initLazyLoad }       from './lazy-load.js';
import { initChrome }         from './chrome.js';
import { initCursor }         from './cursor.js';
import { initCharHover }      from './char-hover.js';
import { initLenis }          from './lenis.js';
import { initVideoLightbox }  from './video-lightbox.js';
import { initPortfolioPage }  from './portfolio-page.js';
import { initPortfolioCMS }   from './portfolio-cms.js';
import { initFooter }         from './footer.js';

initLazyLoad();
initChrome();
initCursor();
initCharHover();
initVideoLightbox();
initFooter('expanded');

/* KNOCH-042: hydrate tiles + filter buttons from Sanity BEFORE
   initPortfolioPage runs. initPortfolioPage queries `.portfolio-card`
   at init time and bails on zero cards — so the Sanity fetch must
   complete first. .finally() guarantees the page logic still wires
   up if the fetch errors (the grid stays empty rather than the
   filter / load-more / animation hooks never running). */
initPortfolioCMS().finally(() => {
  initPortfolioPage();
});

window.addEventListener('load', () => {
  initLenis();
});
