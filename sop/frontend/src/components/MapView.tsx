import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Props {
  lat: number
  lng: number
  draggable?: boolean
  onChange?: (lat: number, lng: number) => void
  viewer?: { lat: number; lng: number } | null
  height?: number | string
  focusShiftX?: number
}

const pinIcon = L.divIcon({
  className: '',
  html: '<svg width="36" height="46" viewBox="0 0 36 46" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,.5))"><path d="M18 45C18 45 2 28 2 17a16 16 0 0 1 32 0C34 28 18 45 18 45z" style="fill:var(--color-accent,#ef4444)" stroke="#fff" stroke-width="2.5"/><circle cx="18" cy="17" r="6" fill="#fff"/></svg>',
  iconSize: [36, 46],
  iconAnchor: [18, 45],
})

// center the map so the pin shows shiftX px to the right of center
function focus(map: L.Map, lat: number, lng: number, shiftX: number, animate: boolean) {
  const z = map.getZoom()
  const p = map.project([lat, lng], z).subtract([shiftX, 0])
  map.setView(map.unproject(p, z), z, { animate })
}

function MapView({ lat, lng, draggable = false, onChange, viewer, height = 260, focusShiftX = 0 }: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const viewerRef = useRef<L.CircleMarker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!divRef.current) return
    const map = L.map(divRef.current, {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0,
      zoomDelta: 0.5,
      scrollWheelZoom: true,
    }).setView([lat, lng], 17)
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)
    const c = tiles.getContainer()
    if (c) c.style.filter = 'invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.85) saturate(0.6)'

    const marker = L.marker([lat, lng], { icon: pinIcon, draggable }).addTo(map)
    if (focusShiftX) focus(map, lat, lng, focusShiftX, false)

    if (draggable) {
      marker.on('dragend', () => {
        const p = marker.getLatLng()
        onChangeRef.current?.(p.lat, p.lng)
      })
      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng)
        onChangeRef.current?.(e.latlng.lat, e.latlng.lng)
      })
    }

    mapRef.current = map
    markerRef.current = marker

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
      viewerRef.current = null
    }
  }, [])

  // sync pin + view when coords change from outside (GPS / address search)
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return
    const cur = marker.getLatLng()
    if (Math.abs(cur.lat - lat) < 1e-9 && Math.abs(cur.lng - lng) < 1e-9) return
    marker.setLatLng([lat, lng])
    focus(map, lat, lng, focusShiftX, true)
  }, [lat, lng])

  // viewer (cleaner) blue dot
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!viewer) {
      viewerRef.current?.remove()
      viewerRef.current = null
      return
    }

    const pos: L.LatLngExpression = [viewer.lat, viewer.lng]
    if (!viewerRef.current) {
      viewerRef.current = L.circleMarker(pos, {
        radius: 8,
        color: '#ffffff',
        weight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 1,
      }).addTo(map)
    } else {
      viewerRef.current.setLatLng(pos)
    }

    const far = Math.abs(viewer.lat - lat) + Math.abs(viewer.lng - lng) > 0.0003
    if (far) map.fitBounds(L.latLngBounds([[lat, lng], pos]), { padding: [40, 40] })
  }, [viewer?.lat, viewer?.lng, lat, lng])

    return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-line" style={{ height }}>
      <div ref={divRef} className="absolute inset-0 z-0" />
      <span className="pointer-events-none absolute bottom-1 right-2 z-10 text-[10px] text-white/50">
        © OpenStreetMap contributors
      </span>
    </div>
  )
}

export default MapView