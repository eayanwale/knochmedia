const PROJECT_ID = document.querySelector('meta[name="sanity-project-id"]')?.content ?? ''
const DATASET    = document.querySelector('meta[name="sanity-dataset"]')?.content ?? ''
const BASE = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${DATASET}`

async function fetchQuery(groq) {
  if (!PROJECT_ID || !DATASET) {
    console.warn('[Sanity] project-id or dataset meta tag missing — using static fallback')
    return []
  }
  try {
    const url = `${BASE}?query=${encodeURIComponent(groq)}`
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
