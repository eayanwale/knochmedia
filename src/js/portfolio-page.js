/*
  portfolio-page.js — Portfolio filter system (KNOCH-011)
  ========================================================
  Wires the filter tabs, GSAP filter animations, "Load more" button,
  and URL-hash state on /portfolio.html.

  State model:
    activeFilter   — 'all' | 'wedding' | 'brand' | 'sport' | 'portrait'
    visibleCount   — how many of the matching cards are currently shown
    PAGE_SIZE      — 8 cards revealed per "Load more" click

  Match logic:
    - "all"  → every card matches
    - <cat>  → cards whose data-category === <cat> match
    Cards that don't match are removed from layout via .is-hidden
    (display: none). Cards that match but exceed visibleCount are
    also .is-hidden for the same reason. "Load more" simply increments
    visibleCount and re-applies the visibility pass.

  Filter animation per tab click:
    1. Find the cards that will become hidden (currently visible, no
       longer matching OR over the page-size cap).
    2. Tween them to opacity:0, y:20 in 0.3s; on complete, add
       .is-hidden so the grid reflows.
    3. Find the cards that will become visible (currently hidden,
       matching, within page-size cap).
    4. Set them to .is-hidden:false (display revert), then tween from
       opacity:0, y:20 → opacity:1, y:0 with stagger 0.05.

  The two phases overlap deliberately — exit and entry start together
  so the layout transition reads as a single fluid swap rather than a
  blink-then-rebuild. AC: "Do NOT wait for exit to complete before
  starting entry — overlap feels snappier."

  Hash sync:
    - On init, read window.location.hash; if it matches a known
      category slug, apply that filter.
    - On tab click, update window.location.hash to the slug (or clear
      it for "all"). Uses replaceState so the back button isn't
      polluted with intermediate filter states.
    - On hashchange (e.g. browser back/forward), re-apply the matching
      filter without animating — the hash listener fires for every
      replaceState in some browsers, so we guard against re-tweening
      the same active filter.
*/

import { gsap } from 'gsap';
import { bindTileRouter } from './tile-router.js';

const PAGE_SIZE = 8;

/* Map of URL-hash slugs → data-category values. Keeping them separate
   lets the URL read more naturally (#weddings, plural) than the data
   attribute (singular: data-category="wedding") used for class-style
   matching on the card itself. */
const HASH_TO_CATEGORY = {
  '#weddings':  'wedding',
  '#brand':     'brand',
  '#music':    'music',
};

const CATEGORY_TO_HASH = Object.fromEntries(
  Object.entries(HASH_TO_CATEGORY).map(([h, c]) => [c, h])
);

