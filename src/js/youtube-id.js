/*
  youtube-id.js — Tiny URL → video-ID parser (KNOCH-017)
  =========================================================
  YouTube URLs come in multiple shapes across the codebase:
    - https://youtu.be/VIDEOID?si=…
    - https://youtu.be/VIDEOID?t=75
    - https://www.youtube.com/watch?v=VIDEOID&t=75s
    - https://www.youtube.com/watch?v=VIDEOID
    - https://www.youtube.com/embed/VIDEOID
    - VIDEOID (already extracted — passed straight through)

  Sanity galleryCollection documents store the raw watch URL, the
  reel reads from Sanity (KNOCH-025), and the video lightbox needs
  just the 11-char ID. Keeping the parser separate from reel.js
  means the same logic can be reused by any future entry-point that
  takes a YouTube URL from CMS data — no need to duplicate the
  regex.

  Returns the 11-character video ID, or null if the input doesn't
  look like a YouTube reference. Callers should treat null as
  "fall back to opening the URL in a new tab" so the visitor still
  gets to the video on a parser miss.
*/

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeId(input) {
  if (!input || typeof input !== 'string') return null;

  /* Already a bare 11-char ID — return as-is. Lets callers pass
     either a full URL or a stored-id field without branching. */
  if (ID_RE.test(input)) return input;

  let url;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '');

  /* youtu.be/<ID>[/...] — the share-link form. The ID is the first
     non-empty path segment so deep paths like /VIDEOID/embed don't
     trip us up. */
  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id && ID_RE.test(id) ? id : null;
  }

  /* youtube.com/watch?v=<ID> — the canonical desktop URL. */
  if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (url.pathname === '/watch') {
      const id = url.searchParams.get('v');
      return id && ID_RE.test(id) ? id : null;
    }
    /* /embed/<ID> and /v/<ID> — already-embedded variants that we
       still want to handle so a Sanity entry pasted from an embed
       code resolves cleanly. */
    const m = url.pathname.match(/^\/(?:embed|v|shorts)\/([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
  }

  return null;
}
