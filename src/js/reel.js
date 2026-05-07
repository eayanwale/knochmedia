import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { openVideoLightbox } from './video-lightbox.js';
import { parseYouTubeId } from './youtube-id.js';

gsap.registerPlugin(ScrollTrigger);

const CARDS = [
  {
    index: '01',
    scene: 'Wedding',
    title: 'Fayo &amp; Femi\'s Introduction',
    subtitle: 'Wedding',
    img: 'https://cdn.sanity.io/images/2779g58e/production/03d0018d5f27d7cbaf49c38c47349a5c48f92a04-1600x1067.jpg?w=1200&auto=format',
    url: 'https://knoch.pic-time.com/-fayofemi/gallery',
    linkType: 'external-gallery',
  },
  {
    index: '02',
    scene: 'Wedding',
    title: 'Alex &amp; Morgan\'s Wedding',
    subtitle: 'Wedding',
    img: 'https://cdn.sanity.io/images/2779g58e/production/958e9c61cceb999dc0f6b478138d268384c3cb54-7008x4672.jpg?w=1200&auto=format',
    url: 'https://knoch.pic-time.com/-alexmorgan/gallery',
    linkType: 'external-gallery',
  },
  {
    index: '03',
    scene: 'Wedding',
    title: 'Shawn &amp; Bekki\'s Wedding',
    subtitle: 'Wedding',
    img: 'https://cdn.sanity.io/images/2779g58e/production/471e43f5f31b05082fd6d39fb928704a6b47417a-1600x1067.jpg?w=1200&auto=format',
    url: 'https://knoch.pic-time.com/-shawnbekki/gallery',
    linkType: 'external-gallery',
  },
];

function buildCard(card) {
  const el = document.createElement('article');
  el.className = 'reel-card';
  el.setAttribute('tabindex', '0');
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `${card.title.replace(/&amp;/g, '&')} — ${card.scene}`);

  const bgPos = card.bgPosition ?? 'center';
  el.innerHTML = `
    <div class="reel-card-img" style="background-image: url('${card.img}'); background-position: ${bgPos}"></div>
    <div class="reel-card-notches" aria-hidden="true">
      <span class="notch notch--tl"></span>
      <span class="notch notch--tr"></span>
      <span class="notch notch--bl"></span>
      <span class="notch notch--br"></span>
    </div>
    <span class="reel-frame-label" aria-hidden="true">FRAME ${card.index}</span>
    <div class="reel-card-overlay"></div>
    <div class="reel-card-meta">
      <span class="reel-card-scene">Scene ${card.index} · ${card.scene}</span>
      <h3 class="reel-card-title">${card.title}</h3>
      <p class="reel-card-subtitle">${card.subtitle}</p>
    </div>
  `;

  el.addEventListener('click', () => handleCardClick(card));
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(card);
    }
  });

  return el;
}

/* Reel card activation router (KNOCH-007 + KNOCH-017).
   - external-gallery → open the Pic-Time link in a new tab. The
     external gallery is a separate property and we don't want to
     replace the current tab; reel scroll position is also useful
     to preserve.
   - youtube → open the embedded lightbox (KNOCH-017). Extract the
     11-char video ID from the URL (any youtu.be / watch?v= shape).
     If extraction fails, fall back to the new-tab open so the
     visitor still reaches the video instead of getting a dead
     click.
   - internal-page (or any other linkType) → same-tab navigation. */
function handleCardClick(card) {
  if (card.linkType === 'youtube') {
    const id = parseYouTubeId(card.url);
    if (id) {
      openVideoLightbox(id);
      return;
    }
    /* Fall through to new-tab open if the URL didn't match a known
       YouTube shape — better a working external link than nothing. */
    window.open(card.url, '_blank', 'noopener,noreferrer');
    return;
  }

  if (card.linkType === 'external-gallery') {
    window.open(card.url, '_blank', 'noopener,noreferrer');
    return;
  }

  window.location.href = card.url;
}

/* Magnetic cursor zoom on reel cards — image pans toward cursor within
   the oversized card-img bounds. GSAP x/y composes with the horizontal
   parallax x tween because they target different transform components. */
