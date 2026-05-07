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
import { handleTileActivate } from './tile-router.js';

gsap.registerPlugin(ScrollTrigger);


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


  /* Tile activation routes through the central tile-router (KNOCH-012):
     video projects open the lightbox, photo projects expand into the
     project.html page via the GSAP transition. Any tile lacking
     data-project-id falls back to no-op (the router handles it). */
  section.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('click', () => handleTileActivate(tile));
    tile.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTileActivate(tile); }
    });
  });

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* KNOCH-041: mobile bails before any scroll-tied tweens run. Tiles are
     already in the DOM with full opacity (CSS default); the GSAP from()
     timelines below would normally drive the hidden initial state, but on
     mobile we skip that entirely so tiles just appear when scrolled to. */
  const isMobile       = window.matchMedia('(max-width: 800px)').matches;
  if (prefersReduced || isMobile) return;

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

  /* Subtle ambient float — each tile bobs independently on yPercent
     (separate from the entry tween's y-pixel transform, so they compose
     cleanly without overwriting each other). Pseudo-random durations
     keep the tiles out of phase so the grid feels alive rather than
     pulsing in unison. Range stays at ~3% of tile height — small enough
     not to disturb hover targeting, big enough to read on the larger
     tiles (t1, t6, t7).
     Using yPercent here also avoids conflict with the .tile-img yPercent
     parallax inside each tile, since those target different elements. */
  tiles.forEach((tile, i) => {
    gsap.to(tile, {
      yPercent: -3 - (i % 2),                  // -3 or -4
      duration: 3.8 + (i % 3) * 0.7,           // 3.8 - 5.2s
      delay: -((i * 0.42) % 4),                // negative delay desyncs phases
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
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
