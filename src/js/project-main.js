/*
  project-main.js — Entry point for src/project.html (KNOCH-012)
  ===============================================================
  Slim entry: chrome (back nav uses chrome.css for the timecode bar
  + nav links), cursor, char-hover, lenis, project-page (the runtime
  that populates the page from URL params).

  The video lightbox is also initialised here so the project page
  itself can host a "Watch trailer" link for video-typed projects in
  the future without needing a second module load.
*/

import { initLazyLoad }       from './lazy-load.js';
import { initChrome }         from './chrome.js';
import { initCursor }         from './cursor.js';
import { initCharHover }      from './char-hover.js';
import { initLenis }          from './lenis.js';
import { initVideoLightbox }  from './video-lightbox.js';
import { initProjectPage }    from './project-page.js';
import { initFooter }         from './footer.js';

initLazyLoad();
initChrome();
initCursor();
initCharHover();
initVideoLightbox();
initProjectPage();
initFooter('expanded');

window.addEventListener('load', () => {
  initLenis();
});
