import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
// stopLenis/startLenis intentionally not used — the ScrollTrigger proxy
// in lenis.js keeps Lenis synced with ScrollTrigger during the pin.
// Stopping Lenis breaks the scroll chain that drives the horizontal tween.

gsap.registerPlugin(ScrollTrigger);

// Static card data — replaced by Sanity fetch in KNOCH-025
const CARDS = [
  {
    index: '01',
    scene: 'Wedding',
    title: 'Fayo &amp; Femi',
    subtitle: 'Maryland · 2024',
    img: '/assets/portfolio/cover-fayo-femi.jpg',
    url: 'https://knoch.pic-time.com/-fayofemi/gallery',
    linkType: 'external-gallery',
  },
  {
    index: '02',
    scene: 'Wedding',
    title: 'Shawn &amp; Bekki',
    subtitle: 'Maryland · 2024',
    img: '/assets/portfolio/cover-shawn-bekki.jpg',
    url: 'https://knoch.pic-time.com/-shawnbekki/gallery',
    linkType: 'external-gallery',
  },
  {
    index: '03',
    scene: 'Wedding',
    title: 'Alex &amp; Morgan',
    subtitle: 'Maryland · 2024',
    img: '/assets/portfolio/cover-alex-morgan.jpg',
    url: 'https://knoch.pic-time.com/-alexmorgan/gallery',
    linkType: 'external-gallery',
  },
  {
    index: '04',
    scene: 'Sports &amp; Events',
    title: 'The Woodsmen',
    subtitle: 'Garrett Co. · 2024',
    img: '/assets/portfolio/cover-woodsmen.jpg',
    url: '/gallery/woodsmen/',
    linkType: 'internal-page',
  },
];

function buildCard(card) {
  const el = document.createElement('article');
  el.className = 'reel-card';
  el.setAttribute('tabindex', '0');
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `${card.title.replace(/&amp;/g, '&')} — ${card.scene}`);

  el.innerHTML = `
    <div class="reel-card-img" style="background-image: url('${card.img}')"></div>
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
  // containerAnimation must reference the ScrollTrigger instance
  // attached to the parent tween (not a standalone ST instance).
  const reelST = reelTween.scrollTrigger;

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
          containerAnimation: reelST,
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
