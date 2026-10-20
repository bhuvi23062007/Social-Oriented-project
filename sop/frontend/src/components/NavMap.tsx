import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Props {
  dest: { lat: number; lng: number }
  me: { lat: number; lng: number } | null
  heading: number | null
  accuracy: number | null
  route: [number, number][]
  follow: boolean
  fitSignal: number
  onDrag: () => void
}

const pinIcon = L.divIcon({
  className: '',
  html: '<svg width="36" height="46" viewBox="0 0 36 46" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,.5))"><path d="M18 45C18 45 2 28 2 17a16 16 0 0 1 32 0C34 28 18 45 18 45z" style="fill:#ef4444" stroke="#fff" stroke-width="2.5"/><circle cx="18" cy="17" r="6" fill="#fff"/></svg>',
  iconSize: [36, 46],
  iconAnchor: [18, 45],
})

// pulsing blue dot with a heading arrow
const meIcon = L.divIcon({
  className: '',
  html: `<div class="relative" style="width:44px;height:44px">
    <span class="absolute inset-0 animate-ping rounded-full" style="background:rgba(59,130,246,.35)"></span>
    <div class="me-arrow absolute inset-0" style="opacity:0;transition:transform .4s linear">
      <svg width="44" height="44" viewBox="0 0 44 44"><path d="M22 1 33 19 22 15 11 19z" fill="#3b82f6"/></svg>
    </div>
    <span class="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white" style="background:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.35)"></span>
  </div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
})

// keep the dot above the bottom sheet instead of dead centre
const SHEET_OFFSET_Y = 120

function focusOn(map: L.Map, ll: L.LatLngExpression) {
  const z = Math.max(map.getZoom(), 17)
  const p = map.project(ll, z).add([0, SHEET_OFFSET_Y])
  map.setView(map.unproject(p, z), z, { animate: true })
}

function NavMap({ dest, me, heading, accuracy, route, follow, fitSignal, onDrag }: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const meRef = useRef<L.Marker | null>(null)
  const accRef = useRef<L.Circle | null>(null)
  const linesRef = useRef<L.LayerGroup | null>(null)
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
      accRef.current = null
      linesRef.current = null
    }
  }, [])

  // route: dark casing + bright line
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    linesRef.current?.remove()
    if (route.length < 2) {
      linesRef.current = null
      return
    }
    linesRef.current = L.layerGroup([
      L.polyline(route, { color: '#0b1220', weight: 11, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }),
      L.polyline(route, { color: '#4C8DFF', weight: 6, opacity: 1, lineCap: 'round', lineJoin: 'round' }),
    ]).addTo(map)
  }, [route])

  // live position, accuracy ring, follow
  useEffect(() => {
    const map = mapRef.current
    if (!map || !me) return
    const ll: L.LatLngExpression = [me.lat, me.lng]
    if (!meRef.current) {
      meRef.current = L.marker(ll, { icon: meIcon, zIndexOffset: 1000, interactive: false }).addTo(map)
      accRef.current = L.circle(ll, {
        radius: 0,
        color: '#3b82f6',
        weight: 1,
        fillColor: '#3b82f6',
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(map)
    } else {
      meRef.current.setLatLng(ll)
      accRef.current?.setLatLng(ll)
    }
    accRef.current?.setRadius(accuracy != null && accuracy < 300 ? accuracy : 0)
    if (follow) focusOn(map, ll)
  }, [me?.lat, me?.lng, accuracy, follow])

  // heading arrow
  useEffect(() => {
    const el = meRef.current?.getElement()?.querySelector<HTMLElement>('.me-arrow')
    if (!el) return
    el.style.opacity = heading == null ? '0' : '1'
    el.style.transform = `rotate(${heading ?? 0}deg)`
  }, [heading, me?.lat, me?.lng])

  // overview button: show cleaner + destination together
  useEffect(() => {
    const map = mapRef.current
    if (!map || !fitSignal || !me) return
    map.fitBounds(
      L.latLngBounds([
        [me.lat, me.lng],
        [dest.lat, dest.lng],
      ]),
      { paddingTopLeft: [40, 160], paddingBottomRight: [40, 280] },
    )
  }, [fitSignal])

  return <div ref={divRef} className="absolute inset-0" />
}

export default NavMap