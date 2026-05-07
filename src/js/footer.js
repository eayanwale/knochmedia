/*
  footer.js — Shared footer module (KNOCH-015)
  ============================================
  Two variants:
    'minimal'  — homepage credits bar (3-col + social row).
    'expanded' — secondary pages sitemap (4-col + copyright line).

  Wired by each page's main.js entry. Mounts into <footer id="site-footer">
  (placed at the bottom of the page <body> in HTML), so the footer DOM is
  centralised in one module — copy / icons / version / roll number live
  in the constants block below and propagate to every page on rebuild.

  ROLL_NUMBER + LAST_UPDATED are intentionally simple top-of-file consts
  so a non-engineer can bump them in a one-line edit without learning the
  module shape. The "Roll № 07 / 2026" line is a cinematic affectation
  per the ticket — implies the studio is on its 7th roll of film this
  year, reinforcing the film-photography brand voice.
*/

/* ── Editable constants ─────────────────────────────────────
   Bump these when the studio increments a roll, ships a release,
   or wants to update copy. No JS knowledge required. */
const ROLL_NUMBER  = '07';
const ROLL_YEAR    = '2026';
const SITE_VERSION = '02.04';
const LAST_UPDATED = 'May';     /* short month — full year is in ROLL_YEAR */
const COPYRIGHT_YEAR = '2026';

const CONTACT = {
  email:        'hello@knoch.media',
  emailMailto:  'mailto:hello@knoch.media',
  city:         'College Park, MD',
  region:       'East Coast available',
};

const SOCIAL = {
  instagram: {
    handle: '@knochmedia_',
    url:    'https://www.instagram.com/knochmedia_/',
    label:  'Instagram',
  },
  youtube: {
    url:    'https://www.youtube.com/@knochmedia',
    label:  'YouTube',
  },
};

/* Inline SVGs — 18×18 px, currentColor so CSS can colour the fill via
   the parent <a>. Inline (rather than icon font / sprite) keeps the
   footer self-contained and avoids an extra HTTP request. Paths are
   the canonical Simple Icons / Feather flavours, simplified slightly. */
const ICON_INSTAGRAM = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M12 2.2c3.2 0 3.6.012 4.85.07 1.17.054 1.81.249 2.23.413.56.218.96.479 1.38.9.42.42.682.82.9 1.38.164.42.36 1.06.413 2.23.058 1.25.07 1.65.07 4.85s-.012 3.6-.07 4.85c-.054 1.17-.249 1.81-.413 2.23a3.71 3.71 0 0 1-.9 1.38 3.71 3.71 0 0 1-1.38.9c-.42.164-1.06.36-2.23.413-1.25.058-1.65.07-4.85.07s-3.6-.012-4.85-.07c-1.17-.054-1.81-.249-2.23-.413a3.71 3.71 0 0 1-1.38-.9 3.71 3.71 0 0 1-.9-1.38c-.164-.42-.36-1.06-.413-2.23C2.212 15.6 2.2 15.2 2.2 12s.012-3.6.07-4.85c.054-1.17.249-1.81.413-2.23.218-.56.479-.96.9-1.38.42-.42.82-.682 1.38-.9.42-.164 1.06-.36 2.23-.413C8.4 2.212 8.8 2.2 12 2.2zM12 0C8.74 0 8.33.014 7.05.072 5.78.13 4.9.333 4.14.63a5.91 5.91 0 0 0-2.13 1.39A5.91 5.91 0 0 0 .63 4.14C.333 4.9.13 5.78.072 7.05.014 8.33 0 8.74 0 12s.014 3.67.072 4.95c.058 1.27.261 2.15.558 2.91.302.78.71 1.44 1.39 2.13a5.91 5.91 0 0 0 2.13 1.39c.76.297 1.64.5 2.91.558C8.33 23.986 8.74 24 12 24s3.67-.014 4.95-.072c1.27-.058 2.15-.261 2.91-.558a5.91 5.91 0 0 0 2.13-1.39 5.91 5.91 0 0 0 1.39-2.13c.297-.76.5-1.64.558-2.91.058-1.28.072-1.69.072-4.95s-.014-3.67-.072-4.95c-.058-1.27-.261-2.15-.558-2.91a5.91 5.91 0 0 0-1.39-2.13A5.91 5.91 0 0 0 19.86.63C19.1.333 18.22.13 16.95.072 15.67.014 15.26 0 12 0z"/>
    <path d="M12 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/>
    <circle cx="18.41" cy="5.59" r="1.44"/>
  </svg>`;

const ICON_YOUTUBE = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.016 3.016 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.546 15.568V8.432L15.818 12l-6.272 3.568z"/>
  </svg>`;

