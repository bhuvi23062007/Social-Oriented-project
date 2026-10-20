import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchRoute } from '../lib/route'

interface Pt {
  lat: number
  lng: number
}

interface Props {
  dest: Pt
  me?: Pt | null
  onClose: () => void
}

const pin = (color: string) =>
  L.divIcon({
    className: '',
    html: `<svg width="36" height="46" viewBox="0 0 36 46" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,.5))"><path d="M18 45C18 45 2 28 2 17a16 16 0 0 1 32 0C34 28 18 45 18 45z" fill="${color}" stroke="#fff" stroke-width="2.5"/><circle cx="18" cy="17" r="6" fill="#fff"/></svg>`,
    iconSize: [36, 46],
    iconAnchor: [18, 45],
  })

function MapModal({ dest, me, onClose }: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    if (!divRef.current) return
    let cancelled = false

    const map = L.map(divRef.current, {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0,
      zoomDelta: 0.5,
    }).setView([dest.lat, dest.lng], 16)

    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    const tc = tiles.getContainer()
    if (tc) tc.style.filter = 'invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.85) saturate(0.6)'

    L.marker([dest.lat, dest.lng], { icon: pin('#ef4444') }).addTo(map)

    if (me) {
      L.marker([me.lat, me.lng], { icon: pin('#3b82f6') }).addTo(map)
      map.fitBounds(
        L.latLngBounds([
          [dest.lat, dest.lng],
          [me.lat, me.lng],
        ]),
        { padding: [80, 80], maxZoom: 17 },
      )

      fetchRoute(me, dest).then((r) => {
        if (cancelled) return
        if (r) {
          L.polyline(r.coords, { color: '#0b1220', weight: 9, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }).addTo(map)
          L.polyline(r.coords, { color: '#4C8DFF', weight: 5, lineCap: 'round', lineJoin: 'round' }).addTo(map)
          map.fitBounds(L.latLngBounds(r.coords), { padding: [80, 80], maxZoom: 17 })
        } else {
          L.polyline(
            [
              [me.lat, me.lng],
              [dest.lat, dest.lng],
            ],
            { color: '#4C8DFF', weight: 4, dashArray: '8 8' },
          ).addTo(map)
        }
      })
    }

    return () => {
      cancelled = true
      map.remove()
    }
  }, [dest.lat, dest.lng, me?.lat, me?.lng])

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative h-[80vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div ref={divRef} className="absolute inset-0 bg-[#1b1d1f]" />
        <button
          onClick={onClose}
          aria-label="Close map"
          className="absolute right-3 top-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-full bg-[#101318]/90 text-white shadow-xl"
        >
          ✕
        </button>
        <span className="pointer-events-none absolute bottom-1 right-3 z-[1000] text-[10px] text-white/50">
          © OpenStreetMap contributors
        </span>
      </div>
    </div>,
    document.body,
  )
}

export default MapModal