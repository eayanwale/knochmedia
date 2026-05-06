/*
  projects.js — Static project data for KNOCH-012
  =================================================
  Single source of truth for project metadata used by:
    - portfolio.html cards (data-project-id maps here)
    - homepage archive tiles in index.html (same data-project-id)
    - homepage reel cards (set by main.js when wiring Sanity collections)
    - project.html (reads ?id= URL param and looks up the entry here)

  Project shape:
    id           — kebab-case slug; stable URL param value
    type         — 'photo' | 'video'
    category     — 'wedding' | 'brand' | 'sport' | 'portrait' (matches
                   data-category on cards and #hash on portfolio.html)
    title        — display title shown on card and project page
    location     — city/state subtitle
    date         — month + year string ("October 2024")
    frames       — total exposures in the gallery (rough — not enforced)
    description  — paragraph for the project page metadata column
    cover        — full path to the hero / card cover image
    images       — gallery images for project.html (photo type only)
    youtubeId    — YouTube video ID (video type only — opens in lightbox)
    galleryUrl   — external client-gallery URL ("View full gallery →"
                   on project.html). Optional.

  Three projects are fully populated (Alex & Morgan, Fayo & Femi,
  Shawn & Bekki) per the AC. The rest are placeholders with cover +
  category + minimal metadata so the click handler still routes
  cleanly even without a rich detail page.
*/

