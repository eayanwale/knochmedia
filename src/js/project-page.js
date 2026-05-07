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
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getProject, listProjects } from './projects.js';
import { openVideoLightbox } from './video-lightbox.js';
import { loadBgImage, initLazyLoad } from './lazy-load.js';

gsap.registerPlugin(ScrollTrigger);

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

  /* Hero LCP image — route through loadBgImage so the WebP rewrite
     and lazy-load placeholder both kick in. The .webp sibling is the
     LCP element and is ~70% smaller than the source JPG (KNOCH-019). */
  if (heroImg) loadBgImage(heroImg, project.cover);
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

  /* CTA link — three modes depending on the project shape:
       - galleryUrl present  → "View full gallery →" opens the
         external client gallery in a new tab.
       - youtubeId present   → "Watch the film →" opens the video
         lightbox modal in-place (same lightbox used elsewhere via
         the tile-router). The href is set to the youtu.be URL as
         a fallback so the link still works if JS fails.
       - neither             → hide the link.
     The same DOM element drives all three modes — text + href +
     handler get rewritten per project. */
  if (mLink) {
    if (project.galleryUrl) {
      mLink.textContent = 'View full gallery →';
      mLink.href = project.galleryUrl;
      mLink.target = '_blank';
      mLink.rel = 'noopener noreferrer';
    } else if (project.youtubeId) {
      mLink.textContent = 'Watch the film →';
      mLink.href = `https://youtu.be/${project.youtubeId}`;
      mLink.target = '_blank';
      mLink.rel = 'noopener noreferrer';
      /* Intercept click — open the in-page lightbox instead of
         leaving the page. Default-action fallback covers users with
         JS disabled or older browsers. */
      mLink.addEventListener('click', (e) => {
        e.preventDefault();
        openVideoLightbox(project.youtubeId, mLink);
      });
    } else {
      mLink.style.display = 'none';
    }
  }

  /* ── Populate "Other works" reel ─────────────────── */
  /* Pinned horizontal-scroll reel matching the homepage Selected Work
     pattern (KNOCH-007). The .project-gallery element is the
     horizontal track and already contains a .project-others-intro
     panel as its first child; we append project cards + a trailing
     spacer after it, then pin the parent .project-others section so
     vertical scroll translates the track horizontally.

     Mobile / reduced-motion: the GSAP pin is skipped, and the CSS
     @media block falls the track back to overflow-x: auto so the
     visitor can scroll the cards natively without fighting a pin. */

  const gallery = document.querySelector('.project-gallery');
  const otherSection = document.querySelector('.project-others');
  if (gallery) {
    const others = listProjects()
      .filter(p => p.id !== project.id)
      .slice(0, 8); /* cap the reel — 8 keeps page weight reasonable */

    if (others.length) {
      /* Append cards after the existing intro panel. innerHTML +=
         preserves the .project-others-intro element that's already
         present in the HTML. data-bg routes through lazy-load so the
         WebP rewrite happens (KNOCH-019); initLazyLoad() picks up the
         new elements and observes them for IO entry. */
      gallery.insertAdjacentHTML('beforeend', others.map(p => `
        <a class="project-other" href="/project.html?id=${encodeURIComponent(p.id)}"
           aria-label="${p.title} — ${p.category}">
          <div class="project-other-img" data-bg="${p.cover}" role="img" aria-hidden="true"></div>
          <div class="project-other-meta">
            <span class="project-other-cat">${(p.category || 'Project').toUpperCase()}</span>
            <h4 class="project-other-title">${p.title}</h4>
          </div>
        </a>
      `).join(''));
      initLazyLoad();

      /* Trailing spacer — gives the pin's `end` position breathing
         room past the last card. */
      const spacer = document.createElement('div');
      spacer.className = 'project-others-spacer';
      spacer.setAttribute('aria-hidden', 'true');
      gallery.appendChild(spacer);
    } else {
      gallery.insertAdjacentHTML('beforeend',
        '<p style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.2em;color:rgba(237,230,216,0.5);padding:0 4vw;">' +
        'More work coming soon.' +
        '</p>'
      );
    }

    /* Pin + horizontal translate — same pattern as src/js/reel.js's
       reelTween. Skip on mobile (CSS overflow-scroll handles it) and
       on reduced motion (the visitor opted out of scroll-tied
       animation entirely). */
    const isMobile = window.matchMedia('(max-width: 800px)').matches;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (otherSection && !isMobile && !prefersReduced) {
      gsap.to(gallery, {
        x: () => -(gallery.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: otherSection,
          start: 'top top',
          end: () => '+=' + (gallery.scrollWidth - window.innerWidth),
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }
  }

  /* ── CTA pre-fill for contact form ──────────────── */

  /* Contact form (KNOCH-014) reads ?type=<category> to preselect the
     service-type tile on load. Stamp it onto the project-page CTA so
     a visitor coming from a wedding project lands on the contact page
     with the wedding tile already lit. */
  const ctaLink = document.querySelector('.project-cta-link');
  if (ctaLink && project.category) {
    ctaLink.href = `/contact.html?type=${encodeURIComponent(project.category)}`;
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

  /* ── Article JSON-LD (KNOCH-037) ──────────────────────────────────
     Inject a schema.org Article block so each project page is
     eligible for Google's Article rich result on search. Runtime
     injection (vs. preloaded markup) is the right call here because
     the project is resolved from `?id=…` — there's no static HTML
     value we could preload. Removed + re-appended on every init so
     in-flight client-side navigations between projects don't stack
     stale blocks. */
  injectArticleSchema(project);
}

/* parseDateToISO — best-effort conversion of the human date strings
   in projects.js ("June 2024", "2024", "May 2024") into ISO 8601 so
   schema.org datePublished is valid. Returns:
     "September 2024" → "2024-09"   (yyyy-MM, valid ISO 8601 month)
     "2024"           → "2024"      (yyyy alone, valid)
     anything else    → null        (caller omits the field)
   Schema's spec is permissive about granularity — partial dates
   (year, year-month) are explicitly OK. */
const _MONTHS = {
  january:   '01', february:  '02', march: '03', april: '04', may: '05', june: '06',
  july:      '07', august:    '08', september: '09', october: '10', november: '11', december: '12',
  jan: '01', feb: '02', mar: '03', apr: '04', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};
function parseDateToISO(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  /* Year alone: "2024" */
  if (/^\d{4}$/.test(s)) return s;
  /* "Month YYYY" → "YYYY-MM". Case-insensitive month lookup. */
  const m = s.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (m) {
    const month = _MONTHS[m[1].toLowerCase()];
    if (month) return `${m[2]}-${month}`;
  }
  return null;
}

function injectArticleSchema(project) {
  /* Idempotent — drop a previously-injected block before adding the
     new one. Only matches blocks we authored (data-knoch-schema). */
  document.querySelectorAll('script[type="application/ld+json"][data-knoch-schema="article"]')
    .forEach(el => el.remove());

  /* Resolve relative cover paths to absolute URLs for the JSON-LD
     image field. Google's docs recommend absolute. location.origin
     handles localhost / preview / production transparently — image
     URLs land at e.g. https://knoch.media/assets/portfolio/...jpg
     in production, http://localhost:5173/... in dev. */
  const absUrl = (path) =>
    path?.startsWith('http')
      ? path
      : `${window.location.origin}${path?.startsWith('/') ? '' : '/'}${path ?? ''}`;

  const data = {
    '@context': 'https://schema.org',
    '@type':    'Article',
    headline:   project.title,
    image:      absUrl(project.cover),
    author:     { '@type': 'Organization', name: 'Knoch Media' },
    publisher:  {
      '@type': 'Organization',
      name:    'Knoch Media',
      logo: {
        '@type': 'ImageObject',
        url:     `${window.location.origin}/assets/logo/logo.png`,
      },
    },
    /* Set canonical URL so search treats this rendering as the
       authoritative location for the project — important since the
       same content surfaces under different `?id=` values. */
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id':   window.location.href,
    },
  };

  const isoDate = parseDateToISO(project.date);
  if (isoDate)            data.datePublished = isoDate;
  if (project.description) data.description  = project.description;
  if (project.category)    data.keywords     = project.category;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.dataset.knochSchema = 'article';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}
