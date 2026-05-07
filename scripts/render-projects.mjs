/*
  render-projects.mjs — Build-time static HTML emission (KNOCH-040 + 042)
  =======================================================================
  Runs after `vite build`. Two responsibilities:

  1. Per-project static pages (KNOCH-040)
     - For each project in src/js/projects.js, emit dist/project/<slug>.html
       with per-project canonical / og:image / Article JSON-LD baked in.
     - Append /project/<slug> URLs to dist/sitemap.xml.

  2. Sanity-driven portfolio tiles (KNOCH-042)
     - Fetch all `galleryCollection` entries from Sanity at build time.
     - Cache the response in .sanity-cache.json (gitignored) so a Sanity
       outage at build time falls back to the last successful fetch
       instead of failing the whole build.
     - Generate the portfolio.html tile grid + filter buttons HTML.
     - Substitute both into dist/portfolio.html between marker comments.

  Why dist/ and not src/ as the template input: Vite rewrites asset
  references (CSS / JS imports) to hashed bundle paths during build —
  reading src/project.html directly would mean the rendered output
  references the unhashed dev paths and breaks. Reading dist/* preserves
  the hashed asset paths Vite produced.

  String-replace approach (no DOM parser): the head's per-project meta
  tags follow a fixed pattern, so targeted regex replacement is simpler
  than spinning up jsdom / cheerio. Marker comments delimit the tile +
  filter blocks in dist/portfolio.html so substitution is unambiguous.
*/

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listProjects } from '../src/js/projects.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const SITE = 'https://knoch.media';

/* Sanity project — values mirror sanity.js / studio config. Hardcoded
   here rather than imported so the build script has no runtime
   dependency on the Vite-bundled fetch layer. */
const SANITY_PROJECT_ID = '2779g58e';
const SANITY_DATASET    = 'production';
const SANITY_CACHE_PATH = resolve(ROOT, '.sanity-cache.json');

/* ── Helpers ─────────────────────────────────────────────────────── */

/* Standard HTML escape — defends against any markup in project copy
   landing in attribute values. The `'` to `&#39;` mapping matters
   for og:title/description content="..." attribute parsing. */
function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* Truncate to ≤ max chars at the nearest sentence end, falling back
   to a clean word boundary. og:description / meta description target
   is ~155 chars so previews don't wrap awkwardly on Twitter / Slack. */
function truncate(text, max = 155) {
  const s = String(text ?? '').trim();
  if (s.length <= max) return s;
  const slice = s.slice(0, max);
  /* Prefer breaking at the last full sentence end */
  const sentenceEnd = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '));
  if (sentenceEnd > max * 0.5) return slice.slice(0, sentenceEnd + 1);
  /* Otherwise break at the last word boundary, append ellipsis */
  const wordEnd = slice.lastIndexOf(' ');
  return (wordEnd > max * 0.5 ? slice.slice(0, wordEnd) : slice) + '…';
}

/* Resolve cover paths to absolute URLs for og:image / Article image.
   Pass through any already-absolute URL. */
function absUrl(path) {
  if (!path) return `${SITE}/assets/og/og-default.jpg`;
  if (path.startsWith('http')) return path;
  return `${SITE}${path.startsWith('/') ? '' : '/'}${path}`;
}

/* ── Date parser (matches project-page.js's parseDateToISO) ──────────
   Schema.org datePublished accepts year alone or year-month partials. */
const _MONTHS = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  jan: '01', feb: '02', mar: '03', apr: '04', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};
function parseDateToISO(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (/^\d{4}$/.test(s)) return s;
  const m = s.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (m) {
    const month = _MONTHS[m[1].toLowerCase()];
    if (month) return `${m[2]}-${month}`;
  }
  return null;
}

/* ── Per-project Article JSON-LD ─────────────────────────────────── */

function articleJSONLD(p) {
  const data = {
    '@context':        'https://schema.org',
    '@type':           'Article',
    headline:          p.title,
    image:             absUrl(p.cover),
    author:            { '@type': 'Organization', name: 'Knoch Media' },
    publisher: {
      '@type': 'Organization',
      name:    'Knoch Media',
      logo: { '@type': 'ImageObject', url: `${SITE}/assets/logo/logo.png` },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id':   `${SITE}/project/${p.id}`,
    },
  };
  const iso = parseDateToISO(p.date);
  if (iso)            data.datePublished = iso;
  if (p.description)  data.description   = p.description;
  if (p.category)     data.keywords      = p.category;
  return JSON.stringify(data);
}

