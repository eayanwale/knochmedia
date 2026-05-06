/**
 * lazy-load.js — IntersectionObserver-based lazy loading for background-image elements.
 *
 * Instead of a shimmer or blur-up placeholder, a crosshatch pencil-sketch
 * CSS texture is shown until the real image loads — tying into the artist/
 * darkroom visual language of the site.
 *
 * Usage: Add data-bg="/path/to/image.jpg" to any element that should lazy-load.
 * The element receives .lazy-placeholder class initially (showing crosshatch),
 * then .lazy-loaded once the image resolves (crosshatch fades out).
 *
 * For dynamically created elements (e.g. reel cards from Sanity), call
 * observeElement(el) after appending to DOM, or loadBgImage(el, url) to
 * skip intersection and load immediately.
 */

let observer;

/**
 * Initialize lazy loading for all [data-bg] elements currently in the DOM.
 * Safe to call multiple times — already-observed elements are skipped.
 */
export function initLazyLoad() {
  const targets = document.querySelectorAll('[data-bg]:not(.lazy-placeholder):not(.lazy-loaded)');
  if (!targets.length) return;

  if (!observer) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        _loadImage(entry.target);
      });
    }, {
      rootMargin: '200px 0px', // Start loading 200px before visible
      threshold: 0,
    });
  }

  targets.forEach(el => {
    el.classList.add('lazy-placeholder');
    observer.observe(el);
  });
}

/**
 * Observe a single element for lazy-load (use for dynamically created DOM).
 * @param {HTMLElement} el — Must have data-bg attribute set.
 */
export function observeElement(el) {
  if (!el || !el.dataset.bg) return;
  if (!observer) initLazyLoad(); // Ensure observer exists
  el.classList.add('lazy-placeholder');
  observer.observe(el);
}

/**
 * Immediately load a background image on an element (skip intersection).
 * Useful for above-the-fold dynamic content.
 * @param {HTMLElement} el — Target element.
 * @param {string} url — Image URL to load.
 */
export function loadBgImage(el, url) {
  if (!el) return;
  el.dataset.bg = url;
  el.classList.add('lazy-placeholder');
  _loadImage(el);
}

/**
 * Internal: preload via Image() constructor, then apply background-image
 * and swap classes for the CSS crosshatch→loaded transition.
 */
function _loadImage(el) {
  const url = el.dataset.bg;
  if (!url) return;

  const img = new Image();

  img.onload = () => {
    el.style.backgroundImage = `url('${url}')`;
    // Small RAF delay ensures the browser has painted the placeholder
    // before we trigger the opacity transition (prevents flash)
    requestAnimationFrame(() => {
      el.classList.remove('lazy-placeholder');
      el.classList.add('lazy-loaded');
    });
  };

  img.onerror = () => {
    // Fallback: apply image anyway (browser handles broken state)
    el.style.backgroundImage = `url('${url}')`;
    el.classList.remove('lazy-placeholder');
    el.classList.add('lazy-loaded');
  };

  img.src = url;
}
