# Knoch Media — Ticket Summary

> **Living document.** Updated whenever tickets are created, modified, split, or closed.  
> Last updated: 2026-05-05 | Total tickets: 30 | Open: 14 | In progress: 0 | In review: 1 | Done: 12 | Deferred: 3

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| `⬜` | Open — not started |
| `🔵` | In progress |
| `✅` | Done — merged to `test` |
| `🚀` | Shipped — squash-merged to `main` |
| `🔁` | Needs revision (tester/review feedback) |
| `❌` | Blocked |

---

## Phase 1 — Foundation

These must be completed before any other ticket can be built. No component should be started until KNOCH-001 and KNOCH-002 are done. KNOCH-016 (Lenis) must be done before KNOCH-007 (reel).

| ID | Title | Status | Branch | Notes |
|----|-------|--------|--------|-------|
| [KNOCH-001](tickets/KNOCH-001.md) | Project Scaffolding & Build Setup (Vite) | `✅` | `feature/KNOCH-001-project-scaffold` | Entry point for all other work |
| [KNOCH-002](tickets/KNOCH-002.md) | Design Tokens & CSS Custom Properties | `✅` | `feature/KNOCH-002-design-tokens` | QA PASSED — merged to test |
| [KNOCH-016](tickets/KNOCH-016.md) | Smooth Scrolling — Lenis + ScrollTrigger Sync | `✅` | `feature/KNOCH-016-lenis-smooth-scroll` | QA PASSED — merged to test |
| [KNOCH-003](tickets/KNOCH-003.md) | Cinematic Chrome Navigation + Timecode Bar | `✅` | `feature/KNOCH-003-chrome-navigation` | QA PASSED — merged to test |
| [KNOCH-004](tickets/KNOCH-004.md) | Custom Cursor & Film-Grain Overlay | `✅` | `feature/KNOCH-004-cursor-film-grain` | QA PASSED — merged to test |

---

## CMS — Content Layer (Sanity)

KNOCH-022 and KNOCH-023 are infrastructure — implement these first. The wiring tickets (024–026) slot in immediately after their dependent section is built. Do not start 024 before 009, or 025 before 007. KNOCH-026 can start now (005 is done).

| ID | Title | Status | Branch | Notes |
|----|-------|--------|--------|-------|
| [KNOCH-022](tickets/KNOCH-022.md) | Sanity Project Init + Schema Definitions | `✅` | `feature/KNOCH-022-023-sanity-cms-setup` | Studio scaffolded; testimonial, galleryCollection, service schemas deployed; all 5 testimonials + 7 collections entered |
| [KNOCH-023](tickets/KNOCH-023.md) | JS Content-Fetch Layer | `✅` | `feature/KNOCH-022-023-sanity-cms-setup` | `src/js/sanity.js` built with hardened fetch, logging, and `imageUrl()` helper; meta tags in index.html |
| [KNOCH-024](tickets/KNOCH-024.md) | Wire Testimonials to Sanity | `⬜` | — | After KNOCH-009 is built |
| [KNOCH-025](tickets/KNOCH-025.md) | Wire Gallery Reel to Sanity | `✅` | `feature/KNOCH-007-horizontal-reel` | `main.js` fetches `getFeaturedCollections()` → `initReel()`; 3 featured collections with Sanity CDN images; `subtitle` field added to schema |
| [KNOCH-026](tickets/KNOCH-026.md) | Migrate Hero Images to Sanity CDN | `⏸` | — | Deferred — hero is LCP-critical and design-tied; static files are the correct approach |
| [KNOCH-027](tickets/KNOCH-027.md) | Wire About Page to Sanity | `⬜` | — | After KNOCH-013 (about page) is built |
| [KNOCH-028](tickets/KNOCH-028.md) | Wire Services Page to Sanity | `⬜` | — | After services page is built |
| [KNOCH-029](tickets/KNOCH-029.md) | Blog Listing Page | `⏸` | — | Deferred — blog schema needs redesign (dynamic related posts, YouTube + Instagram content types) |
| [KNOCH-030](tickets/KNOCH-030.md) | Blog Post Detail Page | `⏸` | — | Deferred — blocked by KNOCH-029 redesign |

---

## Phase 2 — Homepage Sections

Build top-to-bottom in scroll order. Wire each section to Sanity immediately after it is built (see CMS section above). Test the complete homepage scroll experience before moving to Phase 3.

