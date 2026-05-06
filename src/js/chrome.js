import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { scrollTo } from './lenis.js';

gsap.registerPlugin(ScrollTrigger);

export function initChrome() {
  _initScrollProgress();
  _initTimecode();
  _initNavLinks();

  window.addEventListener('resize', () => ScrollTrigger.refresh(), { passive: true });
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
