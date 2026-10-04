import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useReports } from '../hooks/useReports'
import { api } from '../lib/api'

function ReportWaste() {
  const navigate = useNavigate()
  const { addReport } = useReports()
  const [image, setImage] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [wasteType, setWasteType] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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

    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser')
      return
    }

    setSubmitting(true)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          let imageUrl: string | undefined

          if (file) {
            const formData = new FormData()
            formData.append('file', file)
            const uploadRes = await api.post('/storage/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
            imageUrl = uploadRes.data.url
          }

          const fullDescription = `[${wasteType}] ${location}: ${description}`
          await addReport(fullDescription, pos.coords.latitude, pos.coords.longitude, imageUrl)
          navigate('/my-reports')
        } catch (err) {
          setError('Failed to submit report')
        } finally {
          setSubmitting(false)
        }
      },
      () => {
        setError('Could not get your location — please allow location access')
        setSubmitting(false)
      },
    )
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <span className="label text-accent">Report</span>
          <h1 className="text-3xl font-black tracking-tighter mt-1">Report Waste</h1>
          <p className="text-muted text-sm mt-1">Help keep your community clean.</p>
        </div>
        <div className="w-11 h-11 rounded-lg bg-accent-soft text-accent flex items-center justify-center text-lg">📍</div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="bg-surface border border-line rounded-2xl p-7"
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="label text-muted block mb-1.5">Waste Type</label>
            <select value={wasteType} onChange={(e) => setWasteType(e.target.value)} required className="w-full border border-line rounded-md bg-paper px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors">
              <option value="">Select waste type</option>
              <option>Plastic Waste</option>
              <option>Food Waste</option>
              <option>Electronic Waste</option>
              <option>Construction Waste</option>
              <option>Other</option>
            </select>
          </div>

          <div className="mb-5">
            <label className="label text-muted block mb-1.5">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter waste location"
              required
              className="w-full border border-line rounded-md bg-paper px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
            />
            <p className="text-xs text-muted mt-1">Your device's GPS coordinates will also be captured automatically.</p>
          </div>

          <div className="mb-5">
            <label className="label text-muted block mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the waste problem..."
              rows={4}
              required
              className="w-full border border-line rounded-md bg-paper px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          <div className="mb-6">
            <label className="label text-muted block mb-1.5">Upload Photo</label>
            <motion.div
              whileHover={{ borderColor: 'var(--color-accent)' }}
              className="relative border-2 border-dashed border-line rounded-lg p-8 text-center bg-paper transition-colors"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <p className="text-sm font-medium mb-1">📷 Click to upload waste image</p>
              <span className="text-xs text-muted">PNG, JPG or JPEG</span>
            </motion.div>

            {image && (
              <motion.img
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                src={image} alt="Waste preview"
                className="mt-3.5 w-full max-h-56 object-cover rounded-lg border border-line"
              />
            )}
          </div>

          {error && (
            <p className="text-xs text-glass bg-accent-soft border border-line rounded-md px-3 py-2 mb-4">{error}</p>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="w-full bg-ink text-paper py-3 rounded-md font-medium text-sm hover:bg-accent hover:text-white transition-colors disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit Report'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}

export default ReportWaste