| ID | Title | Status | Branch | Notes |
|----|-------|--------|--------|-------|
| [KNOCH-005](tickets/KNOCH-005.md) | Hero — Film Counter Loader + Reveal Sequence | `✅` | `feature/KNOCH-005-hero-section` | QA PASSED — merged to test. Hero images stay static. |
| [KNOCH-006](tickets/KNOCH-006.md) | Interlude — Word-by-Word Scroll Reveal | `✅` | `feature/KNOCH-006-interlude-manifesto` | QA PASSED — merged to test |
| [KNOCH-007](tickets/KNOCH-007.md) | Horizontal Reel — Pinned Scroll Carousel | `✅` | `feature/KNOCH-007-horizontal-reel` | Sanity-driven (3 featured collections); cinematic full-greyscale filter; inner parallax; KNOCH-025 included |
| [KNOCH-008](tickets/KNOCH-008.md) | Pinned Frame — Parallax + Animated Counters | `✅` | `feature/KNOCH-008-pinned-frame` | QA PASSED — merged to test |
| [KNOCH-009](tickets/KNOCH-009.md) | Testimonial Pull-Quote Section | `🔵` | `feature/KNOCH-009-testimonial-section` | Scroll-stagger reveal → wire via KNOCH-024 |
| [KNOCH-010](tickets/KNOCH-010.md) | Portfolio Grid — Asymmetric 12-Col Archive | `⬜` | — | 7 tiles, contact-sheet layout |

---

## Phase 3 — Secondary Pages

Build in this order: About → Portfolio page → Project detail → Contact → Footer.

| ID | Title | Status | Branch | Notes |
|----|-------|--------|--------|-------|
| [KNOCH-013](tickets/KNOCH-013.md) | About / Story Section (about.html) | `⬜` | — | Sticky split layout |
| [KNOCH-011](tickets/KNOCH-011.md) | Portfolio Filter System (portfolio.html) | `⬜` | — | Category tabs, URL hash state |
| [KNOCH-012](tickets/KNOCH-012.md) | Project Detail View + Video Lightbox | `⬜` | — | Expanding tile transition |
| [KNOCH-014](tickets/KNOCH-014.md) | Contact — Multi-Step Qualified Inquiry Form | `⬜` | — | 3-step form + Calendly sidebar |
| [KNOCH-015](tickets/KNOCH-015.md) | Footer — Credits Bar + Sitemap Variant | `⬜` | — | Two variants: minimal + expanded |

---

## Phase 4 — Integrations

| ID | Title | Status | Branch | Notes |
|----|-------|--------|--------|-------|
| [KNOCH-017](tickets/KNOCH-017.md) | YouTube Integration — Lightbox + Showreel | `⬜` | — | Lazy iframe inject on click |
| [KNOCH-018](tickets/KNOCH-018.md) | Instagram Feed Integration | `⬜` | — | Behold.so or static fallback |

---

## Phase 5 — Polish & Ship

Run in this exact order: perf first (changes markup), then mobile (tests perf changes on device), then a11y (audits finished components).

| ID | Title | Status | Branch | Notes |
|----|-------|--------|--------|-------|
| [KNOCH-019](tickets/KNOCH-019.md) | Performance Optimization — Images, Build, CWV | `⬜` | — | Lighthouse ≥85 mobile target |
| [KNOCH-020](tickets/KNOCH-020.md) | Responsive / Mobile Adaptations | `⬜` | — | 800px breakpoint; reel → CSS snap |
| [KNOCH-021](tickets/KNOCH-021.md) | Accessibility Pass — WCAG 2.1 AA | `⬜` | — | Reduced motion, focus, ARIA |

---

## Dependency Graph

```
001 (scaffold)
 └─ 002 (tokens)
     ├─ 003 (nav)
     ├─ 004 (cursor)
     ├─ 016 (Lenis)
     │   └─ 007 (reel) ──────────────────────────┐
     ├─ 005 (hero) ✅                              │
     │   └─ 006 (interlude)                       │
     │       └─ [007] ──── 008 ── 009 ────────────┤
     │                                            │
     │                               010 (grid)   │
     │                               011          │
     │                               012 ─────────┤
     │                               013          │
     │                               014          │
     │                               015          │
     │                                            │
     ├─ 017 (YouTube) ── links into 012 ──────────┘
     ├─ 018 (Instagram)
     │
     └─ 019 (perf) → 020 (mobile) → 021 (a11y)

CMS layer (cuts across phases — wire each section after it is built):

022 (Sanity init) ✅
 └─ 023 (fetch layer) ✅
     ├─ 024 (wire testimonials) ── after 009
     ├─ 025 (wire reel) ✅       ── done with 007
     ├─ 026 (hero images) ⏸     ── deferred (hero stays static)
     ├─ 027 (wire about) ──       after 013
     └─ 028 (wire services)     ── after services page built
```

---

## Pages & Entry Points

| Page | File | Key Tickets |
|------|------|-------------|
| Homepage | `src/index.html` | 003–010, 015, 017 |
| Portfolio | `src/portfolio.html` | 011, 012 |
| Project detail | `src/project.html` | 012, 017 |
| About | `src/about.html` | 013, 018 |
| Contact / Booking | `src/contact.html` | 014 |
| Blog listing | `src/blog.html` | 029 |
| Blog post detail | `src/blog-post.html` | 030 |
| Internal gallery | `src/gallery/[name].html` | 012 (Jojo, Woodsmen) |

