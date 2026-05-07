/*
  render-projects.mjs — Build-time per-project static HTML (KNOCH-040)
  =====================================================================
  Runs after `vite build`. Reads:
    - src/js/projects.js     (project data — listProjects())
    - dist/project.html      (Vite-built template with hashed asset paths)
    - dist/sitemap.xml       (static sitemap from src/public/)

  Emits:
    - dist/project/<slug>.html         (one per project, per-project meta)
    - dist/sitemap.xml                 (overwritten with static + project URLs)

  Why dist/ and not src/ as the template input: Vite rewrites asset
  references (CSS / JS imports) to hashed bundle paths during build —
  reading src/project.html directly would mean the rendered output
  references the unhashed dev paths and breaks. Reading dist/project.html
  preserves the hashed asset paths Vite produced.

  String-replace approach (no DOM parser): the head's per-project meta
  tags follow a fixed pattern, so targeted regex replacement is simpler
  than spinning up jsdom / cheerio for what amounts to ~10 substitutions.
*/

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listProjects } from '../src/js/projects.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const SITE = 'https://knoch.media';

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

/* ── Main ────────────────────────────────────────────────────────── */

function main() {
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
}

main();
