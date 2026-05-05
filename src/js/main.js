import { initLenis } from './lenis.js';
import { initChrome } from './chrome.js';

// Lenis smooth scroll — KNOCH-005 (loader) will move this call inside
// its onComplete callback so it only activates after the intro finishes.
initLenis();

// Chrome navigation + timecode bar
initChrome();