---

## Design System Reference

| Token | Value | Used in |
|-------|-------|---------|
| `--ink` | `#0a0a0a` | All backgrounds |
| `--paper` | `#ede6d8` | All text |
| `--amber` | `#e8a23a` | Accents, active states |
| `--rust` | `#7a2418` | Sparingly (error states) |
| `--font-serif` | Fraunces 300/400 | Headlines |
| `--font-mono` | JetBrains Mono 400/500 | UI chrome, labels |
| `--font-sans` | Inter Tight 400/500 | Body copy |
| `--z-loader` | `10000` | Film counter loader |
| `--z-cursor` | `9999` | Custom cursor |
| `--z-chrome` | `50` | Fixed nav overlay |

---

## Changelog

All modifications to this document and ticket files are logged here. Tester agent and code review feedback should be recorded as entries.

---

### 2026-05-05 — KNOCH-006 QA PASSED — re-test after fix

**Action:** Re-test by Tester Agent. All 15 ACs pass. PR #10 merged to test.
**Tickets affected:** KNOCH-006
**Reason:** Builder applied fix `fix(interlude): retarget word-splitter from blockquote to inner <p> (KNOCH-006)`. The blocker from the first QA run is resolved — `const para = quote.querySelector('p') ?? quote` now correctly targets the `<p>` inside the blockquote, and all `appendChild`/`querySelectorAll` calls operate on `para`. Word-split produces a non-empty NodeList; GSAP ScrollTrigger animates all words.
**Changes:**
- KNOCH-006: Status changed NEEDS FIXES → QA PASSED
- PR #10: Merged dev → test
- Test report: Result updated to PASSED; Re-test section appended
- Dashboard badge: Needs Fixes → QA Passed (green); PR #10 removed from Open PRs
- Stat counts: Needs fixes 1→0, Done 6→7
**Completed by:** Tester Agent

---

### 2026-05-05 — KNOCH-006 QA FAILED — NEEDS FIXES

**Action:** QA run by Tester Agent. 1 BLOCKER found. PR #10 blocked.
**Tickets affected:** KNOCH-006
**Reason:** Word-splitter JS targets `<blockquote>` childNodes instead of inner `<p>` childNodes — zero `.word` spans are created, the scroll reveal does not function.
**Changes:**
- KNOCH-006: Status changed IN REVIEW → NEEDS FIXES
- PR #10: Changes requested (comment posted — GitHub API prevented formal review on own PR)
- Dashboard badge: In Review → Needs Fixes
- Stat counts: In review 1→0, Needs fixes 0→1
**Blockers:**
1. **BLOCKER** — `src/js/interlude.js` line 37: `Array.from(quote.childNodes)` iterates the `<blockquote>` (whose only child is `<p>`). The `<p>` hits the `else { cloneNode(true) }` branch and is copied back unchanged. No `.word` spans are produced. Fix: use `quote.querySelector('p') ?? quote` as the split target.
**Non-blocking issues:**
- Redundant `w.style.opacity = '1'` in reduced-motion JS path (CSS already handles via `opacity: 1 !important`)
**Passing checks:** CSS layout/label/blockquote/signature/word/mobile/reduced-motion all correct. GSAP parameters correct. `interlude.css` linked in head. `initInterlude()` imported+called in main.js. `.grain` class applied. Token names correct. Build clean (20 modules, 88ms).
**Full report:** `docs/test-reports/KNOCH-006-test-report.md`
**Completed by:** Tester Agent

---

### 2026-05-05 — KNOCH-009 PR opened — IN REVIEW

**Action:** PR #12 opened dev → test
**Tickets affected:** KNOCH-009
**Reason:** Builder agent completed testimonial pull-quote section; PR open for tester/code review
**Changes:**
- KNOCH-009: Status changed MERGED TO DEV → IN REVIEW
- PR #12 opened: dev → test at https://github.com/eayanwale/knochmedia/pull/12
- Files delivered:
  - `src/css/testimonial.css` — section layout (14rem 8vw padding, 1px border-top), quote mark (8rem Fraunces amber), pull-quote (clamp 28–56px, 22ch max-width, em amber italic), attribution (10px mono, 0.3em LS, muted), mobile ≤800px, reduced-motion overrides
  - `src/js/testimonial.js` — GSAP stagger from y:40 opacity:0, duration:1.2, stagger:0.15, expo.out, ScrollTrigger top 75%, once:true, prefers-reduced-motion guard
  - `src/index.html` — testimonial section inserted between #frame and #cta; testimonial.css linked in head
  - `src/js/main.js` — initTestimonial() import and call after initFrame()
- Build: 27 modules, 14.18 kB CSS / 3.54 kB gz, 142.07 kB JS / 52.77 kB gz, 89ms
- Header counts updated: In progress 1→0, In review 0→1
**Requested by:** Builder agent

---

### 2026-05-05 — KNOCH-009 implementation started — IN PROGRESS

