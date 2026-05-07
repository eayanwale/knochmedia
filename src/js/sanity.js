const PROJECT_ID = document.querySelector('meta[name="sanity-project-id"]')?.content ?? ''
const DATASET    = document.querySelector('meta[name="sanity-dataset"]')?.content ?? ''
const BASE = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${DATASET}`

async function fetchQuery(groq, params = {}) {
  if (!PROJECT_ID || !DATASET) {
    console.warn('[Sanity] project-id or dataset meta tag missing — using static fallback')
    return []
  }
  try {
    /* Append GROQ params as $name=value — Sanity's REST API accepts
       them via query string when prefixed with $. Lets callers pass
       in slug / id values without string interpolation (which would
       require GROQ-injection escaping). */
    const paramString = Object.entries(params)
      .map(([k, v]) => `&$${encodeURIComponent(k)}=${encodeURIComponent(JSON.stringify(v))}`)
      .join('')
    const url = `${BASE}?query=${encodeURIComponent(groq)}${paramString}`
    console.log('[Sanity] fetching:', url)
    const res = await fetch(url)
    if (!res.ok) {
      console.error('[Sanity] HTTP error:', res.status, res.statusText)
      return []
    }
    const json = await res.json()
    console.log('[Sanity] result count:', json.result?.length ?? 0)
    return json.result ?? []
  } catch (err) {
    console.error('[Sanity] fetch failed:', err)
    return []
  }
}

export function getTestimonials() {
  return fetchQuery(`*[_type == "testimonial"] | order(order asc)`)
}

export function getGalleryCollections() {
  return fetchQuery(`*[_type == "galleryCollection"] | order(order asc)`)
}

/* Fetch a single galleryCollection by slug. Used by project-page.js
   when the URL slug doesn't match anything in projects.js — falls
   back to Sanity so KNOCH-042 entries render their on-site detail
   page (KNOCH-043). Returns null if no entry matches. */
export async function getGalleryCollectionBySlug(slug) {
  if (!slug) return null
  const docs = await fetchQuery(`*[_type == "galleryCollection" && slug.current == $slug][0..0]`, { slug })
  return Array.isArray(docs) ? (docs[0] ?? null) : null
}

export function getFeaturedCollections() {
  return fetchQuery(`*[_type == "galleryCollection" && featured == true] | order(order asc)`)
}

export function getServices() {
  return fetchQuery(`*[_type == "service"] | order(order asc)`)
}

/* Singleton — Studio enforces a single aboutContent doc via
   __experimental_actions: ['update', 'publish']. Returns null if no
   doc has been published yet, so callers can fall back to static copy. */
export async function getAboutContent() {
  const docs = await fetchQuery(`*[_type == "aboutContent"]`)
  return Array.isArray(docs) ? (docs[0] ?? null) : null
}

export function imageUrl(source, width = 1500) {
  const ref = source?.asset?._ref ?? ''
  const parts = ref.split('-')
  if (parts.length < 4) return ''
  const [, id, dims, ext] = parts
  return `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${id}-${dims}.${ext}?w=${width}&auto=format`
}
