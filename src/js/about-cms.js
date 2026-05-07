/*
  about-cms.js — Sanity hydration for src/about.html (KNOCH-027)
  ===============================================================
  Replaces the static markup on the About page with the singleton
  `aboutContent` document from Sanity. The static copy in about.html
  is the deliberate fallback — if the fetch fails, the doc has not
  been published yet, or any individual field is empty, the page
  renders the existing markup unchanged.

  Fields wired:
    - headline       → .about-hero-headline   (supports `*word*` → <em>)
    - subheadline    → .about-hero-sub
    - bio            → .about-intro-body
    - headshot       → injected before .about-intro-body (Sanity CDN)
    - specialties[]  → injected after .about-intro-body  (pill list)
    - yearsExperience → .about-stat[data-stat="years"]   (data-count + label)

  Caller contract: invoke and AWAIT before initAbout() runs so that
  the years stat's data-count target reflects the CMS value when the
  ScrollTrigger counter binds to it. Text-only fields would be safe
  to update post-hoc, but the years stat reads data-count once at
  init time, so the order matters there.
*/

import { getAboutContent, imageUrl } from './sanity.js';

/* Standard HTML-escape — defends against any markup the CMS might
   return. The italic-marker pass below runs on the escaped string so
   `<em>` is the only tag that can land in the output. */
function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* Lightweight markdown-ish convention for headline accents:
   "A working *studio.*" → "A working <em>studio.</em>"
   Authors who want the amber-italic accent (matching the static
   markup) wrap the target word(s) in `*` in Studio. Plain strings
   pass through unchanged — the design just loses the accent. */
function withItalicMarkers(text) {
  return escapeHTML(text).replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function setHeadline(text) {
  const el = document.querySelector('.about-hero-headline');
  if (!el || !text) return;
  el.innerHTML = withItalicMarkers(text);
}

function setSubheadline(text) {
  const el = document.querySelector('.about-hero-sub');
  if (!el || !text) return;
  el.textContent = text;
}

function setBio(text) {
  const el = document.querySelector('.about-intro-body');
  if (!el || !text) return;
  el.textContent = text;
}

/* Headshot — injected as a small framed portrait above the intro
   body. Sanity's CDN serves a width-rendered image via imageUrl().
   We size to 220px for a compact studio-portrait feel and request
   2x for retina (440 src width). */
function setHeadshot(headshot) {
  if (!headshot?.asset?._ref) return;
  const intro = document.querySelector('.about-intro');
  const body  = intro?.querySelector('.about-intro-body');
  if (!intro || !body) return;

  /* Idempotent — drop any prior injection if hydration runs twice. */
  intro.querySelector('.about-intro-headshot')?.remove();

  const fig = document.createElement('figure');
  fig.className = 'about-intro-headshot';
  const img = document.createElement('img');
  img.src = imageUrl(headshot, 440);
  img.alt = 'Knoch Media headshot';
  img.loading = 'lazy';
  img.decoding = 'async';
  fig.appendChild(img);
  intro.insertBefore(fig, body);
}

/* Specialties — injected as a small mono pill row beneath the bio.
   Empty arrays are a no-op so the static page is unaffected. */
function setSpecialties(specialties) {
  if (!Array.isArray(specialties) || specialties.length === 0) return;
  const intro = document.querySelector('.about-intro');
  const body  = intro?.querySelector('.about-intro-body');
  if (!intro || !body) return;

  intro.querySelector('.about-intro-tags')?.remove();

  const ul = document.createElement('ul');
  ul.className = 'about-intro-tags';
  ul.setAttribute('aria-label', 'Specialties');
  specialties.forEach(s => {
    const li = document.createElement('li');
    li.textContent = String(s);
    ul.appendChild(li);
  });
  body.parentNode.insertBefore(ul, body.nextSibling);
}

/* Years stat — overrides both the data-count attribute (read by
   initAbout's stat-counter ScrollTrigger) and the visible inner
   text. Preserves the optional <em> wrap so the styling carries
   over if the static markup uses one. The aria-label is kept in
   sync so screen readers announce the CMS value, not "8 years". */
function setYearsExperience(years) {
  if (!Number.isFinite(years)) return;
  const stat = document.querySelector('.about-stat[data-stat="years"]');
  const num  = stat?.querySelector('.about-stat-n[data-count]');
  if (!num) return;

  num.dataset.count = String(years);
  const hasEm = !!num.querySelector('em');
  const fmt   = years.toLocaleString();
  num.innerHTML = hasEm ? `<em>${fmt}</em>` : fmt;
  num.setAttribute('aria-label', `${fmt} years`);
}

export async function initAboutCMS() {
  /* Page guard — only hydrate if we're actually on about.html. The
     module is intended for the about-main entry only, but guarding
     here makes accidental imports inert. */
  if (!document.querySelector('.about-hero')) return;

  const data = await getAboutContent();
  if (!data) return;

  setHeadline(data.headline);
  setSubheadline(data.subheadline);
  setBio(data.bio);
  setHeadshot(data.headshot);
  setSpecialties(data.specialties);
  setYearsExperience(data.yearsExperience);
}
