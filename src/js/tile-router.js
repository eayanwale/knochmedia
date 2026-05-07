/*
  tile-router.js — Central click-routing for portfolio + archive tiles
  =====================================================================
  Used by:
    - portfolio.html cards (.portfolio-card[data-project-id])
    - homepage archive tiles (.tile[data-project-id])
    - homepage reel cards (any .reel-card[data-project-id])

  Routing rules:
    - Card has data-project-id → look up project in projects.js
      - project.type === 'video' → openVideoLightbox(youtubeId)
      - project.type === 'photo' → expanding-tile transition →
                                   navigate to /project.html?id=<slug>
    - No project-id (legacy tile or unmatched) → no-op or fall back to
                                                   data-href if present

  Expanding-tile transition (KNOCH-012 "wow" interaction):
    1. Capture the clicked tile's bounding rect.
    2. Clone the tile's image (keeps the original tile in place so
       the user's existing scroll position is unchanged).
    3. Position the clone fixed at the original coords.
    4. Animate clone with GSAP fromTo to inset:0 (full viewport) over
       0.55s with power3.inOut.
    5. Mid-animation, fade in a black veil to mask the moment of page
       navigation.
    6. On animation complete, set window.location.href to the project
       URL — the new page loads under the black veil and fades it out
       in its own entry timeline.

  prefers-reduced-motion: skip the transition and navigate immediately.

  Filter persistence: portfolio.html stores its active filter in the
  URL hash (KNOCH-011), so the back button on project.html
  (history.back()) automatically restores the same filtered view.
*/

import { gsap } from 'gsap';
import { getProject } from './projects.js';
import { openVideoLightbox } from './video-lightbox.js';

const TRANSITION_DURATION_S = 0.55;

function _navigateToProject(slug) {
  window.location.href = `/project.html?id=${encodeURIComponent(slug)}`;
}

/* Run the expanding-tile transition then navigate. The clone is
   appended to <body> so it floats above the page chrome; we keep the
   original tile visible underneath so the eye sees a continuous
   element rather than a teleporting one. */
function _transitionAndNavigate(tile, slug) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* KNOCH-041: mobile skips the transition entirely. The clone-+-veil
     overlay was getting preserved by Safari's bfcache when the user
     hit "back to works", leaving the project image stuck on screen
     with the rest of the page hidden behind it. Plain navigation is
     reliable on touch and the page-load veil fade on /project.html
     gives a clean enough seam without the clone gymnastics. */
  const isMobile = window.matchMedia('(max-width: 800px)').matches;
  if (prefersReduced || isMobile) {
    _navigateToProject(slug);
    return;
  }

  /* Find the cover image element inside the tile. portfolio-card uses
     .portfolio-card-img; archive tiles use .tile-img; reel cards use
     .reel-card-img. Fall back to the tile itself if none match. */
  const img = tile.querySelector('.portfolio-card-img, .tile-img, .reel-card-img') ?? tile;
  const rect = tile.getBoundingClientRect();

  /* Build a fresh clone of just the image element with the same
     background-image — avoids cloning the label / hover state and
     keeps the transition focused on the visual subject.
     The .tile-router-overlay class is the cleanup hook used by the
     pageshow listener below to scrub leftover clones when Safari
     restores the page from bfcache (KNOCH-041). */
  const clone = document.createElement('div');
  clone.className = 'tile-router-overlay';
  clone.style.position = 'fixed';
  clone.style.top = `${rect.top}px`;
  clone.style.left = `${rect.left}px`;
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.backgroundImage = getComputedStyle(img).backgroundImage;
  clone.style.backgroundSize = 'cover';
  clone.style.backgroundPosition = 'center';
  clone.style.zIndex = '12000';
  clone.style.transformOrigin = 'top left';
  clone.style.willChange = 'top, left, width, height, transform';
  clone.style.pointerEvents = 'none';
  document.body.appendChild(clone);

  /* Black veil — fades in over the second half of the transition so
     the page navigation cuts behind it rather than under a still
     visible page. Same cleanup-class hook as the clone above. */
  const veil = document.createElement('div');
  veil.className = 'tile-router-overlay';
  veil.style.position = 'fixed';
  veil.style.inset = '0';
  veil.style.background = '#0a0a0a';
  veil.style.zIndex = '11999';
  veil.style.opacity = '0';
  veil.style.pointerEvents = 'none';
  document.body.appendChild(veil);

  gsap.to(clone, {
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    duration: TRANSITION_DURATION_S,
    ease: 'power3.inOut',
  });

  gsap.to(veil, {
    opacity: 1,
    duration: TRANSITION_DURATION_S * 0.6,
    delay: TRANSITION_DURATION_S * 0.4,
    ease: 'power2.in',
    onComplete: () => _navigateToProject(slug),
  });
}

/* Public handler — wire this to click + Enter/Space on any element
   carrying data-project-id. Looks up the project, branches to
   lightbox or transition+navigate. */
export function handleTileActivate(tile) {
  const id = tile?.dataset?.projectId;
  if (!id) {
    /* Fallback: if tile has data-href (legacy), open it in a new tab */
    const href = tile?.dataset?.href;
    if (href) window.open(href, '_blank', 'noopener,noreferrer');
    return;
  }

  const project = getProject(id);
  if (!project) {
    console.warn(`[tile-router] No project found for id="${id}"`);
    return;
  }

  if (project.type === 'video' && project.youtubeId) {
    openVideoLightbox(project.youtubeId, tile);
    return;
  }

  /* photo or unspecified type — go to project.html */
  _transitionAndNavigate(tile, project.id);
}

/* Convenience binder — call from any module that has a NodeList of
   tiles. Wires both click and Enter/Space activation. */
export function bindTileRouter(tiles) {
  tiles.forEach(tile => {
    tile.addEventListener('click', () => handleTileActivate(tile));
    tile.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleTileActivate(tile);
      }
    });
  });
}

/* bfcache cleanup (KNOCH-041).
   Reproduction: visitor on /portfolio.html clicks a tile -> the
   transition appends a .tile-router-overlay clone + black veil to
   <body> at z-index 12000 just before navigation. They land on
   /project.html, then hit the back button. Safari restores
   /portfolio.html from bfcache (window.history.back without a fresh
   fetch) - and bfcache restores the WHOLE document, including those
   leftover overlay divs that were on body when the page froze. The
   visitor sees the project image stuck on screen with the rest of
   the page hidden behind it.

   Fix: pageshow with event.persisted === true means we're being
   restored from bfcache. Sweep any .tile-router-overlay descendants
   of body and remove them. Body scroll lock (if any was applied) is
   also released - defensive, the lock-release path runs in
   _initMobileNav's close() but a bfcache restore could re-mount the
   page with .nav-overlay-open still on body if the menu was open
   when the visitor navigated away.

   Listener registered at module scope so it fires once per page
   load no matter which entry imports tile-router. */
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  document.querySelectorAll('.tile-router-overlay').forEach(el => el.remove());
  document.body.classList.remove('nav-overlay-open');
  document.body.style.overflow = '';
});
