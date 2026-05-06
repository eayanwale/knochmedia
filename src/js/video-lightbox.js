/*
  video-lightbox.js — Full-screen YouTube modal (KNOCH-012)
  ===========================================================
  One global instance per page. Inserts its own DOM into <body> on
  init so callers don't need to add markup. Other modules trigger it
  via openVideoLightbox(youtubeId, returnFocus).

  Behaviour:
    - openVideoLightbox(id) creates an <iframe> with the YouTube
      embed URL (autoplay=1, rel=0, modestbranding=1) and shows the
      overlay. The iframe is built fresh each open so the player
      starts from frame 0.
    - Escape key, click on backdrop, or click on the Close button
      all close the lightbox and remove the iframe (which stops
      audio playback — YouTube's iframe API isn't loaded here).
    - Focus trap: on open, the close button receives focus; Tab and
      Shift+Tab cycle within the modal's focusable elements. On
      close, focus returns to the element that triggered it.
    - The lightbox is hidden via CSS transitions (.is-open class) so
      the entry / exit reads as a soft fade rather than a snap.

  Note: this is a deliberately small focus trap — close button + iframe
  are the only focusables. A more robust implementation would query
  every focusable inside the modal; the simple version is enough for
  this content shape.
*/

let _lightbox = null;       /* DOM root */
let _embed    = null;       /* iframe wrapper */
let _closeBtn = null;       /* close button */
let _trigger  = null;       /* element that opened the modal — focus return target */

function _build() {
  const root = document.createElement('div');
  root.className = 'video-lightbox';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Video player');
  root.setAttribute('aria-hidden', 'true');

  const closeBtn = document.createElement('button');
  closeBtn.className = 'video-lightbox-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close video');
  closeBtn.textContent = '✕  Close';

  const embed = document.createElement('div');
  embed.className = 'video-lightbox-embed';

  root.append(closeBtn, embed);
  document.body.appendChild(root);

  _lightbox = root;
  _embed    = embed;
  _closeBtn = closeBtn;

  /* Click on backdrop closes — click on the embed itself does not bubble
     to the root because the iframe captures clicks. */
  root.addEventListener('click', (e) => {
    if (e.target === root) closeVideoLightbox();
  });

  closeBtn.addEventListener('click', closeVideoLightbox);

  /* Escape key + Tab focus trap — single document listener attached
     once per page, gated on .is-open so the rest of the time it does
     nothing. */
  document.addEventListener('keydown', _onKeydown);
}

function _onKeydown(e) {
  if (!_lightbox || !_lightbox.classList.contains('is-open')) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    closeVideoLightbox();
    return;
  }

  /* Focus trap — only two focusable elements: close button and the
     iframe. Tabbing past the iframe wraps back to close; Shift+Tab
     past close wraps to iframe. */
  if (e.key === 'Tab') {
    const iframe = _embed.querySelector('iframe');
    const focusables = [_closeBtn, iframe].filter(Boolean);
    if (focusables.length < 2) return;

    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

export function initVideoLightbox() {
  if (_lightbox) return; /* idempotent — safe to call from multiple entries */
  _build();
}

export function openVideoLightbox(youtubeId, triggerEl) {
  if (!youtubeId) return;
  if (!_lightbox) _build();

  _trigger = triggerEl ?? document.activeElement;

  /* Build a fresh iframe each open so the player starts from 0 and
     the previous video's audio is fully torn down on close. */
  _embed.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.src =
    `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  iframe.setAttribute('title', 'Video player');
  iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
  iframe.setAttribute('allowfullscreen', '');
  _embed.appendChild(iframe);

  _lightbox.classList.add('is-open');
  _lightbox.setAttribute('aria-hidden', 'false');

  /* Lock body scroll while the modal is open so background content
     doesn't drift behind the embed during a wheel gesture. */
  document.body.style.overflow = 'hidden';

  /* Focus the close button after the open transition starts so screen
     readers announce the dialog and keyboard users can immediately
     dismiss with Enter / Space. */
  requestAnimationFrame(() => _closeBtn.focus());
}

export function closeVideoLightbox() {
  if (!_lightbox || !_lightbox.classList.contains('is-open')) return;
  _lightbox.classList.remove('is-open');
  _lightbox.setAttribute('aria-hidden', 'true');

  /* Tear down the iframe after the fade-out completes so the YouTube
     audio stops cleanly. The CSS transition is 0.4s — match it. */
  setTimeout(() => {
    if (!_lightbox.classList.contains('is-open')) {
      _embed.innerHTML = '';
    }
  }, 420);

  document.body.style.overflow = '';

  /* Restore focus to the element that triggered the modal. */
  if (_trigger && typeof _trigger.focus === 'function') {
    _trigger.focus();
  }
  _trigger = null;
}