function addMagneticZoom(card) {
  const img = card.querySelector('.reel-card-img');
  if (!img) return;

  card.addEventListener('mouseenter', () => {
    gsap.to(img, { scale: 1.012, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
  });

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const xRel = (e.clientX - rect.left) / rect.width - 0.5;
    const yRel = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(img, {
      xPercent: xRel * 1.5,
      yPercent: yRel * 1.5,
      duration: 0.6,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  });

  card.addEventListener('mouseleave', () => {
    gsap.to(img, {
      scale: 1, xPercent: 0, yPercent: 0,
      duration: 0.8, ease: 'power2.out', overwrite: 'auto',
    });
  });
}

/* Per-character split: walk every text node inside `el`, replace each
   non-whitespace character with an inline-block <span class="char">.
   Whitespace stays as plain text so word-break behaves naturally and
   wrapping markup (e.g. <em>) is preserved. Returns the new char spans. */
function splitChars(el) {
  if (!el) return [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) textNodes.push(node);

  textNodes.forEach(textNode => {
    const text = textNode.textContent;
    const frag = document.createDocumentFragment();
    for (const ch of text) {
      if (ch === ' ' || ch === ' ') {
        frag.appendChild(document.createTextNode(ch));
      } else {
        const span = document.createElement('span');
        span.className = 'reel-intro-char';
        span.style.display = 'inline-block';
        span.style.willChange = 'transform';
        span.textContent = ch;
        frag.appendChild(span);
      }
    }
    textNode.replaceWith(frag);
  });

  return el.querySelectorAll('.reel-intro-char');
}

/* Reel intro text reveals — label rises, headline letters cascade up
   from below their clip with a stagger, desc lines clip-wipe, hint
   fades last. The per-character split makes "Selected work." land
   noticeably even on a quick scroll-by, where the previous full-clip
   reveal felt like a single instant flash.
   KNOCH-020: skipped on mobile. The scroll-tied write-on cascade was
   too much on touch devices (Enoch flagged it after the first mobile
   PR landed); without the dramatic intro the reel-intro panel just
   reads as a normal headline + desc, which is the right register for
   a vertical-stack mobile flow. */
function animateReelIntro(section) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile       = window.matchMedia('(max-width: 800px)').matches;
  if (prefersReduced || isMobile) return;

  const label    = section.querySelector('.reel-intro-label');
  const headline = section.querySelector('.reel-intro-headline');
  const desc     = section.querySelector('.reel-intro-desc');
  const hint     = section.querySelector('.reel-scroll-hint');

  /* Split desc around <br> into two clip-reveal lines */
  if (desc) {
    const raw = desc.innerHTML.split(/<br\s*\/?>/i);
    desc.innerHTML = raw.map(l =>
      `<span class="reel-desc-line" style="display:block;overflow:hidden;"><span style="display:block;">${l.trim()}</span></span>`
    ).join('');
  }
  const descInners = desc ? desc.querySelectorAll('span > span') : [];

  /* Wrap headline so per-char yPercent slides up from below a clip edge.
     Inline-block + overflow:hidden on the wrapper, each char tweens
     yPercent: 110 → 0. <em> stays intact so "work." keeps its amber italic. */
  if (headline) headline.style.overflow = 'hidden';
  const headlineChars = splitChars(headline);

  gsap.set([label, hint], { opacity: 0, y: 24 });
  gsap.set(headlineChars, { yPercent: 115, opacity: 0 });
  gsap.set(descInners, { y: '110%' });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 80%',
      toggleActions: 'restart none none reverse',
    },
    defaults: { ease: 'expo.out' },
  });

  tl.to(label, { opacity: 1, y: 0, duration: 0.8 }, 0)
    /* Stagger 0.035s × ~13 chars ≈ 0.45s wave; total headline duration ~1.4s
       gives the eye time to track the cascade rather than blur into a single
       motion blur. */
    .to(headlineChars, { yPercent: 0, opacity: 1, stagger: 0.035, duration: 1.0 }, 0.18)
    .to(descInners, { y: '0%', stagger: 0.12, duration: 0.9 }, 0.6)
    .to(hint, { opacity: 1, y: 0, duration: 0.7 }, 0.95);
}

export function initReel(cards = CARDS) {
  const section = document.querySelector('#reel');
  const track = section?.querySelector('.reel-track');

  if (!section || !track) return;

  /* Intro reveals run on all devices */
  animateReelIntro(section);

  // Render cards into track
  const fragment = document.createDocumentFragment();
  cards.forEach(card => fragment.appendChild(buildCard(card)));

  const spacer = document.createElement('div');
  spacer.className = 'reel-spacer';
  spacer.setAttribute('aria-hidden', 'true');
  fragment.appendChild(spacer);

  track.appendChild(fragment);

  // Skip GSAP pin on mobile — CSS snap handles it
  if (window.matchMedia('(max-width: 800px)').matches) return;

  // Skip scroll-driven animation for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const reelTween = gsap.to(track, {
    x: () => -(track.scrollWidth - window.innerWidth),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => '+=' + (track.scrollWidth - window.innerWidth),
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  track.querySelectorAll('.reel-card').forEach(card => {
    const img = card.querySelector('.reel-card-img');
    if (!img) return;

    /* Horizontal parallax counter-scroll */
    gsap.fromTo(img,
      { x: 40 },
      {
        x: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: card,
          containerAnimation: reelTween,
          start: 'left right',
          end: 'right left',
          scrub: true,
        },
      }
    );

    /* Magnetic cursor zoom — xPercent/yPercent compose with x parallax */
    addMagneticZoom(card);
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
  });
}