**Action:** Feature branch created; implementation in progress
**Tickets affected:** KNOCH-009
**Reason:** Builder agent starting testimonial pull-quote section implementation
**Changes:**
- KNOCH-009: Status changed TODO → IN PROGRESS
- Branch `feature/KNOCH-009-testimonial-section` created from dev
- Header counts updated: Open 15→14, In progress 0→1
**Requested by:** Builder agent

---

### 2026-05-05 — KNOCH-008 QA PASSED — merged to test

**Action:** QA run by Tester Agent. All 13 ACs pass. PR #11 merged to test.
**Tickets affected:** KNOCH-008
**Reason:** All acceptance criteria verified — CSS layout, sticky parallax, counter animation, headline reveal, toLocaleString formatting, ARIA labels, mobile stack, and reduced-motion guard all confirmed correct.
**Changes:**
- KNOCH-008: Status changed IN REVIEW → QA PASSED
- PR #11: Merged dev → test
- Test report written: `docs/test-reports/KNOCH-008-test-report.md`
- Dashboard badge: In Review → QA Passed (green); PR #11 removed from Open PRs
- Stat counts: In review 1→0, Done 11→12
**Non-blocking LOW note:** `.big` headline reveal and counter tweens lack `prefers-reduced-motion` guards (they fall back gracefully to static HTML) — full guard will be added in KNOCH-021 accessibility pass.
**Completed by:** Tester Agent

---

### 2026-05-05 — KNOCH-008 PR opened — IN REVIEW

**Action:** PR #11 opened dev → test
**Tickets affected:** KNOCH-008
**Reason:** Builder agent completed implementation of pinned parallax + animated studio stats section
**Changes:**
- KNOCH-008: Status changed TODO → IN PROGRESS → MERGED TO DEV → IN REVIEW
- Branch `feature/KNOCH-008-pinned-frame` created, implemented, merged into `dev`
- PR #11 opened: dev → test at https://github.com/eayanwale/knochmedia/pull/11
- Files delivered:
  - `src/css/frame.css` — section layout, parallax bg, stat typography, grain overlay, mobile stack, reduced-motion overrides
  - `src/js/frame.js` — GSAP parallax tween, .big headline reveal, three animated counters with toLocaleString and once:true
  - `src/index.html` — complete #frame section markup with ARIA labels, frame.css linked in head
  - `src/js/main.js` — initFrame() import and call after initInterlude()
- Build: 25 modules, 13.33 kB CSS / 3.39 kB gz, 141.77 kB JS / 52.71 kB gz, 96ms
- Header counts updated: In progress 1→0, In review 0→1
**Requested by:** Builder agent

---

### 2026-05-05 — KNOCH-008 QA PASSED — merged to test

**Action:** PR #11 merged (dev → test) — KNOCH-008 QA PASSED
**Tickets affected:** KNOCH-008
**Reason:** Tester agent verified all 13 acceptance criteria and all additional checks; build clean at 98ms
**Changes:**
- KNOCH-008: Status changed IN REVIEW → QA PASSED
- PR #11 merged with full merge commit; branch `feature/KNOCH-008-pinned-frame` deleted
- All test plan checkboxes ticked in PR body
- Test report written: `docs/test-reports/KNOCH-008-test-report.md`
- Header counts updated: In review 1→0, Done 11→12
- Non-blocking note: headline/counter tweens not behind `prefers-reduced-motion` guard (parallax-only guard meets AC; full motion guard is KNOCH-021 scope)
**Completed by:** Tester Agent

---

### 2026-05-05 — KNOCH-007 + KNOCH-022/023/025 DONE — reel + CMS layer complete

**Action:** KNOCH-007 implemented and merged to test; KNOCH-022/023/025 completed in same session
**Tickets affected:** KNOCH-007, KNOCH-022, KNOCH-023, KNOCH-025, KNOCH-026 (deferred)
**Changes:**
- KNOCH-007: ⬜ → ✅ Done. Branch `feature/KNOCH-007-horizontal-reel` merged to test.
  - Horizontal pinned carousel, GSAP ScrollTrigger scrub:0.8, inner parallax via containerAnimation
  - Full cinematic greyscale filter (grayscale(1)) at rest; colour reveals on hover
  - Film-notch L-bracket corners, FRAME label, meta slide-up on hover
  - Mobile: CSS snap scroll replaces GSAP pin at ≤800px
  - Studio files from CMS branch cherry-picked onto this branch and committed
