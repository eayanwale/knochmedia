/**
 * KNOCH-005 — Hero Section: Film-Counter Loader + Reveal Sequence
 *
 * Execution order:
 *   1. DOM ready: set #chrome opacity 0 + add body.loader-active
 *   2. window.load: run film-counter loader (1.8s tween + progress bar)
 *   3. After ~2s: fade out loader, call initLenis(), run hero reveal timeline
 *   4. After reveal: set up ScrollTrigger exit animations
 *
 * Why window.load (not DOMContentLoaded)?
 *   We want the loader to genuinely cover the hero image loading. On fast
 *   cached connections the 2s minimum still plays for cinematic effect.
 *
 * Why import initLenis here instead of main.js?
 *   Lenis must not start until after the loader — if Lenis initialised before
 *   the loader finished, ScrollTrigger would set up proxies against a page
 *   whose hero image might not be loaded, and the user could scroll during
 *   the intro. Calling initLenis() here in onComplete guarantees correct order.
 */

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { initLenis } from './lenis.js';

gsap.registerPlugin(ScrollTrigger);

export function initHero() {
  // ── 1. Pre-loader DOM state ────────────────────────────────────────────

  // Clip hero headline lines immediately — fromTo at t=0.2 in _onLoaderComplete
  // doesn't apply the from-state until the playhead reaches that offset, so
  // without this set() the text is briefly visible during the loader.
  gsap.set(document.querySelectorAll('.hero-headline .line > span'), { y: '110%' });

  // Hide chrome until loader completes — prevents nav flashing in before the
  // intro sequence has run. Faded back in inside loader onComplete.
  const chrome = document.querySelector('#chrome');
  if (chrome) chrome.style.opacity = '0';

  // Hide cursor during load — .loader-active CSS rule sets opacity 0
  document.body.classList.add('loader-active');

  // ── 2. Element references ──────────────────────────────────────────────

  const loader        = document.getElementById('loader');
  const counterEl     = document.querySelector('.loader-counter');
  const progressFill  = document.querySelector('.loader-progress-fill');

  const heroBg        = document.querySelector('.hero-bg');
  const heroMeta      = document.querySelector('.hero-meta');
  const heroSub       = document.getElementById('hero-sub');

  // Guard: if critical loader elements are missing, skip gracefully
  if (!loader || !counterEl || !progressFill) {
    console.warn('[KNOCH-005] Loader elements missing — skipping loader animation');
    _onLoaderComplete();
    return;
  }

  // ── Hero BG cursor parallax (fine-pointer / desktop only) ─────────────
  // x/y pixels compose with the scroll-exit yPercent without conflict —
  // GSAP tracks each transform component independently.
  if (heroBg && !window.matchMedia('(pointer: coarse)').matches) {
    const heroEl = document.getElementById('hero');
    if (heroEl) {
      heroEl.addEventListener('mousemove', (e) => {
        const rect = heroEl.getBoundingClientRect();
        const xRel = (e.clientX - rect.left) / rect.width  - 0.5;
        const yRel = (e.clientY - rect.top)  / rect.height - 0.5;
        gsap.to(heroBg, {
          x: xRel * 20,
          y: yRel * 12,
          duration: 1.8,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }, { passive: true });

      heroEl.addEventListener('mouseleave', () => {
        gsap.to(heroBg, { x: 0, y: 0, duration: 2.2, ease: 'power2.out', overwrite: 'auto' });
      }, { passive: true });
    }
  }

  // ── 3. Run loader on window.load ───────────────────────────────────────

  window.addEventListener('load', () => {
    // Proxy object for the counter tween — GSAP can only tween numeric
    // properties, so we wrap the display value in an object and update
    // the DOM in onUpdate. Math.ceil ensures we always show whole numbers
    // and that 00 is only shown at the very start (val = 0 → ceil(0) = 0).
    const proxy = { val: 0 };

    // Film-frame counter: 00 → 36 over 1.8s, power2.inOut
    gsap.to(proxy, {
      val: 36,
      duration: 1.8,
      ease: 'power2.inOut',
      onUpdate() {
        // padStart(2,'0') keeps the two-digit display at all times
        counterEl.textContent = String(Math.ceil(proxy.val)).padStart(2, '0');
      },
      onComplete() {
        // Ensure counter lands exactly on '36'
        counterEl.textContent = '36';
      },
    });

    // Progress bar fill: width 0% → 100% in 1.8s, power2.inOut
    // Timed to match the counter exactly so both finish together.
    gsap.to(progressFill, {
      width: '100%',
      duration: 1.8,
      ease: 'power2.inOut',
    });

    // ── 4. Fade out loader after 2s total ─────────────────────────────
    // 2s = 1.8s tween + 0.2s pause to let the counter land on 36.
    // autoAlpha handles visibility + opacity atomically — this prevents
    // the invisible loader from capturing pointer events after fade.
    gsap.to(loader, {
      autoAlpha: 0,
      duration: 1,
      delay: 2,
      ease: 'power2.inOut',
      onComplete() {
        // Remove from layout entirely
        loader.style.display = 'none';

        // Start Lenis smooth scroll (must happen before ScrollTrigger
        // animations so the proxy is live when they register)
        initLenis();

        // Show cursor
        document.body.classList.remove('loader-active');

        // Fade chrome back in
        gsap.to('#chrome', {
          opacity: 1,
          duration: 0.8,
          delay: 0.2,
        });

        // Run hero reveal and scroll-exit setup
        _onLoaderComplete();
      },
    });
  });
}

// ── 5. Hero reveal sequence ────────────────────────────────────────────────

/**
 * Builds and plays the reveal GSAP timeline immediately after the loader fades.
 * Timeline positions (all relative to t=0):
 *   t=0.0 — hero-bg scale 1.1→1 (2.4s, power3.out)
 *   t=0.0 — hero-meta fade in (0.8s)
 *   t=0.2 — headline line spans translateY(110%→0), stagger 0.12s
 *   t=1.4 — #hero-sub fade in
 */
function _onLoaderComplete() {
  const heroBg       = document.querySelector('.hero-bg');
  const heroMeta     = document.querySelector('.hero-meta');
  const heroSub      = document.getElementById('hero-sub');

  /* Use > span (direct child) so .char-hover spans added by char-hover.js
     inside the wrapper span are not matched — they have no initial offset
     and should not participate in the line reveal. */
  const lineSpans = document.querySelectorAll('.hero-headline .line > span');

  const tl = gsap.timeline();

  // Bg scale-down
  if (heroBg) {
    tl.to(heroBg, {
      scale: 1,
      duration: 2.4,
      ease: 'power3.out',
    }, 0);
  }

  // Meta label fade in
  if (heroMeta) {
    tl.to(heroMeta, {
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out',
    }, 0);
  }

  // Headline clip-reveal — initial y:'110%' is pre-set by gsap.set() in initHero()
  // so we only need a to() here. fromTo at a non-zero timeline offset doesn't
  // apply the from-state until the playhead reaches it, causing a brief flash.
  if (lineSpans.length) {
    tl.to(lineSpans,
      { y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12 },
      0.2
    );
  }

  // ── Film-grain dissolve on per-character spans (KNOCH-030) ──────────────
  // char-hover.js has already split the headline into .char-hover spans.
  // We animate the shared SVG filter (feTurbulence displacement) from high
  // distortion to zero while staggering each char's opacity from 0 → 1.
  // This creates the effect of characters being "developed" through grain.
  const grainChars  = document.querySelectorAll('.hero-headline .char-hover');
  const turbulence  = document.getElementById('grain-turbulence');
  const displace    = document.getElementById('grain-displace');

  if (grainChars.length && turbulence && displace) {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      // Instant reveal — skip grain animation
      grainChars.forEach(ch => {
        ch.style.opacity = '1';
        ch.classList.add('grain-revealed');
      });
    } else {
      // Set initial displacement intensity high
      displace.setAttribute('scale', '55');
      turbulence.setAttribute('baseFrequency', '0.065');

      // Animate SVG filter dissolution — shared across all chars
      tl.to({}, {
        duration: 1.8,
        ease: 'power2.out',
        onUpdate: function () {
          const p = this.progress();
          const scale = 55 * (1 - p);
          const freq  = 0.065 * (1 - p * 0.8);
          displace.setAttribute('scale', scale.toFixed(1));
          turbulence.setAttribute('baseFrequency', freq.toFixed(4));
        },
        onComplete: () => {
          displace.setAttribute('scale', '0');
        },
      }, 0.3);

      // Stagger char opacity — each char fades in as grain dissolves
      tl.to(grainChars, {
        opacity: 1,
        duration: 0.9,
        ease: 'power2.out',
        stagger: { from: 'start', amount: 0.8 },
        onComplete: () => {
          // Hand filter control back to char-hover.js
          grainChars.forEach(ch => {
            ch.classList.add('grain-revealed');
            ch.style.filter = '';
          });
        },
      }, 0.3);
    }
  }

  // Sub text fade in
  if (heroSub) {
    tl.to(heroSub, {
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out',
    }, 1.4);
  }

  // Set up scroll-exit triggers once the reveal completes
  tl.call(_setupScrollExit);
}

// ── 6. Hero exit on scroll (ScrollTrigger) ─────────────────────────────────

/**
 * Parallax exit for hero on scroll.
 * Two simultaneous ScrollTrigger animations share the same trigger range:
 *   • .hero-bg:      yPercent 0 → 25 (parallax — bg moves slower than page)
 *   • .hero-content: yPercent 0 → -40 + opacity 1 → 0 (content lifts + fades)
 *
 * scrub: true = animation position is directly tied to scroll offset,
 * giving the user 1:1 control over the parallax speed.
 *
 * Called as a .call() inside the reveal timeline so it only registers
 * after the reveal completes — prevents ScrollTrigger firing before
 * the hero is fully revealed.
 */
function _setupScrollExit() {
  const heroBg      = document.querySelector('.hero-bg');
  const heroContent = document.querySelector('.hero-content');

  const triggerConfig = {
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  };

  // Background parallax — moves upward at 25% of scroll speed
  if (heroBg) {
    gsap.to(heroBg, {
      yPercent: 25,
      ease: 'none', // linear scrub — easing should come from scroll inertia
      scrollTrigger: triggerConfig,
    });
  }

  // Content exit — lifts and fades simultaneously
  if (heroContent) {
    gsap.to(heroContent, {
      yPercent: -40,
      opacity: 0,
      ease: 'none',
      scrollTrigger: triggerConfig,
    });
  }
}
