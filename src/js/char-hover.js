/*
  char-hover.js — Per-character hollow-text reveal
  ================================================
  Walks every .headline-hover element, finds all leaf text nodes, and
  replaces each non-whitespace character with a <span class="char-hover">.
  Spaces stay as plain text nodes so word-spacing and layout are unaffected.

  Each .char-hover span transitions independently on mouseenter/mouseleave.
  CSS handles the ease in/out; no GSAP needed for the effect itself.

  Works with nested <em> — em .char-hover.is-hollow gets amber stroke via CSS.
  Works with GSAP animation wrappers (.line, .frame-line, .interlude-line) —
  those tweens target the wrapper element, not its text children.
*/

function splitAndBind(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent.trim()) textNodes.push(node);
  }

  textNodes.forEach(textNode => {
    const parent = textNode.parentNode;
    const frag = document.createDocumentFragment();

    [...textNode.textContent].forEach(char => {
      if (/\s/.test(char)) {
        frag.appendChild(document.createTextNode(char));
      } else {
        const span = document.createElement('span');
        span.className = 'char-hover';
        span.textContent = char;
        frag.appendChild(span);
      }
    });

    parent.replaceChild(frag, textNode);
  });

  root.querySelectorAll('.char-hover').forEach(span => {
    span.addEventListener('mouseenter', () => span.classList.add('is-hollow'), { passive: true });
    span.addEventListener('mouseleave', () => span.classList.remove('is-hollow'), { passive: true });
  });
}

export function initCharHover() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('.headline-hover').forEach(splitAndBind);
}
