/*
  portfolio-grid.js — Archive contact-sheet grid (KNOCH-010)
  ===========================================================
  Scroll animations:
  - Header elements: y 40→0, opacity 0→1, stagger 0.15, trigger top 85%
  - Tiles: y 80→0, opacity 0→1, stagger 0.05, trigger top 88%
  - Per-tile image parallax: yPercent -8→8, scrubbed top-bottom→bottom-top

  The parallax inset is -12% in CSS so the image is oversized in all
  directions — the yPercent travel (±8%) never exposes the tile edge.
  prefers-reduced-motion: reveals are instant; parallax is skipped.
*/

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initPortfolioGrid() {
  const section = document.querySelector('.archive');
  if (!section) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const header = section.querySelector('.archive-header');
  const grid   = section.querySelector('.archive-grid');
  const tiles  = section.querySelectorAll('.tile');

  /* Header elements reveal */
  gsap.from([
    section.querySelector('.archive-headline'),
    section.querySelector('.archive-meta'),
  ].filter(Boolean), {
    y: 40,
    opacity: 0,
    stagger: 0.15,
    duration: 1.2,
    ease: 'expo.out',
    scrollTrigger: {
      trigger: header,
      start: 'top 85%',
    },
  });

  /* Tile scroll reveal — staggered y offset */
  gsap.from(tiles, {
    y: 80,
    opacity: 0,
    duration: 1.2,
    ease: 'expo.out',
    stagger: 0.05,
    scrollTrigger: {
      trigger: grid,
      start: 'top 88%',
    },
  });

  /* Inner image parallax — each tile independently scrubbed */
  tiles.forEach(tile => {
    const img = tile.querySelector('.tile-img');
    if (!img) return;

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
