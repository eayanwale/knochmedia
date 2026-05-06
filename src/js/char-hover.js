/*
  char-hover.js — Proximity-based hollow-text reveal
  ==================================================
  Each .char-hover span's effect intensity is proportional to how close the
  cursor is — 0 at RADIUS px away, 1 at dead center. Multiple characters can
  be simultaneously active at different intensities when the cursor sits
  between them.

  At intensity t:
    color        → rgba(paper, 1 - t)        — fills fade to transparent
    stroke       → 0.5px rgba(paper, t*0.75) — soft, semi-opaque outline
    transform    → scale(1 + 0.18 * t)       — gentle pop
    filter       → blur(0.5 * t px)          — dreamy softening of the outline
    text-shadow  → upward smoke wisps        — three stacked blurred copies
                   that drift up and dissipate as intensity rises (KNOCH-034)

  GSAP tweens a per-char proxy object (not the DOM directly) so intensity
  eases in/out at its own rate regardless of how fast the cursor moves.
*/

import { gsap } from 'gsap';

const RADIUS = 90;                  // px — influence radius from char center
const PAPER  = [237, 230, 216];     // --paper  #ede6d8
const AMBER  = [196, 168, 124];     // --amber  #c4a87c

function applyIntensity(span, t, isEm) {
  if (t < 0.004) {
    span.style.color = '';
    span.style.setProperty('-webkit-text-stroke', '');
    span.style.transform = '';
    span.style.filter = '';
    span.style.textShadow = '';
    return;
  }
  const [r, g, b] = isEm ? AMBER : PAPER;
  /* Color fades out as stroke fades in */
  span.style.color = `rgba(${r},${g},${b},${Math.max(0, 1 - t).toFixed(3)})`;
  /* Stroke: 0.5px so it reads as a hairline — opacity carries the weight */
  span.style.setProperty('-webkit-text-stroke', `0.5px rgba(${r},${g},${b},${(t * 0.75).toFixed(3)})`);
  /* Pop up from baseline */
  span.style.transform = `scale(${(1 + 0.18 * t).toFixed(4)})`;
  /* Blur softens the hard stroke edge */
  span.style.filter = `blur(${(0.5 * t).toFixed(3)}px)`;
  /* Smoke wisps — three stacked text-shadow copies that climb upward with
     increasing offset, blur, and decreasing opacity so they read as
     dissipating vapor. Each layer's offsets and opacity scale with t so the
     wisps grow with cursor proximity rather than appearing as a fixed glow.
     Slightly desaturated toward warm grey (×0.92) to read as smoke against
     the paper/amber chars rather than a colour-matched glow. */
  const sr = Math.round(r * 0.92);
  const sg = Math.round(g * 0.92);
  const sb = Math.round(b * 0.92);
  span.style.textShadow =
    `0 ${(-2 * t).toFixed(2)}px ${(5 * t).toFixed(2)}px rgba(${sr},${sg},${sb},${(0.32 * t).toFixed(3)}),` +
    `0 ${(-5 * t).toFixed(2)}px ${(11 * t).toFixed(2)}px rgba(${sr},${sg},${sb},${(0.18 * t).toFixed(3)}),` +
    `0 ${(-9 * t).toFixed(2)}px ${(18 * t).toFixed(2)}px rgba(${sr},${sg},${sb},${(0.09 * t).toFixed(3)})`;
}

function splitAndBind(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent.trim()) textNodes.push(node);
  }

  textNodes.forEach(textNode => {
    const parent = textNode.parentNode;
    const frag   = document.createDocumentFragment();
    const text   = textNode.textContent;
    let i = 0;

    while (i < text.length) {
      if (/\s/.test(text[i])) {
        // Space between words — inline-block span so it can't collapse
        const sp = document.createElement('span');
        sp.className = 'char-space';
        sp.innerHTML = '&nbsp;';
        frag.appendChild(sp);
        i++;
      } else {
        // Word — group consecutive non-space chars in a wrapper that
        // prevents line-breaks within the word (inline-block + nowrap)
        const word = document.createElement('span');
        word.className = 'char-word';
        while (i < text.length && !/\s/.test(text[i])) {
          const span = document.createElement('span');
          span.className = 'char-hover';
          span.textContent = text[i];
          word.appendChild(span);
          i++;
        }
        frag.appendChild(word);
      }
    }

    parent.replaceChild(frag, textNode);
  });

  const chars   = Array.from(root.querySelectorAll('.char-hover'));
  if (!chars.length) return;

  const isEmArr = chars.map(s => !!s.closest('em'));
  const proxies = chars.map(() => ({ t: 0 }));

  root.addEventListener('mousemove', (e) => {
    const cx = e.clientX;
    const cy = e.clientY;
    chars.forEach((span, i) => {
      const rect   = span.getBoundingClientRect();
      const dist   = Math.hypot(
        cx - (rect.left + rect.width  * 0.5),
        cy - (rect.top  + rect.height * 0.5)
      );
      const target = Math.max(0, 1 - dist / RADIUS);
      gsap.to(proxies[i], {
        t: target,
        duration: 0.28,
        ease: 'power2.out',
        overwrite: 'auto',
        onUpdate: () => applyIntensity(span, proxies[i].t, isEmArr[i]),
      });
    });
  }, { passive: true });

  root.addEventListener('mouseleave', () => {
    chars.forEach((span, i) => {
      gsap.to(proxies[i], {
        t: 0,
        duration: 0.6,
        ease: 'power2.out',
        overwrite: 'auto',
        onUpdate: () => applyIntensity(span, proxies[i].t, isEmArr[i]),
      });
    });
  }, { passive: true });
}

export function initCharHover() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.headline-hover').forEach(splitAndBind);
}

/** Bind char-hover to a single element (for dynamically-created headlines) */
export function bindCharHover(el) {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (el) splitAndBind(el);
}