/* ── Templates ────────────────────────────────────────────── */

function renderMinimal() {
  return `
    <div class="footer-inner footer-inner--minimal">
      <div class="footer-grid footer-grid--3">

        <div class="footer-col footer-col--studio">
          <p class="footer-strong">Knoch · A Working Studio</p>
          <p>${CONTACT.city}</p>
          <p>${CONTACT.region}</p>
        </div>

        <div class="footer-col footer-col--contact">
          <p class="footer-strong">Contact</p>
          <p><a href="${CONTACT.emailMailto}">${CONTACT.email}</a></p>
        </div>

        <div class="footer-col footer-col--roll">
          <p class="footer-strong">Roll № ${ROLL_NUMBER} / ${ROLL_YEAR}</p>
          <p>v ${SITE_VERSION} — last updated ${LAST_UPDATED}</p>
          <p aria-hidden="true">—</p>
        </div>

      </div>

      <div class="footer-social" role="list" aria-label="Social links">
        <a class="footer-social-link"
           role="listitem"
           href="${SOCIAL.instagram.url}"
           target="_blank" rel="noopener noreferrer"
           aria-label="${SOCIAL.instagram.label} — ${SOCIAL.instagram.handle}">
          ${ICON_INSTAGRAM}
          <span class="footer-social-handle">${SOCIAL.instagram.handle}</span>
        </a>
        <a class="footer-social-link"
           role="listitem"
           href="${SOCIAL.youtube.url}"
           target="_blank" rel="noopener noreferrer"
           aria-label="${SOCIAL.youtube.label}">
          ${ICON_YOUTUBE}
        </a>
      </div>
    </div>
  `;
}

function renderExpanded() {
  return `
    <div class="footer-inner footer-inner--expanded">
      <div class="footer-grid footer-grid--4">

        <div class="footer-col footer-col--studio">
          <p class="footer-strong">Knoch · A Working Studio</p>
          <p>${CONTACT.city}</p>
          <p>${CONTACT.region}</p>
          <p class="footer-roll">Roll № ${ROLL_NUMBER} / ${ROLL_YEAR}</p>
        </div>

        <nav class="footer-col footer-col--nav" aria-label="Work">
          <p class="footer-strong">Work</p>
          <ul>
            <li><a href="/portfolio.html#weddings">Weddings</a></li>
            <li><a href="/portfolio.html#brand">Brand &amp; Sports</a></li>
            <li><a href="/portfolio.html#music">Music</a></li>
          </ul>
        </nav>

        <nav class="footer-col footer-col--nav" aria-label="Studio">
          <p class="footer-strong">Studio</p>
          <ul>
            <li><a href="/about.html">About</a></li>
            <li><a href="/about.html#process">Process</a></li>
            <li><span class="footer-placeholder" aria-disabled="true">Journal — soon</span></li>
          </ul>
        </nav>

        <div class="footer-col footer-col--contact">
          <p class="footer-strong">Contact</p>
          <p><a href="${CONTACT.emailMailto}">${CONTACT.email}</a></p>
          <p>
            <a class="footer-inline-social"
               href="${SOCIAL.instagram.url}"
               target="_blank" rel="noopener noreferrer"
               aria-label="${SOCIAL.instagram.label} — ${SOCIAL.instagram.handle}">
              ${ICON_INSTAGRAM}
              <span class="footer-social-handle">${SOCIAL.instagram.handle}</span>
            </a>
          </p>
          <p>
            <a class="footer-inline-social"
               href="${SOCIAL.youtube.url}"
               target="_blank" rel="noopener noreferrer"
               aria-label="${SOCIAL.youtube.label}">
              ${ICON_YOUTUBE}
              <span class="footer-social-handle">YouTube</span>
            </a>
          </p>
        </div>

      </div>

      <div class="footer-legal">
        <span>© ${COPYRIGHT_YEAR} Knoch Media · All rights reserved</span>
        <span class="footer-version">v ${SITE_VERSION} — ${LAST_UPDATED} ${ROLL_YEAR}</span>
      </div>
    </div>
  `;
}

/* ── Public ───────────────────────────────────────────────── */

/**
 * Mount the footer into <footer id="site-footer"> on the current page.
 * No-ops if the host element is missing (e.g. preview / partial pages).
 *
 * @param {'minimal' | 'expanded'} variant
 */
export function initFooter(variant = 'minimal') {
  const host = document.getElementById('site-footer');
  if (!host) return;

  host.classList.add('site-footer', `site-footer--${variant}`);
  host.setAttribute('role', 'contentinfo');

  host.innerHTML = variant === 'expanded' ? renderExpanded() : renderMinimal();
}
