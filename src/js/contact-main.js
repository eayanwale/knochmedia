/*
  contact-main.js — Entry point for src/contact.html (KNOCH-014)
  ================================================================
  Slim entry — same lazy-load + chrome + cursor + char-hover + lenis
  base as the other secondary pages, plus the contact-page module
  for the multi-step form behaviour.
*/

import { initLazyLoad }       from './lazy-load.js';
import { initChrome }         from './chrome.js';
import { initCursor }         from './cursor.js';
import { initCharHover }      from './char-hover.js';
import { initLenis }          from './lenis.js';
import { initContactPage }    from './contact-page.js';

initLazyLoad();
initChrome();
initCursor();
initCharHover();
initContactPage();

window.addEventListener('load', () => {
  initLenis();
});
