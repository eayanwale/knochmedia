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

  window.addEventListener('resize', () => ScrollTrigger.refresh(), { passive: true });
}

/* Liquid-glass header — fades a frosted backdrop pane in once the
   interlude reaches the top of the viewport. The hero stays clean
   (mix-blend-mode handles its dark cinematography); from interlude
   onward the navbar sits over a soft glass strip so it reads against
   any of the busier sections that follow.

   The trigger element is the homepage interlude. On other pages
   (about / portfolio / project / contact) the element doesn't exist,
   so the glass simply turns on at page load via a fallback below.
   That's the desired behaviour - secondary pages don't have a
   full-bleed cinematic hero, so the navbar wants the glass surface
   from frame 1. */
function _initGlassHeader() {
  const chrome = document.getElementById('chrome');
  if (!chrome) return;

  const interlude = document.getElementById('interlude');

  if (!interlude) {
    /* Non-homepage entry — no hero-to-interlude transition to scrub
       against, so just keep the glass on permanently. The chrome
       transition still fires once on load so it fades in cleanly
       rather than snapping. */
    chrome.classList.add('is-glass');
    return;
  }

  /* Homepage — toggle on as the interlude top reaches just below the
     chrome bar. start: 'top top+=80' fires when the interlude's top
     edge sits 80 px below viewport top, which is roughly the moment
     the navbar starts visually overlapping interlude content rather
     than the hero. onLeaveBack reverts when the visitor scrolls back
     up into the hero so the original mix-blend-mode treatment
     returns over the cinematography. */
  ScrollTrigger.create({
    trigger: interlude,
    start: 'top top+=80',
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
