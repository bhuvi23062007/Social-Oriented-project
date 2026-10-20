import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Props {
  dest: { lat: number; lng: number }
  me: { lat: number; lng: number } | null
  route: [number, number][]
  follow: boolean
  fitSignal: number
  onDrag: () => void
}

const pinIcon = L.divIcon({
  className: '',
  html: '<svg width="36" height="46" viewBox="0 0 36 46" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,.5))"><path d="M18 45C18 45 2 28 2 17a16 16 0 0 1 32 0C34 28 18 45 18 45z" style="fill:var(--color-accent,#ef4444)" stroke="#fff" stroke-width="2.5"/><circle cx="18" cy="17" r="6" fill="#fff"/></svg>',
  iconSize: [36, 46],
  iconAnchor: [18, 45],
})

function NavMap({ dest, me, route, follow, fitSignal, onDrag }: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const meRef = useRef<L.CircleMarker | null>(null)
  const lineRef = useRef<L.Polyline | null>(null)
  const onDragRef = useRef(onDrag)
  onDragRef.current = onDrag

  useEffect(() => {
    if (!divRef.current) return
    // view first, so the tile container exists when the dark filter is applied
    const map = L.map(divRef.current, { zoomControl: false, attributionControl: false }).setView(
      [dest.lat, dest.lng],
      16,
    )
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    const tc = tiles.getContainer()
    if (tc) tc.style.filter = 'invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.85) saturate(0.6)'

    L.marker([dest.lat, dest.lng], { icon: pinIcon }).addTo(map)
    map.on('dragstart', () => onDragRef.current())

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      meRef.current = null
      lineRef.current = null
    }
  }, [])

  // route line
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    lineRef.current?.remove()
    lineRef.current =
      route.length > 1 ? L.polyline(route, { color: '#5B8CFF', weight: 6, opacity: 0.9 }).addTo(map) : null
  }, [route])

  // live blue dot, follows the cleaner while follow is on
  useEffect(() => {
    const map = mapRef.current
    if (!map || !me) return
    const ll: L.LatLngExpression = [me.lat, me.lng]
    if (!meRef.current) {
      meRef.current = L.circleMarker(ll, {
        radius: 9,
        color: '#ffffff',
        weight: 3,
        fillColor: '#3b82f6',
        fillOpacity: 1,
      }).addTo(map)
    } else {
      meRef.current.setLatLng(ll)
    }
    if (follow) map.setView(ll, Math.max(map.getZoom(), 17), { animate: true })
  }, [me?.lat, me?.lng, follow])

  // "Overview" button: show cleaner + destination together
  useEffect(() => {
    const map = mapRef.current
    if (!map || !fitSignal || !me) return
    map.fitBounds(
      L.latLngBounds([
        [me.lat, me.lng],
        [dest.lat, dest.lng],
      ]),
      { padding: [90, 90] },
    )
  }, [fitSignal])

  return <div ref={divRef} className="absolute inset-0" />
}

export default NavMap