- KNOCH-022: 🔵 → ✅ Done. Sanity Studio running locally and deployed; all schemas live; 5 testimonials, 7 gallery collections, services entered.
- KNOCH-023: 🔵 → ✅ Done. `src/js/sanity.js` hardened with optional chaining, null guards, console logging for debug; `imageUrl()` helper; meta tags in index.html.
- KNOCH-025: ⬜ → ✅ Done (bundled with KNOCH-007). `main.js` fetches `getFeaturedCollections()` → maps to card shape → `initReel()`. Static CARDS fallback uses Sanity CDN URLs directly. `subtitle` field added to `galleryCollection` schema (Studio: fill in "Maryland · 2024" style labels per collection).
- KNOCH-026: ⬜ → ⏸ Deferred. Hero images are LCP-critical and design-tied — static files are correct. Sanity CDN adds latency with no benefit here.
- KNOCH-027: Added to CMS table (was missing). Open — blocked until KNOCH-013.
- Stat counts: In progress 2→0, Done 7→11, Open 19→16, Deferred 2→3
**Requested by:** Enoch / Builder agent

---

### 2026-05-05 — KNOCH-022 through KNOCH-026 created — CMS integration planned

**Action:** 5 new CMS tickets created; KNOCH-022 and KNOCH-023 implemented in session  
**Tickets affected:** KNOCH-022, KNOCH-023, KNOCH-024, KNOCH-025, KNOCH-026  
**Reason:** Adding Sanity CMS so content (testimonials, galleries, hero images) can be managed via Studio UI without code changes  
**Changes:**
- KNOCH-022: Created + 🔵 In progress — Sanity Studio scaffolded, all schemas deployed, 5 testimonials entered
- KNOCH-023: Created + 🔵 In progress — `src/js/sanity.js` built, Sanity meta tags added to `index.html`
- KNOCH-024: Created + ⬜ Open — blocked until KNOCH-009 is built
- KNOCH-025: Created + ⬜ Open — blocked until KNOCH-007 is built
- KNOCH-026: Created + ⬜ Open — can start now (KNOCH-005 ✅)
- New CMS phase section added to summary; dependency graph updated
- Header counts updated: Total 21→26, Open 13→17, In progress 0→2  
**Requested by:** Enoch

---

### 2026-05-05 — KNOCH-006 PR opened — IN REVIEW

**Action:** PR #10 opened dev → test
**Tickets affected:** KNOCH-006
**Reason:** Builder agent completed implementation; PR open for tester/code review
**Changes:**
- KNOCH-006: Status changed MERGED TO DEV → IN REVIEW
- PR #10 opened: dev → test at https://github.com/eayanwale/knochmedia/pull/10
- Header counts updated: In progress 1→0, In review 0→1
**Requested by:** Builder agent

---

### 2026-05-05 — KNOCH-006 implementation complete — MERGED TO DEV

**Action:** Implemented and merged to dev; PR to be opened dev → test
**Tickets affected:** KNOCH-006
**Reason:** Builder agent completed the interlude manifesto section with word-by-word scroll reveal
**Changes:**
- KNOCH-006: Status changed TODO → IN PROGRESS → MERGED TO DEV
- Branch `feature/KNOCH-006-interlude-manifesto` created, implemented, merged into `dev`
- Files delivered:
  - `src/css/interlude.css` — section layout, label, blockquote typography, .word spans, signature, mobile + reduced-motion overrides
  - `src/js/interlude.js` — childNodes word-splitter, GSAP ScrollTrigger desktop scrub, IntersectionObserver mobile fallback, prefers-reduced-motion guard
  - `src/index.html` — interlude section markup between hero and reel, interlude.css link in head
  - `src/js/main.js` — initInterlude() import and call after initHero()
- Build: 20 modules, 7.95kB CSS / 2.41kB gz, 136.66kB JS / 50.92kB gz, 87ms
**Requested by:** Builder agent

---

### 2026-05-05 — KNOCH-005 QA PASSED

**Action:** QA run by Tester Agent. All 29 acceptance criteria pass.
**Tickets affected:** KNOCH-005
**Reason:** Hero section loader, reveal sequence, scroll exit, and asset verified against ticket spec and production bundle.
**Changes:**
- KNOCH-005: Status changed IN REVIEW → QA PASSED
- PR #6 merged: dev → test
- Dashboard badge updated: In Review → QA Passed (green)
- Stat counts updated: In review 1→0, Done 5→6, Open 15→14
**Passing checks:** All 29 ACs — #loader fixed/inset/z-index/ink bg, .loader-counter 18vw/Fraunces/300, GSAP proxy tween {val:0}→36/Math.ceil/padStart, amber label above counter (11px/0.3em/uppercase), .loader-progress 240px×1px/.loader-progress-fill amber, loader autoAlpha fade delay:2 + display:none onComplete, window.load trigger, body.loader-active .cursor{opacity:0}, #hero 100vh×100vw/overflow:hidden/flex center, .hero-bg absolute/inset0/cover/brightness(0.45)/grayscale(0.4)/contrast(1.15)/scale(1.1), reel-01.png background-image, preload link in head, .hero-content relative/z-index:2/text-center/padding:0 5vw, .hero-meta font-mono/10px/0.3em/amber/opacity:0, .line overflow:hidden/display:block, .line span translateY(110%), four headline lines with italic em, #hero-sub opacity:0/correct copy, reveal tl at t=0 scale1.1→1/2.4s/power3.out, meta opacity 0→1 at t=0, lineSpans y:0/1.2s/expo.out/stagger:0.12 at t=0.2, heroSub opacity at t=1.4, chrome opacity:0 pre-loader/faded in onComplete, initLenis not in main.js/called in onComplete, main.js imports+calls initHero, ScrollTrigger yPercent:25 on heroBg (trigger#hero/top-top/bottom-top/scrub), ScrollTrigger yPercent:-40+opacity:0 on heroContent, prefers-reduced-motion overrides, reel-01.png exists on disk, npm run build clean.
**LOW notes:** Two rgba(237,230,216,…) alpha values in hero.css not using named tokens (non-blocking); PR description references old hero-01.jpg filename (doc only, no code impact).
**Full report:** `docs/test-reports/KNOCH-005-test-report.md`
**Completed by:** Tester Agent

