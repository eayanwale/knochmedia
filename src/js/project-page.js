/*
  project-page.js — /project.html runtime (KNOCH-012)
  =====================================================
  Reads the ?id= URL parameter, looks up the project in projects.js,
  and populates the page. Also fades the entry veil once the page is
  ready and wires the "Back to work" link to history.back().

  Page DOM is mostly empty placeholders that this script fills in:
    .project-hero-img         — bg-image style
    .project-hero-meta        — category label
    .project-hero-title       — project title
    .project-hero-sub         — location · date
    .project-meta-cat         — category badge
    .project-meta-title       — title (sticky column)
    .project-meta-sub         — location
    .project-meta-spec dl     — Date / Frames / Location rows
    .project-meta-desc        — description paragraph
    .project-meta-link        — "View full gallery →" (if galleryUrl)
    .project-gallery          — built from project.images[]

  If id is missing or unknown, the page redirects to /portfolio.html so
  the user lands somewhere useful instead of an empty shell.
*/

import { gsap } from 'gsap';
import { getProject } from './projects.js';

export function initProjectPage() {
  const veil = document.querySelector('.project-veil');
  const hero = document.querySelector('.project-hero');
  if (!hero) return; /* not on the project page */

  /* ── Fade the entry veil so the cross-page transition lands ──
     The previous page's tile-router applied a black veil over the
     viewport just before navigation; this page paints with the same
     veil opaque, then tweens it out so the seam is invisible. */
  if (veil) {
    /* Start opaque so the new page's layout doesn't flash before the
       fade-out begins. Inline style overrides the CSS default of 0. */
    veil.style.opacity = '1';
    requestAnimationFrame(() => {
      gsap.to(veil, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => {
          /* Remove from layout entirely — the veil has pointer-events
             none so this is purely a cleanup step. */
          veil.style.display = 'none';
        },
      });
    });
  }

  /* ── Read ?id from URL ────────────────────────────────── */

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const project = id ? getProject(id) : null;

  if (!project) {
    /* No id or unknown id — bounce to portfolio so the user lands
       somewhere meaningful. This keeps share-link mistakes (typos,
       deleted projects) from showing a broken empty shell. */
    window.location.replace('/portfolio.html');
    return;
  }

  /* ── Populate hero ─────────────────────────────────── */

  const heroImg   = document.querySelector('.project-hero-img');
  const heroMeta  = document.querySelector('.project-hero-meta');
  const heroTitle = document.querySelector('.project-hero-title');
  const heroSub   = document.querySelector('.project-hero-sub');

  if (heroImg) heroImg.style.backgroundImage = `url('${project.cover}')`;
  if (heroMeta) heroMeta.textContent = `— ${(project.category || '').toUpperCase()}`;
  if (heroTitle) heroTitle.textContent = project.title;
  if (heroSub) {
    const parts = [project.location, project.date].filter(Boolean);
    heroSub.textContent = parts.join(' · ');
  }

  /* ── Populate metadata column ─────────────────────── */

  const mCat   = document.querySelector('.project-meta-cat');
  const mTitle = document.querySelector('.project-meta-title');
  const mSub   = document.querySelector('.project-meta-sub');
  const mSpec  = document.querySelector('.project-meta-spec');
  const mDesc  = document.querySelector('.project-meta-desc');
  const mLink  = document.querySelector('.project-meta-link');

  if (mCat)   mCat.textContent   = (project.category || '').toUpperCase();
  if (mTitle) mTitle.textContent = project.title;
  if (mSub)   mSub.textContent   = project.location ?? '';

  /* Spec list — date / frames / location, only render rows we have data for */
  if (mSpec) {
    const rows = [];
    if (project.date)            rows.push(['Date',     project.date]);
    if (project.frames != null)  rows.push(['Frames',   project.frames.toLocaleString()]);
    if (project.location)        rows.push(['Location', project.location]);
    mSpec.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  }

  if (mDesc) mDesc.textContent = project.description ?? '';

  /* Optional "View full gallery" link — only render when galleryUrl is set */
  if (mLink) {
    if (project.galleryUrl) {
      mLink.href = project.galleryUrl;
      mLink.target = '_blank';
      mLink.rel = 'noopener noreferrer';
    } else {
      mLink.style.display = 'none';
    }
  }

  /* ── Populate gallery ────────────────────────────── */

  const gallery = document.querySelector('.project-gallery');
  if (gallery && Array.isArray(project.images) && project.images.length) {
    gallery.innerHTML = project.images.map((src, i) => {
      /* Every third image gets the landscape ratio for editorial rhythm */
      const landscape = i % 3 === 2 ? ' is-landscape' : '';
      return `<div class="project-gallery-img${landscape}" style="background-image: url('${src}')" role="img" aria-label="Project image ${i + 1}"></div>`;
    }).join('');
  } else if (gallery) {
    /* No gallery images — show a graceful fallback rather than an empty grid */
    gallery.innerHTML =
      '<p style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.2em;color:rgba(237,230,216,0.5);">' +
      'Gallery coming soon &mdash; full set available via the link in the project metadata.' +
      '</p>';
  }

  /* ── Back link ─────────────────────────────────── */

  const backLink = document.querySelector('.project-back');
  if (backLink) {
    backLink.addEventListener('click', (e) => {
      /* Use history.back() when there's a referrer so the visitor returns
         to /portfolio.html with their hash filter intact. Fall back to a
         direct portfolio.html navigation if there's no back history (e.g.
         the user opened this URL directly). */
      if (document.referrer && window.history.length > 1) {
        e.preventDefault();
        window.history.back();
      }
      /* else — let the href="/portfolio.html" navigate normally */
    });
  }

  /* ── Update document title for share / bookmark ─── */
  document.title = `${project.title} — Knoch Media`;
}
