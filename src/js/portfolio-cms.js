/*
  portfolio-cms.js — Runtime hydration of /portfolio.html tiles + filters from Sanity (KNOCH-042)
  ================================================================================================
  Fetches all `galleryCollection` entries from Sanity at page load,
  builds the portfolio tile + filter button HTML, and inserts them
  into the existing DOM shell. Mirrors the runtime-fetch pattern
  used by testimonial.js and the homepage reel — works in dev mode
  (Vite serves src/) AND production (Vercel serves dist/) identically.

  Caller contract: invoke and AWAIT before initPortfolioPage() runs.
  initPortfolioPage queries `.portfolio-card` at init time and bails
  if zero cards are found, so tiles must exist in the DOM first.
*/

import { getGalleryCollections, imageUrl } from './sanity.js';
import { initLazyLoad }                    from './lazy-load.js';

/* Map Sanity's category strings to the lowercase `data-category`
   values the portfolio filter tabs compare against. Mirrors the
   convention from the previously-hardcoded tiles: Worship → music
   (worship videos lived under the Music filter); Sports & Events →
   brand (BCF Gala lived under Brand). New categories slot into "all"
   only unless added here. */
const CATEGORY_TO_FILTER = {
  'Wedding':            'wedding',
  'Brand & Commercial': 'brand',
  'Sports & Events':    'brand',
  'Worship':            'music',
  'Portrait':           'portrait',
};

/* Display labels for the auto-generated filter buttons. */
const FILTER_LABELS = {
  wedding:  'Weddings',
  brand:    'Brand',
  music:    'Music',
  portrait: 'Portrait',
};

/* HTML escape — Sanity strings can carry punctuation that breaks
   attribute values (apostrophes, ampersands). Same helper sanity.js
   would use; inlined here to keep this module self-contained. */
function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function buildTileHTML(c, idx) {
  const num         = String(idx + 1).padStart(3, '0');
  const slug        = c.slug?.current ?? '';
  const filterValue = CATEGORY_TO_FILTER[c.category] ?? 'all';
  const cover       = c.coverImage ? imageUrl(c.coverImage, 1200) : '';
  const title       = c.title ?? '';
  const subtitle    = c.subtitle ?? c.category ?? '';
  const url         = c.url ?? '';
  const linkType    = c.linkType ?? 'external-gallery';
  const ariaLabel   = `${title}${c.category ? ` — ${c.category}` : ''}`;

  return `<article class="portfolio-card" data-category="${escapeHTML(filterValue)}" data-project-id="${escapeHTML(slug)}" data-link-type="${escapeHTML(linkType)}" data-url="${escapeHTML(url)}" tabindex="0" role="button" aria-label="${escapeHTML(ariaLabel)}">
  <div class="portfolio-card-img" data-bg="${escapeHTML(cover)}" role="img" aria-hidden="true"></div>
  <div class="portfolio-card-label">
    <span class="portfolio-card-cat">№ ${num} · ${escapeHTML(c.category ?? '')}</span>
    <h3 class="portfolio-card-title">${escapeHTML(title)}</h3>
    <p class="portfolio-card-sub">${escapeHTML(subtitle)}</p>
  </div>
</article>`;
}

function buildFilterButtonHTML(filterValue, label) {
  return `<li role="presentation"><button class="portfolio-tab" data-filter="${escapeHTML(filterValue)}" role="tab" aria-selected="false" tabindex="-1">${escapeHTML(label)}</button></li>`;
}

export async function initPortfolioCMS() {
  /* Page guard — only hydrate on /portfolio.html. The grid wrapper is
     the canonical marker; no-op everywhere else. */
  const grid = document.querySelector('.portfolio-grid');
  const tabs = document.querySelector('.portfolio-tabs');
  if (!grid || !tabs) return;

  let collections;
  try {
    collections = await getGalleryCollections();
  } catch (err) {
    console.warn('[portfolio-cms] Sanity fetch failed:', err);
    return; /* leave the empty grid; static fallback is "no projects yet" */
  }

  if (!Array.isArray(collections) || collections.length === 0) {
    console.warn('[portfolio-cms] Sanity returned no galleryCollection entries');
    return;
  }

  /* Render tiles into the grid. Replace any existing children — the
     static template ships with empty markup and a placeholder
     comment, but if this function is ever re-invoked (HMR, etc.)
     starting clean keeps things idempotent. */
  grid.innerHTML = collections.map((c, i) => buildTileHTML(c, i)).join('\n');

  /* Build the per-category filter buttons. Always preserve the
     "All" tab (which the static markup already provides); append
     one button per unique mapped filter value present, in the
     order categories first appear. */
  const seen = new Set();
  const filterButtons = [];
  for (const c of collections) {
    const f = CATEGORY_TO_FILTER[c.category];
    if (!f || seen.has(f)) continue;
    seen.add(f);
    const label = FILTER_LABELS[f] ?? (f.charAt(0).toUpperCase() + f.slice(1));
    filterButtons.push(buildFilterButtonHTML(f, label));
  }

  /* Append after the existing "All" button (don't replace it — keeps
     the active-tab default state intact). */
  const allBtn = tabs.querySelector('button[data-filter="all"]')?.parentElement;
  if (allBtn) {
    allBtn.insertAdjacentHTML('afterend', filterButtons.join(''));
  } else {
    /* Defensive: if "All" was somehow removed, just dump the buttons
       in. Prepending a fresh "All" button so the filter logic still
       has its always-true match. */
    tabs.innerHTML = `<li role="presentation"><button class="portfolio-tab is-active" data-filter="all" role="tab" aria-selected="true" tabindex="0">All</button></li>` + filterButtons.join('');
  }

  /* Re-run the lazy-load IntersectionObserver setup so it observes
     the newly-injected data-bg images. lazy-load.js is idempotent
     (initLazyLoad re-binds without leaking observers). */
  initLazyLoad();
}
