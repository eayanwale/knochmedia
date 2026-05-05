const PROJECT_ID = document.querySelector('meta[name="sanity-project-id"]').content
const DATASET = document.querySelector('meta[name="sanity-dataset"]').content
const BASE = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${DATASET}`

async function fetchQuery(groq) {
  try {
    const res = await fetch(`${BASE}?query=${encodeURIComponent(groq)}`)
    const { result } = await res.json()
    return result ?? []
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

export function imageUrl(source, width = 1500) {
  const ref = source?.asset?._ref ?? ''
  const parts = ref.split('-')
  if (parts.length < 4) return ''
  const [, id, dims, ext] = parts
  return `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${id}-${dims}.${ext}?w=${width}&auto=format`
}
