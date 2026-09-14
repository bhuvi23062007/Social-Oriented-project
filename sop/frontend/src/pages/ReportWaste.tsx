import { useState } from 'react'
import { motion } from 'framer-motion'

function ReportWaste() {
  const [image, setImage] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setImage(URL.createObjectURL(file))
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
        <div className="mb-5">
          <label className="label text-muted block mb-1.5">Waste Type</label>
          <select className="w-full border border-line rounded-md bg-paper px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors">
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
            placeholder="Enter waste location"
            className="w-full border border-line rounded-md bg-paper px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="mb-5">
          <label className="label text-muted block mb-1.5">Description</label>
          <textarea
            placeholder="Describe the waste problem..."
            rows={4}
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

        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          className="w-full bg-ink text-paper py-3 rounded-md font-medium text-sm hover:bg-accent hover:text-white transition-colors"
        >
          Submit Report
        </motion.button>
      </motion.div>
    </div>
  )
}

export default ReportWaste