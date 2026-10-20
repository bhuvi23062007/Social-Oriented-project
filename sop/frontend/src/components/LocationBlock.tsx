import { useState } from 'react'
import MapModal from './MapModal'

interface Props {
  lat: number
  lng: number
  showMe?: boolean
}

function LocationBlock({ lat, lng, showMe = false }: Props) {
  const [open, setOpen] = useState(false)
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null)

  const openMap = () => {
    setMe(null)
    setOpen(true)
    if (!showMe || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (p) => setMe({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="mt-3">
      <button type="button" onClick={openMap} className="text-xs text-accent underline">
        🗺️ View map
      </button>
      {open && <MapModal dest={{ lat, lng }} me={showMe ? me : null} onClose={() => setOpen(false)} />}
    </div>
  )
}

export default LocationBlock