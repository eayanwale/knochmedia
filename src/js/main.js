import { initLenis } from './lenis.js';

// Lenis smooth scroll bootstrapper.
// KNOCH-005 (loader) will move this call inside its onComplete callback
// so Lenis only activates after the intro animation finishes.
// For now, init immediately so all other scroll-triggered sections work.
initLenis();
