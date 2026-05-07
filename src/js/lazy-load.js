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

/* WebP support detection (KNOCH-019).
 * Set once on first call to _supportsWebp() — cached for the page
 * lifetime. Used to decide whether to swap a /foo.jpg URL for the
 * pre-generated /foo.webp sibling. The .webp sibling is created by
 * scripts/optimize-images.mjs at quality 80 and lives next to the
 * source file in src/public/assets/.
 *
 * Detection method: a 1×1 lossy WebP data URL. If the browser can
 * decode it (Image.complete && naturalWidth > 0 after a sync .src
 * assignment), it speaks WebP. This is the canonical pre-modernizr
 * test - works in Safari 14+, Chrome, Firefox, Edge. Older Safari
 * (12, 13) returns false and falls back to the source format.
 *
 * For Sanity CDN URLs (?w=… params already negotiate format), we
 * skip the rewrite entirely — Sanity serves WebP / AVIF natively
 * via Accept: image/webp content negotiation. */
let _webpSupport = null;

function _supportsWebp() {
  if (_webpSupport !== null) return _webpSupport;
  try {
    const probe = new Image();
    probe.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
    _webpSupport = probe.complete && probe.naturalWidth > 0;
  } catch {
    _webpSupport = false;
  }
  return _webpSupport;
}

/* Rewrite a same-origin asset URL to its .webp sibling if (a) the
 * browser supports WebP and (b) the URL ends in .jpg / .jpeg / .png
 * AND lives under /assets/ (the directory the optimizer covers).
 * Returns the original URL unchanged when either gate fails. */
function _toWebpIfPossible(url) {
  if (!url || typeof url !== 'string') return url;
  /* Sanity CDN already serves modern formats - leave its URLs alone. */
  if (url.includes('cdn.sanity.io')) return url;
  if (!_supportsWebp()) return url;

  const m = url.match(/^(\/assets\/[^?#]+)\.(jpe?g|png)(.*)$/i);
  if (!m) return url;
  return `${m[1]}.webp${m[3]}`;
}

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
  const sourceUrl = el.dataset.bg;
  if (!sourceUrl) return;

  /* Rewrite to .webp sibling when the browser supports it AND the
     asset lives under /assets/. The Sanity CDN guard inside
     _toWebpIfPossible() prevents rewrites of Sanity URLs (which do
     their own format negotiation via Accept headers + ?auto=format
     params). On WebP-supporting browsers this loads the optimised
     sibling created by scripts/optimize-images.mjs at quality 80,
     typically 70-95% smaller than the JPG/PNG source. */
  const url = _toWebpIfPossible(sourceUrl);

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
    /* WebP rewrite missed (.webp sibling didn't exist because the
       optimizer hasn't run yet, or 404'd) - retry once with the
       original source URL before giving up. Keeps the page working
       when an asset is added without re-running the optimizer. */
    if (url !== sourceUrl) {
      const retry = new Image();
      retry.onload = () => {
        el.style.backgroundImage = `url('${sourceUrl}')`;
        el.classList.remove('lazy-placeholder');
        el.classList.add('lazy-loaded');
      };
      retry.onerror = () => {
        el.style.backgroundImage = `url('${sourceUrl}')`;
        el.classList.remove('lazy-placeholder');
        el.classList.add('lazy-loaded');
      };
      retry.src = sourceUrl;
      return;
    }
    // Fallback: apply image anyway (browser handles broken state)
    el.style.backgroundImage = `url('${sourceUrl}')`;
    el.classList.remove('lazy-placeholder');
    el.classList.add('lazy-loaded');
  };

  img.src = url;
}
