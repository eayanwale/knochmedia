/*
  error-main.js — Entry for src/404.html + src/500.html (KNOCH-038)
  ==================================================================
  Minimal entry: chrome (REC ticker + scroll progress + nav links),
  cursor, headline char-hover, footer. No GSAP scroll triggers, no
  Lenis, no Sanity fetches — error pages are short, get out of the
  way. Both 404 and 500 use this same module.
*/

import { initChrome }   from './chrome.js';
import { initCursor }   from './cursor.js';
import { initCharHover } from './char-hover.js';
import { initFooter }   from './footer.js';

initChrome();
initCursor();
initCharHover();
initFooter('expanded');
