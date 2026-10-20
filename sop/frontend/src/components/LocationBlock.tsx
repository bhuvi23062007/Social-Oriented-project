import { useEffect, useState } from 'react'
import MapView from './MapView'
import { directionsLink } from '../lib/googleMaps'

interface Props {
  lat: number
  lng: number
  showMe?: boolean
  height?: number
}

function LocationBlock({ lat, lng, showMe = false, height = 200 }: Props) {
  const [open, setOpen] = useState(false)
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!open || !showMe || me || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (p) => setMe({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [open, showMe, me])

  return (
    <div className="mt-3">
      <div className="flex items-center gap-4 text-xs">
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-accent underline">
          {open ? 'Hide map' : '🗺️ Show map'}
        </button>
        <a href={directionsLink(lat, lng)} target="_blank" rel="noreferrer" className="text-accent underline">
          🧭 Get directions
        </a>
      </div>
      {open && (
        <div className="mt-2">
          <MapView lat={lat} lng={lng} viewer={me} height={height} />
        </div>
      )}
    </div>
  )
}

export default LocationBlock