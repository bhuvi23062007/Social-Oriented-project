import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useReports } from '../hooks/useReports'
import { api } from '../lib/api'
import { compressImage } from '../lib/image'
import PickerMap, { type LatLng } from '../components/PickerMap'

type Mode = 'gps' | 'manual'

const FALLBACK = { lat: 20.5937, lng: 78.9629, zoom: 5 }

const initialView = () => {
  try {
    const s = localStorage.getItem('lastCoords')
    if (s) {
      const c = JSON.parse(s)
      return { lat: c.lat as number, lng: c.lng as number, zoom: 15 }
    }
  } catch {
    /* ignore */
  }
  return FALLBACK
}

const getGps = () =>
  new Promise<LatLng>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('unsupported'))
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error('denied')),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  })

const geocode = async (q: string) => {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`)
  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}

const reverseName = async (lat: number, lng: number) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&lat=${lat}&lon=${lng}`)
    const d = await res.json()
    const a = d.address || {}
    const parts = [a.road || a.neighbourhood, a.suburb, a.city || a.town || a.village || a.county].filter(Boolean)
    if (parts.length) return parts.join(', ') as string
    return String(d.display_name || '').split(',').slice(0, 3).join(',').trim()
  } catch {
    return ''
  }
}

function ReportWaste() {
  const navigate = useNavigate()
  const { addReport } = useReports()
  const cardRef = useRef<HTMLDivElement>(null)
  const autoRef = useRef(true)
  const dirtyRef = useRef(false)
  const [initial] = useState(initialView)

  const [image, setImage] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState<Mode>('gps')
  const [coords, setCoords] = useState<LatLng | null>(null)
  const [placeName, setPlaceName] = useState('')
  const [locBusy, setLocBusy] = useState(false)
  const [locError, setLocError] = useState('')
  const [insets, setInsets] = useState({ left: 0, bottom: 0 })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // where the pin should sit so it's never hidden behind the form
  useEffect(() => {
    const calc = () => {
      const el = cardRef.current
      if (!el) return
      if (window.innerWidth >= 1280) {
        setInsets({ left: Math.max(0, el.getBoundingClientRect().right - 300 + 32), bottom: 0 })
      } else {
        setInsets({ left: 0, bottom: Math.round(window.innerHeight * 0.58) })
      }
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  useEffect(() => {
    if (coords) localStorage.setItem('lastCoords', JSON.stringify(coords))
  }, [coords])

  // place name under the pin (debounced)
  useEffect(() => {
    if (!coords) return
    const t = setTimeout(async () => {
      const name = await reverseName(coords.lat, coords.lng)
      setPlaceName(name)
      if (name && autoRef.current) setLocation(name)
    }, 700)
    return () => clearTimeout(t)
  }, [coords?.lat, coords?.lng])

  const detect = async () => {
    setLocBusy(true)
    setLocError('')
    try {
      setCoords(await getGps())
    } catch {
      setLocError('Could not get GPS. Allow location access, or move the map / type an address.')
    } finally {
      setLocBusy(false)
    }
  }

  const findAddress = async () => {
    if (!location.trim()) return
    setLocBusy(true)
    setLocError('')
    try {
      const g = await geocode(location)
      if (g) {
        setCoords(g)
        dirtyRef.current = false
      } else {
        setLocError('Address not found. Try a more specific one.')
      }
    } catch {
      setLocError('Address lookup failed. Try again.')
    } finally {
      setLocBusy(false)
    }
  }

  useEffect(() => {
    if (mode === 'gps') detect()
  }, [mode])

  const switchMode = (m: Mode) => {
    setMode(m)
    autoRef.current = m === 'gps' && !location.trim()
    setLocError('')
  }

  const handlePick = (p: LatLng) => {
    setCoords(p)
    setLocError('')
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setImage(URL.createObjectURL(f))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!file) {
      setError('A photo of the waste is required')
      return
    }

    setSubmitting(true)
    try {
      let c = coords
      if (mode === 'manual' && dirtyRef.current) {
        const g = await geocode(location)
        if (!g) {
          setError('Address not found. Tap Find or move the map to the spot.')
          return
        }
        c = g
      }
      if (!c && mode === 'gps') {
        try {
          c = await getGps()
        } catch {
          /* handled below */
        }
      }
      if (!c) {
        setError('Pick a spot: allow GPS, type an address, or move the map.')
        return
      }

      const formData = new FormData()
      formData.append('file', await compressImage(file))
      const up = await api.post('/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      await addReport(`${location}: ${description}`, c.lat, c.lng, up.data.url)
      navigate('/my-reports')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 xl:left-[300px] z-0">
        <PickerMap
          initial={initial}
          target={coords}
          onPick={handlePick}
          insetLeft={insets.left}
          insetBottom={insets.bottom}
          label={locBusy ? 'Locating…' : placeName}
        />
      </div>

      <div ref={cardRef} className="relative z-10 mt-[42vh] w-full max-w-[420px] xl:mt-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="rounded-3xl border border-line bg-surface/90 p-6 shadow-2xl backdrop-blur-xl"
        >
          <span className="label text-accent">Report</span>
          <h1 className="mt-1 text-2xl font-black tracking-tighter">Report Waste</h1>
          <p className="mb-5 mt-1 text-sm text-muted">Move the map to put the pin exactly on the spot.</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label text-muted">Location</label>
                <div className="flex rounded-full border border-line p-0.5">
                  {(['gps', 'manual'] as const).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => switchMode(m)}
                      className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${mode === m ? 'bg-ink text-paper' : 'text-muted'}`}
                    >
                      {m === 'gps' ? 'GPS' : 'Address'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    const v = e.target.value
                    setLocation(v)
                    autoRef.current = mode === 'gps' && v === ''
                    if (mode === 'manual') dirtyRef.current = true
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && mode === 'manual') {
                      e.preventDefault()
                      findAddress()
                    }
                  }}
                  placeholder={mode === 'gps' ? 'Landmark or street name' : 'Type an address, then Find'}
                  required
                  className="flex-1 rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={mode === 'gps' ? detect : findAddress}
                  disabled={locBusy || (mode === 'manual' && !location.trim())}
                  className="rounded-xl border border-line px-3.5 text-xs font-medium transition-colors hover:border-accent disabled:opacity-50"
                >
                  {locBusy ? '...' : mode === 'gps' ? '◎ Detect' : 'Find'}
                </button>
              </div>

              {locError ? (
                <p className="mt-1.5 text-xs text-glass">{locError}</p>
              ) : coords ? (
                <p className="mt-1.5 font-mono text-[11px] text-muted">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-muted">Detecting your location…</p>
              )}
            </div>

            <div className="mb-4">
              <label className="label mb-1.5 block text-muted">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the waste problem..."
                rows={3}
                required
                className="w-full resize-none rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm transition-colors focus:border-accent focus:outline-none"
              />
            </div>

            <div className="mb-5">
              <label className="label mb-1.5 block text-muted">Photo (required)</label>
              <div className="relative flex items-center gap-3 rounded-xl border border-dashed border-line bg-paper p-3 transition-colors hover:border-accent">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                {image ? (
                  <img src={image} alt="Waste preview" className="h-16 w-16 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-accent-soft text-2xl">📷</span>
                )}
                <div>
                  <p className="text-sm font-medium">{image ? 'Photo added' : 'Add a photo'}</p>
                  <span className="text-xs text-muted">{image ? 'Tap to change' : 'PNG, JPG or JPEG'}</span>
                </div>
              </div>
            </div>

            {error && (
              <p className="mb-4 rounded-xl border border-line bg-accent-soft px-3 py-2 text-xs text-glass">{error}</p>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-ink py-3 text-sm font-medium text-paper transition-colors hover:bg-accent hover:text-white disabled:opacity-60"
            >
              {submitting ? 'Analyzing photo…' : 'Submit Report'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </>
  )
}

export default ReportWaste