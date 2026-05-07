/*
  optimize-images.mjs — One-shot WebP sibling generator (KNOCH-019)
  ====================================================================
  Walks src/public/assets/ recursively and writes a .webp sibling next
  to every .jpg / .jpeg / .png it finds (skipping if the .webp already
  exists and is newer than the source). Quality 80 — the sweet spot
  where photographic detail holds and file size lands ~70-85% smaller
  than the JPEG/PNG source.

  Why a one-shot script instead of vite-plugin-imagemin: this portfolio
  has ~50 images that rarely change. A build-time plugin re-runs the
  encoder on every dev/build cycle, slowing local iteration. A manual
  script regenerates only when assets change and ships a static set
  of .webp files in src/public/ that Vercel serves directly.

  Output strategy: write .webp ALONGSIDE the source so:
    - data-bg consumers can pick the .webp via image-set() with a
      jpg/png fallback for browsers that don't speak WebP (Safari < 14,
      old Chromium). lazy-load.js implements this.
    - <picture> elements can declare <source type="image/webp"> with
      an <img> fallback to the source format.

  Skips:
    - already-up-to-date .webp (mtime check)
    - assets/about/about-* if they're already .jpg covers - we touch
      everything below src/public/assets/, no carve-outs.

  Usage:
    npm run optimize:images
    (or: node scripts/optimize-images.mjs)
*/

import { readdir, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';

/* Two roots get walked:
 *   - src/public/assets    served as-is by Vite (data-bg, runtime
 *                          URLs). Lazy-load.js does the .jpg -> .webp
 *                          rewrite at request time.
 *   - src/assets           imported by CSS url() + JS imports. Vite
 *                          hashes these in the build output. Consumers
 *                          (frame.css) use image-set() with both URLs
 *                          to let the browser pick. */
const ROOTS    = ['src/public/assets', 'src/assets'];
const QUALITY  = 80;
const VALID_EXT = new Set(['.jpg', '.jpeg', '.png']);

let _converted = 0;
let _skipped   = 0;
let _bytesIn   = 0;
let _bytesOut  = 0;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      await walk(full);
      continue;
    }
    if (!ent.isFile()) continue;
    const ext = extname(ent.name).toLowerCase();
    if (!VALID_EXT.has(ext)) continue;
    await convert(full);
  }
}

async function convert(srcPath) {
  /* Build the .webp sibling path: foo.jpg -> foo.webp */
  const ext = extname(srcPath);
  const webpPath = srcPath.slice(0, -ext.length) + '.webp';

  const srcStat = await stat(srcPath);

  /* Skip if .webp exists and is newer than the source - common case
     during incremental dev when a single asset gets replaced. */
  if (existsSync(webpPath)) {
    const dstStat = await stat(webpPath);
    if (dstStat.mtimeMs >= srcStat.mtimeMs) {
      _skipped++;
      return;
    }
  }

  /* Encode at quality 80. effort: 6 is the sharp/libwebp default for
     batch jobs - balances encode time vs. compression ratio. The 'near
     lossless' alpha mode (alphaQuality: 100) keeps PNG transparency
     pristine for the few PNG sources (cover-what-mighty-praise.png
     etc.) where the alpha channel matters. */
  await sharp(srcPath)
    .webp({ quality: QUALITY, effort: 6, alphaQuality: 100 })
    .toFile(webpPath);

  const dstStat = await stat(webpPath);
  _bytesIn  += srcStat.size;
  _bytesOut += dstStat.size;
  _converted++;

  const ratio = (1 - dstStat.size / srcStat.size) * 100;
  process.stdout.write(
    `  ${basename(srcPath).padEnd(40)} ${formatBytes(srcStat.size).padStart(10)} -> ` +
    `${formatBytes(dstStat.size).padStart(10)} (-${ratio.toFixed(1)}%)\n`
  );
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  console.log(`[optimize-images] quality=${QUALITY}\n`);
  const t0 = performance.now();
  for (const root of ROOTS) {
    if (!existsSync(root)) continue; // optional roots
    console.log(`[optimize-images] scanning ${root}`);
    await walk(root);
  }
  const dt = ((performance.now() - t0) / 1000).toFixed(2);

  console.log(
    `\n[optimize-images] done in ${dt}s\n` +
    `  converted: ${_converted}\n` +
    `  skipped:   ${_skipped}\n` +
    `  total in:  ${formatBytes(_bytesIn)}\n` +
    `  total out: ${formatBytes(_bytesOut)}\n` +
    (_bytesIn > 0
      ? `  saved:     ${formatBytes(_bytesIn - _bytesOut)} ` +
        `(-${((1 - _bytesOut / _bytesIn) * 100).toFixed(1)}%)\n`
      : '')
  );
}

main().catch((err) => {
  console.error('[optimize-images] failed:', err);
  process.exit(1);
});
