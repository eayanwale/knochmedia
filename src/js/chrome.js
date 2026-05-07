import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { scrollTo } from './lenis.js';

gsap.registerPlugin(ScrollTrigger);

/* GSAP frame-budget cap (KNOCH-019). Pins ticker.fps to 60 so on
   120 Hz / variable-refresh displays GSAP doesn't tick at the higher
   rate - the reel + frame parallax + cursor + glass header all read
   identically at 60 fps and the cap saves ~50% animation CPU on
   high-refresh laptops. Set at module scope (not inside initChrome)
   so the cap is in place before any other module's GSAP work starts;
   chrome.js is imported by every page entry so this fires once per
   page load regardless of which entry boots. */
gsap.ticker.fps(60);

export function initChrome() {
  _initScrollProgress();
  _initTimecode();
  _initNavLinks();
  _initGlassHeader();
  _initMobileNav();

  window.addEventListener('resize', () => ScrollTrigger.refresh(), { passive: true });
}

/* Mobile hamburger nav (KNOCH-020).
   The chrome HTML on every page entry includes both .nav-center
   (desktop) and .nav-overlay (mobile). On init we clone the
   .nav-center > a links into .nav-overlay-inner so the link list
   stays a single source of truth - a future page that adjusts its
   nav-center link set automatically gets the same set in its mobile
   overlay without a separate edit.

   Open / close behaviour:
     - Click .nav-toggle             -> toggle .is-open on toggle + overlay,
                                        body gets .nav-overlay-open to lock scroll
     - Click any link inside overlay -> close (so internal anchor scrolls work)
     - Press Escape while open       -> close
     - Resize past 800 px            -> close (defensive, prevents stuck-open
                                        state if user rotates from mobile to
                                        landscape iPad).

   Animation: GSAP fade on the overlay (CSS already handles opacity)
   plus a stagger on the link spans from y: 24 -> 0 with 0.06s
   stagger so the links cascade up rather than appearing in a block. */
function _initMobileNav() {
  const toggle  = document.querySelector('.nav-toggle');
  const overlay = document.querySelector('.nav-overlay');
  const inner   = document.querySelector('.nav-overlay-inner');
  const navCenter = document.querySelector('.nav-center');
  if (!toggle || !overlay || !inner || !navCenter) return;

  /* Clone the desktop nav-center links into the overlay. cloneNode(true)
     keeps the existing data-scroll-to / aria-current attributes so the
     mobile links behave identically (smooth-scroll for anchors, current
     marker for the current page). */
  const sourceLinks = navCenter.querySelectorAll('a');
  sourceLinks.forEach(a => inner.appendChild(a.cloneNode(true)));

  /* Visible Close affordance below the nav links (KNOCH-041 follow-up).
     The hamburger toggle morphs to an X when open and is now lifted
     above the overlay via position: fixed, so it's always tappable -
     but the X glyph isn't always read as "close". This explicit
     mono-caps "✕ Close" link makes the exit unmissable. Clicks
     route through the same close() handler. */
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'nav-overlay-close';
  closeBtn.setAttribute('aria-label', 'Close navigation');
  closeBtn.textContent = '✕  CLOSE';
  inner.appendChild(closeBtn);
  closeBtn.addEventListener('click', () => close());

  /* Re-bind the data-scroll-to handlers on the cloned anchors - the
     original handlers in _initNavLinks() are bound to the desktop DOM
     nodes only. */
  inner.querySelectorAll('a[data-scroll-to]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-scroll-to');
      close();
      /* Scroll fires after the close animation so the user sees the
         destination land cleanly. 350 ms matches the overlay fade. */
      setTimeout(() => scrollTo(target, { duration: 1.5 }), 350);
    });
  });

  /* Cross-page links (no data-scroll-to) - just close the overlay
     and let the browser navigate. */
  inner.querySelectorAll('a:not([data-scroll-to])').forEach((link) => {
    link.addEventListener('click', () => close());
  });

  /* Stagger animation targets - include the close button so it
     cascades up alongside the nav links rather than appearing
     instantly while the rest fade in. */
  const links = inner.querySelectorAll('a, .nav-overlay-close');

  function open() {
    toggle.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('nav-overlay-open');

    /* Cascade the links up from y: 24. fromTo so re-opens always start
       from the offset state. */
    gsap.fromTo(links,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: 'expo.out', stagger: 0.06 }
    );
  }

  function close() {
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nav-overlay-open');
  }

  toggle.addEventListener('click', () => {
    if (toggle.classList.contains('is-open')) close();
    else open();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.classList.contains('is-open')) {
      close();
    }
  });

  /* Defensive: if the user resizes past the desktop breakpoint while
     the overlay is open (e.g. rotating an iPad from portrait to
     landscape), close it so the desktop nav doesn't leave the body
     scroll-locked. */
  window.addEventListener('resize', () => {
    if (window.innerWidth > 800 && toggle.classList.contains('is-open')) {
      close();
    }
  }, { passive: true });
}

