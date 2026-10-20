import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface LatLng {
  lat: number
  lng: number
}

interface Props {
  initial: LatLng & { zoom: number }
  target: LatLng | null
  onPick: (p: LatLng) => void
  insetLeft?: number
  insetBottom?: number
  label?: string
}

const near = (a: LatLng, b: LatLng) => Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6

function PickerMap({ initial, target, onPick, insetLeft = 0, insetBottom = 0, label }: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const insetsRef = useRef({ left: insetLeft, bottom: insetBottom })
  const lastSet = useRef<LatLng | null>(null)
  const current = useRef<LatLng>({ lat: initial.lat, lng: initial.lng })
  const onPickRef = useRef(onPick)
  const [moving, setMoving] = useState(false)
  const [pin, setPin] = useState({ x: 0, y: 0 })

  onPickRef.current = onPick
  insetsRef.current = { left: insetLeft, bottom: insetBottom }

  // screen point where the pin sits (centre of the visible, uncovered area)
  const pinPoint = () => {
    const el = divRef.current as HTMLDivElement
    const { left, bottom } = insetsRef.current
    return L.point((left + el.clientWidth) / 2, (el.clientHeight - bottom) / 2)
  }

  // put geo point p exactly under the pin
  const place = (map: L.Map, p: LatLng, zoom: number, fly: boolean) => {
    const offset = pinPoint().subtract(map.getSize().divideBy(2))
    const center = map.unproject(map.project([p.lat, p.lng], zoom).subtract(offset), zoom)
    lastSet.current = p
    current.current = p
    if (fly) map.flyTo(center, zoom, { duration: 1.1 })
    else map.setView(center, zoom, { animate: false })
  }

  useEffect(() => {
    const el = divRef.current
    if (!el) return

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 110,
      bounceAtZoomLimits: false,
      maxZoom: 19,
    })

    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      keepBuffer: 4,
      updateWhenIdle: false,
      updateWhenZooming: false,
    }).addTo(map)

    mapRef.current = map
    place(map, initial, initial.zoom, false)

    // tile container only exists once the map has a view, so apply the dark filter now
    const tc = tiles.getContainer()
    if (tc) tc.style.filter = 'invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.85) saturate(0.6)'

    const pt = pinPoint()
    setPin({ x: pt.x, y: pt.y })

    map.on('movestart', () => setMoving(true))
    map.on('moveend', () => {
      setMoving(false)
      const c = map.containerPointToLatLng(pinPoint())
      const p = { lat: c.lat, lng: c.lng }
      current.current = p
      if (lastSet.current && near(lastSet.current, p)) {
        lastSet.current = null
        return
      }
      onPickRef.current(p)
    })

    const ro = new ResizeObserver(() => {
      map.invalidateSize()
      const q = pinPoint()
      setPin({ x: q.x, y: q.y })
      place(map, current.current, map.getZoom(), false)
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  // layout insets changed (card width / mobile sheet): keep same spot under the pin
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const pt = pinPoint()
    setPin({ x: pt.x, y: pt.y })
    place(map, current.current, map.getZoom(), false)
  }, [insetLeft, insetBottom])

  // GPS / address result: fly there smoothly
  useEffect(() => {
    const map = mapRef.current
    if (!map || !target) return
    if (near(current.current, target)) return
    place(map, target, Math.max(map.getZoom(), 17), true)
  }, [target?.lat, target?.lng])

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#1b1d1f]">
      <div ref={divRef} className="absolute inset-0 z-0" />
      <div className="pointer-events-none absolute inset-0 z-[5] hidden xl:block bg-gradient-to-r from-black/45 via-black/10 to-transparent" />

      <div
        className="pointer-events-none absolute z-10"
        style={{ left: pin.x, top: pin.y, width: 36, height: 46, transform: 'translate(-50%, -100%)' }}
      >
        {label && !moving && (
          <div className="absolute bottom-full left-1/2 mb-3 max-w-[260px] -translate-x-1/2 truncate whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper shadow-xl">
            {label}
          </div>
        )}
        <div
          className={`absolute bottom-0 left-1/2 h-1.5 w-3 -translate-x-1/2 rounded-full bg-black/50 blur-[2px] transition-all duration-200 ${moving ? 'scale-50 opacity-40' : 'opacity-100'}`}
        />
        <svg
          width="36"
          height="46"
          viewBox="0 0 36 46"
          className={`absolute inset-0 drop-shadow-lg transition-transform duration-200 ease-out ${moving ? '-translate-y-3' : ''}`}
        >
          <path
            d="M18 45C18 45 2 28 2 17a16 16 0 0 1 32 0C34 28 18 45 18 45z"
            style={{ fill: 'var(--color-accent, #ef4444)' }}
            stroke="#fff"
            strokeWidth="2.5"
          />
          <circle cx="18" cy="17" r="6" fill="#fff" />
        </svg>
      </div>

      <span className="pointer-events-none absolute bottom-1 right-2 z-10 text-[10px] text-white/50">
        © OpenStreetMap contributors
      </span>
    </div>
  )
}

export default PickerMap