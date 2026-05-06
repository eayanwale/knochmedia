import gsap from 'gsap';

export function initCursor() {
  // Skip on touch / coarse-pointer devices — cursor element is hidden via CSS
  // but we also skip JS to avoid attaching listeners that do nothing useful.
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  // GSAP quickTo gives smooth lag-behind tracking.
  // duration 0.35 / power3 provides the "magnetic" feel from the reference.
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });

  window.addEventListener('mousemove', (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
  }, { passive: true });

  // Grow state: all interactive targets that the cursor should react to.
  const GROW_SELECTOR = 'a, button, .reel-card, .tile, .cta .button';
  // Large editorial ring on headline hover — text goes hollow, cursor opens wide
  const TEXT_SELECTOR = '.headline-hover';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(TEXT_SELECTOR)) {
      cursor.classList.remove('grow');
      cursor.classList.add('grow--text');
    } else if (e.target.closest(GROW_SELECTOR)) {
      cursor.classList.remove('grow--text');
      cursor.classList.add('grow');
    }
  }, { passive: true });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(TEXT_SELECTOR)) {
      cursor.classList.remove('grow--text');
    } else if (e.target.closest(GROW_SELECTOR)) {
      cursor.classList.remove('grow');
    }
  }, { passive: true });

  // Hide cursor when pointer leaves the viewport entirely
  document.addEventListener('mouseleave', () => {
    gsap.to(cursor, { opacity: 0, duration: 0.2 });
  }, { passive: true });

  document.addEventListener('mouseenter', () => {
    gsap.to(cursor, { opacity: 1, duration: 0.2 });
  }, { passive: true });
}
