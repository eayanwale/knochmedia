/*
  portfolio-grid.js — Archive contact-sheet grid (KNOCH-010)
  ===========================================================
  Scroll animations:

  Header — per-element slide-up clip reveal:
    JS wraps .archive-headline and .archive-meta in .archive-clip divs
    (overflow: hidden), then animates y: 110% → 0% in stagger so each
    element wipes up from below its clip boundary like a curtain lift.

  Tiles — darkroom "develop" effect:
    Each tile's .tile-img starts as overexposed B&W (grayscale(1)
    brightness(1.6)) and resolves to its normal resting state
    (grayscale(0.5) brightness(0.7)) as it enters the viewport.
    clearProps: 'filter' removes the inline style on completion so
    the hover CSS transition (grayscale(0) brightness(1)) works.

  Tiles — container reveal:
    Staggered y + opacity fade on .tile wrappers (separate property
    from .tile-img filter — no GSAP conflict).

  Per-tile image parallax: yPercent -8→8, scrubbed top-bottom→bottom-top.

  prefers-reduced-motion: all reveals are instant; parallax is skipped.
*/

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getGalleryCollections, imageUrl } from './sanity.js';
import { initLazyLoad } from './lazy-load.js';

gsap.registerPlugin(ScrollTrigger);

function handleTileClick(tile) {
  const type = tile.dataset.linkType;
  const url  = tile.dataset.url;
  if (!url) return;

  if (type === 'external-gallery' || type === 'youtube') {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    window.location.href = url;
  }
}


export function initPortfolioGrid() {
  const section = document.querySelector('.archive');
  if (!section) return;

  // ── Sanity image override ─────────────────────────────────────────────
  // Fetch gallery collections from CMS — match tiles by URL to ensure the
  // correct cover image maps to the correct tile regardless of Sanity order.
  // Tiles without a Sanity counterpart (e.g. Woodsmen, Jojo's Graduation)
  // keep their static fallback paths in data-bg untouched.
  getGalleryCollections().then(collections => {
    if (!collections.length) return;

    const tiles = section.querySelectorAll('.tile');
    tiles.forEach(tile => {
      const tileUrl = tile.dataset.url;
      if (!tileUrl) return; // No URL = no Sanity match possible, use static

      // Match by URL — exact match for same-domain links, video ID
      // extraction for YouTube cross-format (youtu.be vs youtube.com)
      const col = collections.find(c => {
        if (!c.url) return false;
        const sanityUrl = c.url.replace(/\/+$/, '');
        const htmlUrl = tileUrl.replace(/\/+$/, '');
        if (sanityUrl === htmlUrl) return true;
        // YouTube: extract video ID from both and compare
        const sId = sanityUrl.match(/(?:youtu\.be\/|[?&]v=)([A-Za-z0-9_-]+)/)?.[1];
        const hId = htmlUrl.match(/(?:youtu\.be\/|[?&]v=)([A-Za-z0-9_-]+)/)?.[1];
        return !!(sId && hId && sId === hId);
      });

      if (!col || !col.coverImage) return;

      const img = tile.querySelector('.tile-img');
      if (!img) return;

      // Swap data-bg with Sanity CDN URL (1200px wide, auto-format)
      const cdnUrl = imageUrl(col.coverImage, 1200);
      if (cdnUrl) {
        img.dataset.bg = cdnUrl;
        // If already loaded (lazy-load ran before Sanity resolved),
        // re-apply the background image from the new CDN source
        if (img.classList.contains('lazy-loaded')) {
          img.style.backgroundImage = `url('${cdnUrl}')`;
        } else if (!img.classList.contains('lazy-placeholder')) {
          // Not yet observed — re-run lazy-load to pick up new URL
          initLazyLoad();
        }
      }
    });
  });


  section.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('click', () => handleTileClick(tile));
    tile.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTileClick(tile); }
    });
  });

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const header   = section.querySelector('.archive-header');
  const grid     = section.querySelector('.archive-grid');
  const tiles    = section.querySelectorAll('.tile');
  const headline = section.querySelector('.archive-headline');
  const meta     = section.querySelector('.archive-meta');

  /* Per-element clip wipe-up — clipPath avoids any DOM restructure that would
     break the flex layout of .archive-header. Animates from fully clipped
     (bottom 100% hidden) to fully revealed. Subtle y rise layered on top. */
  gsap.from([headline, meta].filter(Boolean), {
    clipPath: 'inset(0 0 100% 0)',
    y: 24,
    stagger: 0.14,
    duration: 1.2,
    ease: 'expo.out',
    scrollTrigger: {
      trigger: header,
      start: 'top 85%',
      toggleActions: 'restart none none reverse',
    },
  });

  /* Tile container: staggered rise into view */
  gsap.from(tiles, {
    y: 50,
    opacity: 0,
    duration: 1.1,
    ease: 'expo.out',
    stagger: { from: 'start', amount: 0.5 },
    scrollTrigger: {
      trigger: grid,
      start: 'top 88%',
      toggleActions: 'restart none none reverse',
    },
  });

  tiles.forEach(tile => {
    const img = tile.querySelector('.tile-img');
    if (!img) return;

    /* Magnetic cursor zoom — image pans and scales toward cursor position.
       xPercent / yPercent compose with the yPercent parallax tween safely
       because GSAP tracks each axis independently in its transform matrix. */
    tile.addEventListener('mouseenter', () => {
      gsap.to(img, { scale: 1.012, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
    });
    tile.addEventListener('mousemove', (e) => {
      const r = tile.getBoundingClientRect();
      const xRel = (e.clientX - r.left) / r.width - 0.5;
      const yRel = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(img, {
        xPercent: xRel * 2,
        yPercent: yRel * 2,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    });
    tile.addEventListener('mouseleave', () => {
      gsap.to(img, {
        scale: 1, xPercent: 0, yPercent: 0,
        duration: 0.7, ease: 'power2.out', overwrite: 'auto',
      });
    });

    /* Darkroom develop — overexposed B&W resolves to normal resting state */
    gsap.fromTo(img,
      { filter: 'grayscale(1) brightness(1.6)' },
      {
        filter: 'grayscale(0.5) brightness(0.7)',
        duration: 1.6,
        ease: 'expo.out',
        clearProps: 'filter',
        scrollTrigger: {
          trigger: tile,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
      }
    );

    /* Inner image parallax — depth-variable (KNOCH-030).
       data-depth controls parallax intensity:
         depth 1 = ±4% (subtle, background feel)
         depth 2 = ±8% (default, medium movement)
         depth 3 = ±12% (dramatic, foreground feel)
       The -12% inset on .tile-img provides room for max range. */
    const depth = parseInt(tile.dataset.depth, 10) || 2;
    const range = depth * 4;

    gsap.fromTo(img,
      { yPercent: -range },
      {
        yPercent: range,
        ease: 'none',
        scrollTrigger: {
          trigger: tile,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });
}