export function initPortfolioPage() {
  const root = document.querySelector('.portfolio-grid-wrap');
  if (!root) return;

  const tabs        = Array.from(document.querySelectorAll('.portfolio-tab'));
  const cards       = Array.from(document.querySelectorAll('.portfolio-card'));
  const countEl     = document.querySelector('.portfolio-count');
  const loadMoreBtn = document.querySelector('.portfolio-load-more');
  if (!cards.length) return;

  /* Wire each card to the central tile router (KNOCH-012) — handles
     click + keyboard activation, branching to the video lightbox for
     video-typed projects or the expanding-tile transition + navigate
     to /project.html for photo-typed ones. Replaces the inline
     onclick handlers we shipped in KNOCH-011. */
  bindTileRouter(cards);

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let activeFilter = 'all';
  let visibleCount = PAGE_SIZE;
  let currentlyVisible = new Set();   /* cards currently rendered (no .is-hidden) */

  /* ── Helpers ──────────────────────────────────────────── */

  /* All cards that pass the active filter, in DOM order. */
  function matchingCards() {
    if (activeFilter === 'all') return cards;
    return cards.filter(c => c.dataset.category === activeFilter);
  }

  /* Subset of matching cards we want shown right now (capped by visibleCount). */
  function targetVisible() {
    return matchingCards().slice(0, visibleCount);
  }

  /* Update count label + Load More button visibility based on counts. */
  function updateMeta() {
    const matched = matchingCards().length;
    const shown   = Math.min(matched, visibleCount);
    if (countEl) {
      countEl.innerHTML = `Showing <strong>${shown}</strong> of ${matched} ${matched === 1 ? 'project' : 'projects'}`;
    }
    if (loadMoreBtn) {
      loadMoreBtn.classList.toggle('is-hidden', shown >= matched);
    }
  }

  /* Apply filter + visibility to the DOM with an animated swap.
     The two-pass pattern (exit non-matches, then enter matches) overlaps
     in time — both gsap.to calls fire on the same tick. */
  function applyFilter({ animate = true } = {}) {
    const want = new Set(targetVisible());

    /* Phase 1 — cards leaving the visible set */
    const leaving = cards.filter(c => currentlyVisible.has(c) && !want.has(c));

    /* Phase 2 — cards entering the visible set */
    const entering = cards.filter(c => !currentlyVisible.has(c) && want.has(c));

    if (!animate || prefersReduced) {
      /* Instant reset: no tweens, just toggle visibility */
      cards.forEach(c => {
        const visible = want.has(c);
        c.classList.toggle('is-hidden', !visible);
        c.style.opacity = '';
        c.style.transform = '';
      });
      currentlyVisible = want;
      updateMeta();
      return;
    }

    /* Animate leaving cards out, then add .is-hidden onComplete so the
       grid reflows once the fade settles. */
    if (leaving.length) {
      gsap.to(leaving, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: 'power2.in',
        overwrite: 'auto',
        onComplete: () => {
          leaving.forEach(c => {
            c.classList.add('is-hidden');
            /* Clear the inline tween residue so re-entry starts clean */
            c.style.opacity = '';
            c.style.transform = '';
          });
        },
      });
    }

    /* Animate entering cards in. Remove .is-hidden first so the grid
       reserves a slot, then fromTo tweens opacity/y from off → on. */
    if (entering.length) {
      entering.forEach(c => c.classList.remove('is-hidden'));
      gsap.fromTo(entering,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'expo.out',
          stagger: 0.05,
          overwrite: 'auto',
          /* clearProps so the inline transform doesn't outlast the tween */
          clearProps: 'opacity,transform',
        }
      );
    }

    currentlyVisible = want;
    updateMeta();
  }

  /* ── Tabs ─────────────────────────────────────────────── */

  function setActiveTab(filter) {
    tabs.forEach(t => {
      const match = t.dataset.filter === filter;
      t.classList.toggle('is-active', match);
      t.setAttribute('aria-pressed', match ? 'true' : 'false');
    });
  }

  function selectFilter(filter, { fromHash = false } = {}) {
    if (filter === activeFilter) return;
    activeFilter = filter;
    /* Reset visibleCount so a category that has, say, 4 matches doesn't
       inherit a stale "Load more" state from the previous filter. */
    visibleCount = PAGE_SIZE;
    setActiveTab(filter);
    applyFilter();

    /* Sync URL hash unless the change came FROM a hashchange event
       (avoids a feedback loop). */
    if (!fromHash) {
      const hash = filter === 'all' ? '' : (CATEGORY_TO_HASH[filter] ?? '');
      const url = window.location.pathname + window.location.search + hash;
      window.history.replaceState(null, '', url);
    }
  }

  tabs.forEach(t => {
    t.addEventListener('click', () => selectFilter(t.dataset.filter));
  });

  /* ── Load more ────────────────────────────────────────── */

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      visibleCount += PAGE_SIZE;
      applyFilter();
    });
  }

  /* ── Hash sync ────────────────────────────────────────── */

  function applyHash() {
    const hash = window.location.hash;
    const filter = HASH_TO_CATEGORY[hash] ?? 'all';
    if (filter !== activeFilter) {
      selectFilter(filter, { fromHash: true });
    }
  }

  window.addEventListener('hashchange', applyHash);

  /* ── Initial state ────────────────────────────────────── */

  /* Seed currentlyVisible with whatever cards the HTML had visible by
     default, then apply the filter so the first paint matches state. */
  cards.forEach(c => {
    if (!c.classList.contains('is-hidden')) currentlyVisible.add(c);
  });

  /* If the URL has a hash that maps to a category, start there. */
  const initialHash = window.location.hash;
  const initialFilter = HASH_TO_CATEGORY[initialHash] ?? 'all';
  if (initialFilter !== 'all') {
    activeFilter = initialFilter;
    setActiveTab(initialFilter);
    applyFilter({ animate: false });
  } else {
    setActiveTab('all');
    applyFilter({ animate: false });
  }
}
