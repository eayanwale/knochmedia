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
      toggleActions: 'play none none none',
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
      toggleActions: 'play none none none',
    },
  });

  tiles.forEach(tile => {
    const img = tile.querySelector('.tile-img');
    if (!img) return;

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

    /* Inner image parallax — each tile independently scrubbed */
    gsap.fromTo(img,
      { yPercent: -8 },
      {
        yPercent: 8,
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
