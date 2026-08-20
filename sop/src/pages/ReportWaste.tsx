import { useState } from 'react'


function ReportWaste() {
  const [image, setImage] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file) {
      setImage(URL.createObjectURL(file))
    }
  }

  return (
    <div className="report-page">

      <div className="report-header">
        <div>
          <h1>Report Waste</h1>
          <p>Help keep your community clean by reporting waste.</p>
        </div>

        <div className="report-icon">📸</div>
      </div>

      <div className="report-card">

        <div className="form-group">
          <label>Waste Type</label>

          <select>
            <option value="">Select waste type</option>
            <option>Plastic Waste</option>
            <option>Food Waste</option>
            <option>Electronic Waste</option>
            <option>Construction Waste</option>
            <option>Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Location</label>

          <input
            type="text"
            placeholder="Enter waste location"
          />
        </div>

        <div className="form-group">
          <label>Description</label>

          <textarea
            placeholder="Describe the waste problem..."
            rows={5}
          />
        </div>

        <div className="form-group">
          <label>Upload Photo</label>

          <div className="upload-box">

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            <p>📷 Click to upload waste image</p>
            <span>PNG, JPG or JPEG</span>

          </div>

          {image && (
            <img
              src={image}
              alt="Waste preview"
              className="image-preview"
            />
          )}

        </div>

        <button className="submit-report">
          Submit Report
        </button>

      </div>

    </div>
  )
}

export default ReportWaste