---

### 2026-05-05 — KNOCH-005 implementation complete — MERGED TO DEV

**Action:** Implemented and merged to dev; PR to be opened dev → test
**Tickets affected:** KNOCH-005
**Reason:** Builder agent completed the hero section with film-counter loader, reveal sequence, and scroll exit
**Changes:**
- KNOCH-005: Status changed TODO → IN REVIEW
- Branch `feature/KNOCH-005-hero-section` created, implemented, merged into `dev`
- Files delivered:
  - `src/css/hero.css` — loader overlay styles, hero layout, clip-reveal, vignette, reduced-motion overrides
  - `src/js/hero.js` — film-counter GSAP tween, progress bar, loader fade-out, reveal timeline, ScrollTrigger exits
  - `src/index.html` — loader HTML, full hero section markup, hero-01.jpg preload, hero.css link
  - `src/js/main.js` — removed direct initLenis() call; added initHero() import+call
  - `src/css/cursor.css` — added body.loader-active .cursor rule
  - `src/assets/hero/hero-01.jpg` — hero image copied from reference
- Build: 18 modules, 270kB hero image, 6.74 kB CSS / 2.19 kB gz, 135.48 kB JS / 50.56 kB gz, 84ms
- Header counts updated: Open 16→15
**Requested by:** Builder agent

---

### 2026-05-05 — KNOCH-004 QA PASSED

**Action:** QA run by Tester Agent. All 8 acceptance criteria pass.
**Tickets affected:** KNOCH-004
**Reason:** Custom cursor and film-grain overlay verified against ticket spec and production bundle.
**Changes:**
- KNOCH-004: Status changed IN REVIEW → QA PASSED
- PR #5 merged: dev → test
- Dashboard badge updated: In Review → QA Passed (green)
- Stat counts updated: In review 1→0, Done 4→5
**Passing checks:** All 8 ACs — .cursor fixed properties (position/24px/amber border/border-radius/pointer-events/z-index/mix-blend-mode), 2px amber ::before dot, GSAP quickTo x+y (0.35s/power3.out) with GSAP auto-detecting CSS translate(-50%,-50%) for correct centering, .cursor.grow (80px/rgba amber fill/event delegation on a+button+.reel-card+.tile+.cta .button), mobile hidden (width<=800px + pointer:coarse), feTurbulence grain (baseFrequency:0.9/numOctaves:2/opacity:0.17/static data URI), no canvas/rAF in grain, cursor:none scoped to @media(pointer:fine) for progressive enhancement.
**Full report:** `docs/test-reports/KNOCH-004-test-report.md`
**Completed by:** Tester Agent

---

### 2026-05-05 — KNOCH-004 implementation complete — PR #5 open

**Action:** Implemented and PR opened dev → test
**Tickets affected:** KNOCH-004
**Reason:** Builder agent completed the custom cursor + film-grain overlay layer
**Changes:**
- KNOCH-004: Status changed TODO → IN PROGRESS → MERGED TO DEV → IN REVIEW
- Branch `feature/KNOCH-004-cursor-film-grain` created, implemented, merged into `dev`
- PR #5 opened: dev → test at https://github.com/eayanwale/knochmedia/pull/5
- Files delivered: `src/css/cursor.css` (cursor ring + grow state + .grain::after film-grain overlay), `src/js/cursor.js` (GSAP quickTo tracking + grow/shrink), `src/index.html` (cursor element + section stubs with .grain class), `src/js/main.js` (initCursor call)
- Build: 16 modules, 4.53 kB CSS / 1.67 kB gz, 133.78 kB JS / 50.23 kB gz, 79ms
**Requested by:** Builder agent

---

### 2026-05-05 — KNOCH-003 QA PASSED