/* ── Render one project page from the template ───────────────────── */

function renderProjectHTML(template, p) {
  const title       = `${p.title} — Knoch Media`;
  const description = truncate(p.description, 155);
  const url         = `${SITE}/project/${p.id}`;
  const image       = absUrl(p.cover);

  let html = template;

  /* Replace <title>…</title> */
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHTML(title)}</title>`
  );

  /* Replace meta name="description" */
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeHTML(description)}" />`
  );

  /* OG tags — one set of replacements */
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escapeHTML(title)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escapeHTML(description)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:image" content="${escapeHTML(image)}" />`
  );

  /* Twitter card */
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escapeHTML(title)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escapeHTML(description)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:image" content="${escapeHTML(image)}" />`
  );

  /* Inject canonical + og:url + Article JSON-LD before </head>.
     The base project.html template intentionally has no canonical tag
     (per-project canonical doesn't make sense for the shared shell);
     we add it here. og:url too — base template has it pointing at the
     legacy URL, but cleanest to drop a fresh tag rather than try to
     patch the existing one if it varies. */
  const headInjection = `
    <link rel="canonical" href="${url}" />
    <meta property="og:url" content="${escapeHTML(url)}" />
    <script type="application/ld+json" data-knoch-schema="article">${articleJSONLD(p)}</script>
  `;

  /* Drop any existing og:url (template has one pointing at legacy
     URL via the static fallback) so we don't end up with two. */
  html = html.replace(
    /\s*<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/g,
    ''
  );

  html = html.replace('</head>', `${headInjection}</head>`);

  /* Inject a noscript fallback inside <main> with the project title +
     external gallery link, so crawlers / no-JS users see meaningful
     content. project-page.js populates the body normally when JS runs. */
  const noscriptBlock = `
    <noscript>
      <section class="project-noscript" style="padding: 8rem 6vw; text-align: center;">
        <p style="font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.3em; color: var(--amber); margin-bottom: 1rem;">— ${escapeHTML((p.category || '').toUpperCase())}</p>
        <h1 style="font-family: var(--font-serif); font-size: clamp(40px, 8vw, 96px); line-height: 0.95; margin-bottom: 1.5rem;">${escapeHTML(p.title)}</h1>
        ${p.location || p.date ? `<p style="font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.25em; color: rgba(237, 230, 216, 0.6); margin-bottom: 2rem;">${escapeHTML([p.location, p.date].filter(Boolean).join(' · '))}</p>` : ''}
        ${p.description ? `<p style="font-family: var(--font-sans); font-size: 16px; line-height: 1.6; max-width: 38em; margin: 0 auto 2rem; color: rgba(237, 230, 216, 0.85);">${escapeHTML(p.description)}</p>` : ''}
        ${p.galleryUrl ? `<a href="${escapeHTML(p.galleryUrl)}" target="_blank" rel="noopener" style="font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--amber); border-bottom: 1px solid var(--amber); padding-bottom: 4px; text-decoration: none;">View the full gallery →</a>` : ''}
      </section>
    </noscript>`;

  /* Inject right after the opening <main id="main-content"> tag.
     If the template doesn't have a main wrapper (shouldn't happen
     post-KNOCH-021 but defensive), append before the project-hero. */
  if (html.includes('<main id="main-content">')) {
    html = html.replace('<main id="main-content">', `<main id="main-content">${noscriptBlock}`);
  }

  return html;
}

/* ── Sanity fetch (KNOCH-042) ─────────────────────────────────────── */

/* Fetch all galleryCollection entries ordered by `order asc`. Returns
   the array (possibly empty) on success. Throws on network / HTTP
   error so the caller can fall back to cache. */
async function fetchGalleryCollections() {
  const groq = `*[_type == "galleryCollection"] | order(order asc, _createdAt asc)`;
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${encodeURIComponent(groq)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Sanity API responded ${res.status}`);
  const json = await res.json();
  return Array.isArray(json.result) ? json.result : [];
}

/* Wraps the fetch with cache-on-failure semantics. Successful fetches
   write to .sanity-cache.json; failures fall back to the cache if it
   exists. Build never fails on Sanity outage — just warns. */
async function fetchGalleryCollectionsWithCache() {
  try {
    const data = await fetchGalleryCollections();
    writeFileSync(SANITY_CACHE_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[render-projects] ✓ Sanity fetch ok (${data.length} galleryCollection entries)`);
    return data;
  } catch (err) {
    console.warn(`[render-projects] ⚠ Sanity fetch failed: ${err.message}`);
    if (existsSync(SANITY_CACHE_PATH)) {
      try {
        const cached = JSON.parse(readFileSync(SANITY_CACHE_PATH, 'utf8'));
        console.warn(`[render-projects]   → Using cached data (${cached.length} entries) — last successful fetch`);
        return cached;
      } catch (cacheErr) {
        console.warn(`[render-projects]   → Cache file is unreadable: ${cacheErr.message}`);
      }
    }
    console.warn('[render-projects]   → No cache available; portfolio tiles will be empty in this build');
    return [];
  }
}