/* Liquid-glass chrome — fades frosted backdrop panes in on the top
   navbar and the bottom timecode bar. The two surfaces are wired
   independently because they want different behaviour on secondary
   pages.

   Homepage:
     Top + bottom both lockstep on a ScrollTrigger anchored to
     #interlude. Hero stays clear-chrome; when the interlude reaches
     just below the chrome bar both surfaces frost together.

   Other pages (about / portfolio / project / contact):
     - Bottom timecode bar: glass on at page load. The bottom bar
       is largely cosmetic (REC tick + scroll progress + frame
       counter) and reads better with a constant frosted base on
       these pages — there's no cinematic hero requiring it to
       step out of the way.
     - Top navbar: scroll-triggered at ~10 % of document scroll
       so the page's opening still reads clean (about-hero,
       portfolio top, contact opening) before the glass kicks in.
       onLeaveBack reverts when the visitor returns to the top.

   This deliberate top/bottom divergence means the chrome surfaces
   can be in mismatched states on non-homepage pages between page
   load and the 10 % scroll threshold (bottom: glass / top: clear).
   That's the intended look — the bottom strip frames the page
   while the top still floats over the opening. */
function _initGlassHeader() {
  const chrome = document.getElementById('chrome');
  if (!chrome) return;

  /* timecode bar may be missing on a future minimal page; guard
     with optional chaining so the navbar half still works. */
  const timecodeBar = document.querySelector('.timecode-bar');

  const interlude = document.getElementById('interlude');

  if (interlude) {
    /* Homepage — top + bottom in lockstep at the interlude. */
    const setGlass = (on) => {
      chrome.classList.toggle('is-glass', on);
      timecodeBar?.classList.toggle('is-glass', on);
    };
    ScrollTrigger.create({
      trigger: interlude,
      start: 'top top+=80',
      onEnter:     () => setGlass(true),
      onLeaveBack: () => setGlass(false),
    });
    return;
  }

  /* Non-homepage — divergent treatment. */
  timecodeBar?.classList.add('is-glass');

  ScrollTrigger.create({
    trigger: document.body,
    start: '10% top',
    onEnter:     () => chrome.classList.add('is-glass'),
    onLeaveBack: () => chrome.classList.remove('is-glass'),
  });
}

function _initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  const frameDisplay = document.getElementById('frame-display');
  if (!bar || !frameDisplay) return;

  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate(self) {
      const p = self.progress;
      bar.style.setProperty('--p', (p * 100) + '%');

      // Frame counter: 1–36 clamped, derived from scroll progress
      const frame = Math.max(1, Math.min(36, Math.ceil(p * 36)));
      frameDisplay.textContent = `FRAME ${String(frame).padStart(2, '0')} / 36`;

      // Keep the progressbar ARIA value in sync
      bar.setAttribute('aria-valuenow', Math.round(p * 100));
    },
  });
}

function _initTimecode() {
  const tcEl = document.getElementById('tc');
  if (!tcEl) return;

  // setInterval at 1s is accurate enough for HH:MM:SS — avoids burning
  // a continuous rAF on a purely cosmetic UI element
  const start = Date.now();
  setInterval(() => {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    tcEl.textContent = `${h}:${m}:${s}`;
  }, 1000);
}

function _initNavLinks() {
  // Logo — scroll to top via Lenis when clicked on the same page; otherwise
  // let the browser navigate normally so cross-page links (e.g. Knoch.
  // wordmark on about.html → home) actually leave the current document.
  const mark = document.querySelector('.mark');
  if (mark) {
    mark.addEventListener('click', (e) => {
      const target = new URL(mark.href, window.location.href);
      if (target.pathname === window.location.pathname) {
        e.preventDefault();
        scrollTo(0, { duration: 1.2 });
      }
    });
  }

  // Nav anchor links — intercept and route through Lenis scrollTo
  document.querySelectorAll('.nav-center a[data-scroll-to]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-scroll-to');
      scrollTo(target, { duration: 1.5 });
    });
  });
}