**Action:** QA run by Tester Agent. All 10 acceptance criteria pass.
**Tickets affected:** KNOCH-003
**Reason:** Chrome navigation overlay verified against ticket spec, reference design, and production bundle.
**Changes:**
- KNOCH-003: Status changed IN REVIEW → QA PASSED
- PR #4 merged: dev → test
- Dashboard badge updated: In Review → QA Passed (green)
- Stat counts updated: In review 1→0, Done 3→4
**Passing checks:** All 10 ACs — .chrome fixed properties (position/inset/pointer-events/z-index/mix-blend-mode), 3-col grid, Fraunces wordmark with amber dot, 11px mono nav links with ease-cinematic underline-slide, setInterval timecode, bottom timecode bar with K/M·2026·MARYLAND, 800px breakpoint hides nav-center, focus-visible outlines, frame counter Math.ceil formula 1–36. LOW note: role="progressbar" inside aria-hidden parent (KNOCH-021 scope).
**Full report:** `docs/test-reports/KNOCH-003-test-report.md`
**Completed by:** Tester Agent

---

### 2026-05-05 — KNOCH-003 implementation complete — PR #4 open

**Action:** Implemented and PR opened dev → test
**Tickets affected:** KNOCH-003
**Reason:** Builder agent completed the chrome navigation overlay
**Changes:**
- KNOCH-003: Status changed TODO → IN PROGRESS → MERGED TO DEV → IN REVIEW
- Branch `feature/KNOCH-003-chrome-navigation` created, implemented, merged into `dev`
- PR #4 opened: dev → test at https://github.com/eayanwale/knochmedia/pull/4
- Files delivered: `src/css/chrome.css`, `src/js/chrome.js`, `src/index.html` updated, `src/js/main.js` updated
- Build: 14 modules, 3.29 kB CSS / 1.27 kB gz, 133.02 kB JS / 50.04 kB gz, 79ms
**Requested by:** Builder agent

---

### 2026-05-05 — KNOCH-016 QA PASSED

**Action:** QA run by Tester Agent. All 9 acceptance criteria pass.
**Tickets affected:** KNOCH-016
**Reason:** Lenis module verified against ticket spec, Lenis v1.3.23 API, and production bundle.
**Changes:**
- KNOCH-016: Status changed IN REVIEW → QA PASSED
- PR #3 merged: dev → test
- Dashboard badge updated: In Review → QA Passed (green)
- Stat counts updated: In review 1→0, Done 2→3
**Passing checks:** All 9 ACs — lenis in package.json, constructor options (duration/easing/orientation/smoothWheel/autoRaf), GSAP ticker add + lagSmoothing(0), ScrollTrigger proxy with scrollTop getter/setter + getBoundingClientRect, lenis.on('scroll') sync, pointer:coarse touch guard, stopLenis/startLenis exports, 5 named exports from lenis.js, scrollTo() with duration 1.5 + touch fallback, main.js bootstrap, npm run build clean.
**Full report:** `docs/test-reports/KNOCH-016-test-report.md`
**Completed by:** Tester Agent

---

### 2026-05-05 — KNOCH-016 implementation complete — PR #3 open

**Action:** Implemented and PR opened dev → test
**Tickets affected:** KNOCH-016
**Reason:** Builder agent completed Lenis smooth scroll layer
**Changes:**
- KNOCH-016: Status changed TODO → IN PROGRESS → MERGED TO DEV → IN REVIEW
- Branch `feature/KNOCH-016-lenis-smooth-scroll` created, implemented, merged into `dev`
- PR #3 opened: dev → test at https://github.com/eayanwale/knochmedia/pull/3
- Files delivered: `src/js/lenis.js` (Lenis module + GSAP sync), `src/js/main.js` (updated bootstrap)
- Build verified: vite v8.0.10, 12 modules, 131.73 kB JS / 49.59 kB gzip (expected — GSAP+Lenis bundled)
**Requested by:** Builder agent

---

### 2026-05-05 — KNOCH-002 QA PASSED