/* Resolve a Sanity image asset _ref (e.g., image-abc123-1600x1067-jpg)
   into a CDN URL. Mirrors src/js/sanity.js's imageUrl(). */
function sanityImageUrl(coverImage, width = 1200) {
  const ref = coverImage?.asset?._ref ?? '';
  const parts = String(ref).split('-');
  if (parts.length < 4) return '';
  const [, id, dims, ext] = parts;
  return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${id}-${dims}.${ext}?w=${width}&auto=format`;
}

/* Map Sanity's category strings to the lowercase data-category values
   the portfolio filter (data-filter on each tab button) compares
   against. Mirrors the existing convention from the previously-
   hardcoded tiles: Worship → music (worship videos lived under the
   Music filter); Sports & Events → brand (BCF Gala lived under Brand).
   New categories slot into "all" only unless added here. */
const CATEGORY_TO_FILTER = {
  'Wedding':            'wedding',
  'Brand & Commercial': 'brand',
  'Sports & Events':    'brand',
  'Worship':            'music',
  'Portrait':           'portrait',
};

/* Display labels for filter button text. Values match
   CATEGORY_TO_FILTER's right-hand side. */
const FILTER_LABELS = {
  wedding:  'Weddings',
  brand:    'Brand',
  music:    'Music',
  portrait: 'Portrait',
};

/* Build one <article class="portfolio-card"> for a Sanity collection.
   Mirrors the existing static markup shape, just with data sourced
   from the Sanity entry instead of hardcoded. Adds data-link-type +
   data-url so tile-router can route the click without consulting
   projects.js. */
function buildPortfolioTile(c, idx) {
  const num = String(idx + 1).padStart(3, '0');
  const slug = c.slug?.current ?? '';
  const filterValue = CATEGORY_TO_FILTER[c.category] ?? 'all';
  const cover = sanityImageUrl(c.coverImage, 1200);
  const title = c.title ?? '';
  const subtitle = c.subtitle ?? c.category ?? '';
  const url = c.url ?? '';
  const linkType = c.linkType ?? 'external-gallery';
  const ariaLabel = `${title}${c.category ? ` — ${c.category}` : ''}`;

  return `        <article class="portfolio-card" data-category="${escapeHTML(filterValue)}" data-project-id="${escapeHTML(slug)}" data-link-type="${escapeHTML(linkType)}" data-url="${escapeHTML(url)}" tabindex="0" role="button"
          aria-label="${escapeHTML(ariaLabel)}">
          <div class="portfolio-card-img" data-bg="${escapeHTML(cover)}" role="img" aria-hidden="true"></div>
          <div class="portfolio-card-label">
            <span class="portfolio-card-cat">№ ${num} · ${escapeHTML(c.category ?? '')}</span>
            <h3 class="portfolio-card-title">${escapeHTML(title)}</h3>
            <p class="portfolio-card-sub">${escapeHTML(subtitle)}</p>
          </div>
        </article>`;
}

/* Build the filter button list. Always includes "All". Includes a
   button for each filter value present in the current Sanity data,
   in the order they first appear. Categories that don't have a
   FILTER_LABELS entry are skipped (never reachable since the map
   covers all five Sanity-allowed values). */
function buildPortfolioFilters(collections) {
  const seen = new Set();
  const filterValues = [];
  for (const c of collections) {
    const f = CATEGORY_TO_FILTER[c.category];
    if (f && !seen.has(f)) {
      seen.add(f);
      filterValues.push(f);
    }
  }
  const items = [
    `          <li role="presentation"><button class="portfolio-tab is-active" data-filter="all"      role="tab" aria-selected="true"  tabindex="0">All</button></li>`,
    ...filterValues.map(f => {
      const label = FILTER_LABELS[f] ?? (f.charAt(0).toUpperCase() + f.slice(1));
      return `          <li role="presentation"><button class="portfolio-tab"           data-filter="${escapeHTML(f)}" role="tab" aria-selected="false" tabindex="-1">${escapeHTML(label)}</button></li>`;
    }),
  ];
  return items.join('\n');
}

/* Substitute content between BEGIN/END marker comments. The src
   templates carry the markers; this script writes whatever's between.
   Idempotent — re-running a build doesn't accumulate. */
function substituteMarkerBlock(html, markerName, replacement) {
  const open  = `<!-- ${markerName}: BEGIN -->`;
  const close = `<!-- ${markerName}: END -->`;
  const re = new RegExp(`${open.replace(/[/-]/g, '\\$&')}[\\s\\S]*?${close.replace(/[/-]/g, '\\$&')}`, 'g');
  return html.replace(re, `${open}\n${replacement}\n${close}`);
}

/* ── Main ────────────────────────────────────────────────────────── */

async function main() {
  const projects = listProjects();
  if (!projects.length) {
    console.error('[render-projects] No projects found. Aborting.');
    process.exit(1);
  }

  const templatePath = resolve(DIST, 'project.html');
  let template;
  try {
    template = readFileSync(templatePath, 'utf8');
  } catch (err) {
    console.error(`[render-projects] Could not read ${templatePath}. Run \`vite build\` first.`);
    console.error(err.message);
    process.exit(1);
  }

  /* Emit per-project HTML files into dist/project/<slug>.html */
  const projectDir = resolve(DIST, 'project');
  mkdirSync(projectDir, { recursive: true });

  for (const p of projects) {
    const html = renderProjectHTML(template, p);
    writeFileSync(resolve(projectDir, `${p.id}.html`), html, 'utf8');
  }

  /* Append per-project entries to dist/sitemap.xml. The base sitemap
     in src/public/ stays simple (4 static pages) — projects are
     added at build time so the file in src/ doesn't need to be
     regenerated every time projects.js changes. */
  const sitemapPath = resolve(DIST, 'sitemap.xml');
  let sitemap;
  try {
    sitemap = readFileSync(sitemapPath, 'utf8');
  } catch (err) {
    console.error(`[render-projects] Could not read ${sitemapPath}.`);
    console.error(err.message);
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const projectEntries = projects.map(p => `
  <url>
    <loc>${SITE}/project/${p.id}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
  </url>`).join('');

  /* Insert before </urlset>. Idempotent — strips any prior auto-added
     block (delimited by the data marker comment) before adding the
     new one, so re-running the build doesn't accumulate duplicates. */
  const MARKER_OPEN  = '<!-- KNOCH-040: project URLs (auto-generated) -->';
  const MARKER_CLOSE = '<!-- /KNOCH-040 -->';
  sitemap = sitemap.replace(
    new RegExp(`\\s*${MARKER_OPEN}[\\s\\S]*?${MARKER_CLOSE}`, 'g'),
    ''
  );
  sitemap = sitemap.replace(
    '</urlset>',
    `  ${MARKER_OPEN}${projectEntries}\n  ${MARKER_CLOSE}\n</urlset>`
  );
  writeFileSync(sitemapPath, sitemap, 'utf8');

  console.log(`[render-projects] ✓ Emitted ${projects.length} static project pages + sitemap entries`);

  /* ── KNOCH-042: Sanity-driven portfolio tiles ─────────────────────
     Fetches galleryCollection entries from Sanity and substitutes the
     tile grid + filter buttons into dist/portfolio.html. Cache-backed
     so a Sanity outage doesn't fail the build. */
  const collections = await fetchGalleryCollectionsWithCache();
  const portfolioPath = resolve(DIST, 'portfolio.html');
  if (!existsSync(portfolioPath)) {
    console.warn('[render-projects] ⚠ dist/portfolio.html not found — skipping portfolio tile substitution');
  } else {
    let portfolio = readFileSync(portfolioPath, 'utf8');
    const tilesHTML = collections.length > 0
      ? collections.map((c, i) => buildPortfolioTile(c, i)).join('\n\n')
      : '        <!-- No portfolio entries — Sanity returned empty AND no cache available -->';
    const filtersHTML = buildPortfolioFilters(collections);

    portfolio = substituteMarkerBlock(portfolio, 'KNOCH-042 portfolio tiles', tilesHTML);
    portfolio = substituteMarkerBlock(portfolio, 'KNOCH-042 portfolio filters', filtersHTML);

    writeFileSync(portfolioPath, portfolio, 'utf8');
    console.log(`[render-projects] ✓ Portfolio: ${collections.length} tiles + filter buttons substituted into dist/portfolio.html`);
  }
}

main().catch(err => {
  console.error('[render-projects] Fatal:', err);
  process.exit(1);
});