const PROJECTS = [

  /* ── Wedding photo projects (fully populated) ──────────── */

  {
    id: 'alex-morgan',
    type: 'photo',
    category: 'wedding',
    title: 'Alex and Morgan',
    location: 'Eastern Shore, Maryland',
    date: 'June 2024',
    frames: 487,
    description:
      'A two-day celebration on the Eastern Shore of Maryland. The light cooperated, the rain held off, ' +
      'and the dance floor never quite emptied. We followed Alex and Morgan from the morning prep through ' +
      'the late-night sparkler exit — staying out of the way and letting the day breathe.',
    cover: '/assets/portfolio/cover-alex-morgan.jpg',
    images: [
      '/assets/portfolio/cover-alex-morgan.jpg',
      '/assets/about/about-01.jpg',
      '/assets/about/about-03.jpg',
      '/assets/reel/reel-03.jpg',
      '/assets/about/about-05.jpg',
      '/assets/reel/reel-05.jpg',
    ],
    galleryUrl: 'https://knoch.pic-time.com/-alexmorgan/gallery',
  },

  {
    id: 'fayo-femi',
    type: 'photo',
    category: 'wedding',
    title: 'Fayo and Femi',
    location: 'Maryland · Introduction',
    date: 'May 2024',
    frames: 312,
    description:
      'A traditional Nigerian introduction ceremony — vibrant fabrics, family on every side, music that ' +
      'kept building. The afternoon ran long and we let it. Photographing this kind of celebration is ' +
      'less about composition than about reading the room and being where the next moment lands.',
    cover: '/assets/portfolio/cover-fayo-femi.jpg',
    images: [
      '/assets/portfolio/cover-fayo-femi.jpg',
      '/assets/reel/reel-04.jpg',
      '/assets/about/about-02.jpg',
      '/assets/reel/reel-06.jpg',
      '/assets/about/about-04.jpg',
    ],
    galleryUrl: 'https://knoch.pic-time.com/-fayofemi/gallery',
  },

  {
    id: 'shawn-bekki',
    type: 'photo',
    category: 'wedding',
    title: 'Shawn and Bekki',
    location: 'Pennsylvania',
    date: 'September 2024',
    frames: 528,
    description:
      'A barn wedding in Pennsylvania, weather-built — clear morning, golden afternoon, soft rain at ' +
      'cocktail hour that drove everyone under the porch and somehow made the night better. Shawn and ' +
      'Bekki wanted images that felt like a film still and we leaned into it: shallow, slow, patient.',
    cover: '/assets/portfolio/cover-shawn-bekki.jpg',
    images: [
      '/assets/portfolio/cover-shawn-bekki.jpg',
      '/assets/about/about-02.jpg',
      '/assets/reel/reel-02.png',
      '/assets/about/about-05.jpg',
      '/assets/reel/reel-04.jpg',
      '/assets/about/about-04.jpg',
    ],
    galleryUrl: 'https://knoch.pic-time.com/-shawnbekki/gallery',
  },

  /* ── Brand / Music video projects (lightbox) ──────────── */

  {
    id: 'rapha-records',
    type: 'video',
    category: 'brand',
    title: 'Rapha Records',
    location: 'Maryland',
    date: '2024',
    frames: null,
    description:
      'Brand introduction film for Rapha Records — recording session footage, artist portraits, ' +
      'studio detail shots. Cut to feel like a long-form trailer; scoring drove the edit pace.',
    cover: '/assets/portfolio/cover-rapha-records.jpg',
    images: [],
    youtubeId: 'Hs25JK7WcZQ',
  },

  {
    id: 'what-mighty-praise',
    type: 'video',
    category: 'music',
    title: 'What Mighty Praise',
    location: 'Maryland',
    date: '2024',
    frames: null,
    description:
      'Worship music video for "What Mighty Praise" — multi-camera live capture, post-coloured to a ' +
      'warm filmic LUT, edited to honour the build of the song.',
    cover: '/assets/portfolio/cover-what-mighty-praise.png',
    images: [],
    youtubeId: 'KPerYKXlpX0',
  },

  {
    id: 'yahweh-we-you',
    type: 'video',
    category: 'music',
    title: 'Yahweh We ♥ You',
    location: 'Maryland',
    date: '2024',
    frames: null,
    description:
      'Cover-music film. Single take, slow dolly, with cuts to detail shots that score the lyric beats.',
    cover: '/assets/portfolio/cover-yahweh-we-you.png',
    images: [],
    youtubeId: 'umcEatTpzBk',
  },

  {
    id: 'bcf-gala',
    type: 'video',
    category: 'brand',
    title: 'BCF Gala Night',
    location: 'Maryland',
    date: '2024',
    frames: null,
    description: 'Charity gala night film — keynote, recognitions, candid floor footage. Documentary cut.',
    cover: '/assets/reel/reel-04.jpg',
    images: [],
    youtubeId: 'Wg1LFjr6DZE',
  },

  /* ── Brand / event documentary photo projects ─────────── */

  {
    id: 'woodsmen',
    type: 'photo',
    category: 'brand',
    title: 'Mont Alto Woodsmen',
    location: 'Pennsylvania',
    date: '2023',
    frames: 198,
    description:
      'Event documentary coverage of a multi-day lumberjack sports competition — chopping, sawing, ' +
      'log rolling. Shot for the team\'s brand documentation.',
    cover: '/assets/portfolio/cover-woodsmen.jpg',
    images: [
      '/assets/portfolio/cover-woodsmen.jpg',
      '/assets/reel/reel-04.jpg',
      '/assets/about/about-02.jpg',
    ],
  },

  {
    id: 'jojos-graduation',
    type: 'photo',
    category: 'portrait',
    title: 'Jojo’s Graduation',
    location: 'College Park, Maryland',
    date: '2024',
    frames: 84,
    description:
      'Senior portraits on University of Maryland campus — McKeldin Mall, the steps of Memorial Chapel, ' +
      'and the quiet shaded paths along the south end. Late-afternoon golden light.',
    cover: '/assets/portfolio/cover-jojos-graduation.jpg',
    images: [
      '/assets/portfolio/cover-jojos-graduation.jpg',
      '/assets/about/about-01.jpg',
      '/assets/about/about-03.jpg',
    ],
  },

];

/** O(1) lookup by id. Returns undefined if not found. */
const _byId = new Map(PROJECTS.map(p => [p.id, p]));

export function getProject(id) {
  return _byId.get(id);
}

export function listProjects() {
  return PROJECTS;
}