**Action:** QA run by Tester Agent. All 11 acceptance criteria pass.
**Tickets affected:** KNOCH-002
**Reason:** Design token layer verified against ticket spec, reference values, and production build output.
**Changes:**
- KNOCH-002: Status changed IN REVIEW → QA PASSED
- PR #2 merged: dev → test
- Dashboard badge updated: In Review → QA Passed (green)
- Stat counts updated: In review 1→0, Done 1→2
**Passing checks:** All 11 ACs — tokens.css on :root, exact color values (#0a0a0a/#ede6d8/#e8a23a/#7a2418/rgba), 4 semantic tokens, 3 font stacks, 6-step spacing scale (4–128px), 3 easing cubic-beziers, z-index layers (10000/9999/50), 2 radius tokens, global.css reset + imports, pointer:fine cursor scoping, light-mode stub, global.css linked in index.html.
**Full report:** `docs/test-reports/KNOCH-002-test-report.md`
**Completed by:** Tester Agent

---

### 2026-05-05 — KNOCH-002 implementation complete — PR #2 open

**Action:** Implemented and PR opened dev → test  
**Tickets affected:** KNOCH-002  
**Reason:** Builder agent completed the full design token layer  
**Changes:**
- KNOCH-002: Status changed TODO → IN PROGRESS → MERGED TO DEV → IN REVIEW
- Branch `feature/KNOCH-002-design-tokens` created, implemented, and merged into `dev`
- PR #2 opened: dev → test at https://github.com/eayanwale/knochmedia/pull/2
- Files delivered: `src/css/tokens.css` (all design tokens on `:root`), `src/css/global.css` (imports tokens + baseline reset)
- Build verified: `vite v8.0.10`, 5 modules transformed, `dist/` emitted cleanly in 110ms
**Requested by:** Builder agent

---

### 2026-05-05 — KNOCH-001 QA PASSED on re-test

**Action:** Re-test by Tester Agent. All 8 acceptance criteria now pass.
**Tickets affected:** KNOCH-001
**Reason:** Builder applied the two fixes identified in the initial QA run: `src/js/main.js` and `src/css/global.css` were created as empty stub files. `npm run build` now exits cleanly (`vite v8.0.10`, 5 modules transformed, `dist/` emitted with hashed assets in 33ms).
**Changes:**
- KNOCH-001: Status changed NEEDS FIXES → QA PASSED
- Dashboard badge updated: Needs Fixes → QA Passed (green)
- Stat counts updated: In progress 1→0, Done 0→1
**Passing checks:** All 8 ACs — directory tree, vanilla Vite, dev script, npm run build (now PASS), Google Fonts in index.html, .gitignore, package scripts, vite.config base + outDir.
**Full report:** `docs/test-reports/KNOCH-001-test-report.md` (Re-test section appended)
**Completed by:** Tester Agent

---

### 2026-05-05 — KNOCH-001 QA FAILED — Needs Fixes

**Action:** QA run by Tester Agent. Build pipeline blocked by missing stub files.
**Tickets affected:** KNOCH-001
**Reason:** `npm run build` exits with a hard error — `src/js/main.js` does not exist (only `.gitkeep` present). `src/index.html` references this file as a `<script type="module">` entry, so Vite cannot resolve it and emits no `dist/` output. `src/css/global.css` is similarly absent but does not block the build on its own.
**Changes:**
- KNOCH-001: Status changed IN REVIEW → NEEDS FIXES
**Failing checks:**
1. **BLOCKER — AC-4 (`npm run build`):** `Error: Failed to resolve /src/js/main.js from src/index.html`. Fix: create `src/js/main.js` as a minimal stub ES module.
2. **LOW — `src/css/global.css` missing:** Browser will 404 on the stylesheet link. Fix: create `src/css/global.css` as an empty stub (content will be added in KNOCH-002).
**Passing checks:** AC-1 (directory tree), AC-2 (vanilla Vite), AC-5 (Google Fonts in index.html), AC-6 (.gitignore), AC-7 (package scripts), AC-8 (vite.config base + outDir), GSAP/Lenis as npm deps.
**Full report:** `docs/test-reports/KNOCH-001-test-report.md`
**Requested by:** Tester Agent

---

### 2026-05-05 — KNOCH-001 completed and PR open

**Action:** Implemented, merged to dev, PR open dev → test  
**Tickets affected:** KNOCH-001  
**Reason:** Builder agent completed full scaffold implementation  
**Changes:**
- KNOCH-001: Status changed TODO → IN PROGRESS → MERGED TO DEV → IN REVIEW
- Branch `feature/KNOCH-001-project-scaffold` created, implemented, and merged into `dev`
- PR #1 opened: dev → test at https://github.com/eayanwale/knochmedia/pull/1
- `test` branch created from `main` and pushed to remote
- Files delivered: `package.json`, `vite.config.js`, `src/index.html`, `src/css/`, `src/js/`, `src/assets/`, `.gitignore` updated, all reference files organised into `src/reference/` and `src/design/`
**Requested by:** Builder agent

---

### 2026-05-05 — Initial ticket creation

**Action:** Created all 21 KNOCH tickets from reference analysis.  
**Source:** `src/reference/final demo.html`, `knoch_homepage_redesign_mockup.html`, `concept_02_cinema_verite demo.html`, `knoch_booking_page_redesign.html`, `knoch_portfolio_page_redesign.html` + `src/design/Knoch-Brand-Design-System.pdf`.  
**Tickets created:** KNOCH-001 through KNOCH-021  
**Created by:** Planner agent

---

<!-- 
TEMPLATE — copy this block when logging a new changelog entry:

### YYYY-MM-DD — [Entry title]

**Action:** [Created / Modified / Closed / Split / Blocked]  
**Tickets affected:** KNOCH-XXX, KNOCH-XXX  
**Reason:** [Why the change was made — tester feedback, design revision, scope change]  
**Changes:** 
- KNOCH-XXX: [what changed in the acceptance criteria or design notes]
- KNOCH-XXX: [new ticket added to cover X]  
**Requested by:** [Tester agent / Enoch / Code review]

-->
