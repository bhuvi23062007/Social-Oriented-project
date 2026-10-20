export interface LatLng {
  lat: number
  lng: number
}
export interface RouteStep {
  text: string
  distance: number
  type: string
  modifier?: string
}
export interface RouteInfo {
  coords: [number, number][]
  distance: number
  duration: number
  steps: RouteStep[]
}

export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lng - a.lng)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export const fmtDist = (m: number) =>
  m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1)} km`

export const fmtMin = (s: number) => `${Math.max(1, Math.round(s / 60))} min`

export function stepArrow(type: string, modifier?: string): string {
  if (type === 'arrive') return '📍'
  if (modifier?.includes('uturn')) return '↩️'
  if (modifier?.includes('left')) return '⬅️'
  if (modifier?.includes('right')) return '➡️'
  return '⬆️'
}

function describe(type: string, modifier: string | undefined, name: string, exit?: number): string {
  const onto = name ? ` onto ${name}` : ''
  const side = modifier ?? 'straight'
  switch (type) {
    case 'depart':
      return name ? `Head out on ${name}` : 'Start heading out'
    case 'arrive':
      return 'You have arrived at the spot'
    case 'turn':
      return side === 'straight' ? `Continue straight${onto}` : `Turn ${side}${onto}`
    case 'end of road':
      return `At the end of the road, turn ${side}${onto}`
    case 'fork':
      return `Keep ${side.includes('left') ? 'left' : 'right'} at the fork`
    case 'merge':
      return `Merge${onto}`
    case 'roundabout':
    case 'rotary':
      return exit ? `At the roundabout, take exit ${exit}${onto}` : `Enter the roundabout${onto}`
    default:
      return `Continue ${side}${name ? ` on ${name}` : ''}`
  }
}

// free OSRM demo server (driving). Host your own for production.
export async function fetchRoute(from: LatLng, to: LatLng): Promise<RouteInfo | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const r = data.routes?.[0]
    if (!r) return null

    const coords: [number, number][] = r.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
    )
    coords.push([to.lat, to.lng])

    return {
      coords,
      distance: r.distance,
      duration: r.duration,
      steps: r.legs[0].steps.map((s: any) => ({
        text: describe(s.maneuver.type, s.maneuver.modifier, s.name, s.maneuver.exit),
        distance: s.distance,
        type: s.maneuver.type,
        modifier: s.maneuver.modifier,
      })),
    }
  } catch {
    return null
  }
}