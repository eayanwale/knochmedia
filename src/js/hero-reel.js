/*
  hero-reel.js — Hero PLAY REEL CTA wiring (KNOCH-017)
  =====================================================
  Idempotent init: looks up the .hero-reel button, paints its
  YouTube maxres thumbnail as the background image, and wires a
  click → openVideoLightbox(id, button) handler.

  The video ID is read from the data-youtube-id attribute on the
  button so the markup is the single source of truth — a future
  edit (e.g. "use a different showreel") is a one-line HTML change
  with no JS deploy.

  The thumbnail is painted in JS rather than inline-styled in HTML
  so that:
    - we can fall back to /vi/<id>/hqdefault.jpg if maxres 404s
      (some shorter videos don't have a maxres thumbnail), and
    - the URL stays derived from the video ID rather than being
      duplicated in markup.

  Reveal: this module does NOT animate the button in. The hero
  reveal timeline in hero.js handles fade-in alongside the rest of
  the hero copy. Keeps the choreography in one place.
*/

import { openVideoLightbox } from './video-lightbox.js';

const MAXRES_URL = (id) => `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
const HQ_URL     = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

export function initHeroReel() {
  const btn = document.querySelector('.hero-reel');
  if (!btn) return;

  const id = btn.dataset.youtubeId;
  if (!id) {
    /* No ID set — bail without binding so the empty button doesn't
       open an "Invalid video ID" lightbox on click. The HTML can
       optionally hide the button via the same data attribute being
       missing — checked here belt-and-braces. */
    btn.hidden = true;
    return;
  }

  /* Probe the maxres thumbnail. YouTube returns a 120×90 grey "no
     thumbnail" placeholder via 200 OK rather than 404 when maxres
     is missing — we detect that by image dimensions and fall back
     to hqdefault, which is always present for any public video. */
  const probe = new Image();
  probe.onload = () => {
    const url = probe.naturalWidth > 120 ? MAXRES_URL(id) : HQ_URL(id);
    btn.style.backgroundImage = `url('${url}')`;
  };
  probe.onerror = () => {
    btn.style.backgroundImage = `url('${HQ_URL(id)}')`;
  };
  probe.src = MAXRES_URL(id);

  /* Click → open lightbox. Pass the button as the trigger so focus
     returns here on close (KNOCH-012 lightbox respects this). */
  btn.addEventListener('click', () => {
    openVideoLightbox(id, btn);
  });
}
