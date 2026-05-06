import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
// stopLenis/startLenis intentionally not used — the ScrollTrigger proxy
// in lenis.js keeps Lenis synced with ScrollTrigger during the pin.
// Stopping Lenis breaks the scroll chain that drives the horizontal tween.

gsap.registerPlugin(ScrollTrigger);

// Static fallback — mirrors the 3 featured Sanity galleryCollection documents.
// Images point directly to Sanity CDN so fallback and live mode are pixel-identical.
// Only used when the Sanity API fetch returns empty (network failure, etc.).
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

function handleCardClick(card) {
  if (card.linkType === 'external-gallery' || card.linkType === 'youtube') {
    window.open(card.url, '_blank', 'noopener,noreferrer');
  } else {
    window.location.href = card.url;
  }
}

export function initReel(cards = CARDS) {
  const section = document.querySelector('#reel');
  const track = section?.querySelector('.reel-track');

  if (!section || !track) return;

  // Render cards into track
  const fragment = document.createDocumentFragment();
  cards.forEach(card => fragment.appendChild(buildCard(card)));

  // Trailing spacer
  const spacer = document.createElement('div');
  spacer.className = 'reel-spacer';
  spacer.setAttribute('aria-hidden', 'true');
  fragment.appendChild(spacer);

  track.appendChild(fragment);

  // Skip GSAP pin on mobile — CSS snap handles it
  if (window.matchMedia('(max-width: 800px)').matches) return;

  // Skip scroll-driven animation for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Main horizontal tween — ScrollTrigger config inline so
  // reelTween.scrollTrigger is available for containerAnimation below
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

  // Inner parallax — card image pans counter to horizontal scroll.
  // containerAnimation takes the parent TWEEN (not the ST instance) so
  // ScrollTrigger can derive card positions relative to horizontal scroll.
  track.querySelectorAll('.reel-card').forEach(card => {
    const img = card.querySelector('.reel-card-img');
    if (!img) return;

    gsap.fromTo(
      img,
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
  });

  // Debounced resize — recalculates track width after layout shifts
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
  });
}
