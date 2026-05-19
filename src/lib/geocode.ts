/**
 * Geocodes a physical event location to lat/lng using Nominatim (OpenStreetMap).
 * Returns null for online events or if geocoding fails — always safe to ignore.
 */
export async function geocodeEvent(parts: {
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
}): Promise<{ latitude: number; longitude: number } | null> {
  const { address, city, state, country } = parts

  // Build query from most-specific to least: address, city, state, country
  const query = [address, city, state, country]
    .map(p => p?.trim())
    .filter(Boolean)
    .join(', ')

  if (!query) return null

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Gospello/1.0 (gospello.app)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null
    const { lat, lon } = data[0]
    return { latitude: parseFloat(lat), longitude: parseFloat(lon) }
  } catch {
    return null
  }
}
