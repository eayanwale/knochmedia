/**
 * KNOCH-006 — Interlude / Manifesto Section
 *
 * Splits the blockquote into individual word spans and animates them
 * from opacity 0.15 → 1 as the user scrolls through the section.
 *
 * Strategy:
 *  - Desktop: GSAP ScrollTrigger scrub:0.5, per-word stagger 0.04
 *  - Mobile (≤800px): single IntersectionObserver fade-in via CSS class
 *  - prefers-reduced-motion: all words jump to full opacity immediately
 *
 * The word-splitter iterates childNodes rather than innerHTML string
 * manipulation so that <em> elements are preserved intact — their italic
 * amber styling comes from CSS, not inline styles, keeping semantics clean.
 */

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initInterlude() {
  const section = document.querySelector('.interlude')
  if (!section) return

  const quote = section.querySelector('.interlude-quote')
  if (!quote) return

  // ── Word split ────────────────────────────────────────────────────────
  // Iterate childNodes (text nodes + element nodes) rather than innerHTML
  // so that <em> elements survive as proper DOM nodes.
  // Text nodes are split by whitespace; each non-empty word becomes a
  // <span class="word">. Whitespace runs are re-inserted as bare text
  // nodes to preserve natural word-wrap. <em> elements are wrapped in a
  // <span class="word"> that contains the whole <em>, so the italic +
  // amber styling still applies and screen readers read it normally.
  const nodes = Array.from(quote.childNodes)
  quote.innerHTML = ''

  nodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      // Split on whitespace but keep the whitespace parts so we can
      // re-insert them as text nodes to preserve line-wrap spacing.
      node.textContent.split(/(\s+)/).forEach(part => {
        if (part.trim()) {
          // Non-whitespace word
          const span = document.createElement('span')
          span.className = 'word'
          span.textContent = part
          quote.appendChild(span)
        } else if (part) {
          // Whitespace run — keep as a text node so the browser wraps naturally
          quote.appendChild(document.createTextNode(part))
        }
      })
    } else if (node.nodeName === 'EM') {
      // Emphasis element — wrap the whole <em> in a single .word span
      // so the em's italic+amber CSS still applies inside the span.
      const span = document.createElement('span')
      span.className = 'word'
      span.appendChild(node.cloneNode(true))
      quote.appendChild(span)
    } else {
      // Any other node type (e.g. nested inline elements) — preserve as-is
      quote.appendChild(node.cloneNode(true))
    }
  })

  const words = quote.querySelectorAll('.word')

  // ── Accessibility: mark the inner <p> as a paragraph for AT ──────────
  // The DOM manipulation above preserves text content; screen readers
  // will still traverse the span tree and read the full sentence because
  // <span> is an inline element with no implicit ARIA role.

  // ── Motion preference check ───────────────────────────────────────────
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReduced) {
    // Jump all words to full opacity; also reveal label
    words.forEach(w => (w.style.opacity = '1'))
    section.classList.add('is-visible')
    return
  }

  // ── Mobile fallback (≤800px) ──────────────────────────────────────────
  const isMobile = window.matchMedia('(max-width: 800px)').matches

  if (isMobile) {
    // Single IntersectionObserver: when the quote block enters the viewport
    // at 30% threshold, add .is-visible which triggers the CSS transition
    // (opacity 0 → 1 in 0.8s). Disconnect after first fire.
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            quote.classList.add('is-visible')
            section.classList.add('is-visible') // reveals label too
            io.disconnect()
          }
        })
      },
      { threshold: 0.3 }
    )
    io.observe(quote)
    return
  }

  // ── Desktop: GSAP ScrollTrigger per-word scrub ────────────────────────
  // scrub:0.5 gives a 0.5s lag between scroll position and animation
  // progress — feels more organic than the instant scrub:true.
  // stagger:0.04 means words animate sequentially rather than all at once,
  // creating the "reading along with the scroll" effect.
  gsap.fromTo(
    words,
    { opacity: 0.15 },
    {
      opacity: 1,
      stagger: 0.04,
      scrollTrigger: {
        trigger: '.interlude',
        start: 'top 70%',
        end: 'center 40%',
        scrub: 0.5,
        onEnter: () => section.classList.add('is-visible'), // reveal label
      },
    }
  )
}
