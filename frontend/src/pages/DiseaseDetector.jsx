import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Loader2, AlertTriangle, CheckCircle, Leaf } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"
import { API_BASE_URL } from "../config/api"

const API = API_BASE_URL

const URGENCY_COLORS = {
  "Immediate":     "bg-red-500/20 text-red-400 border-red-500/30",
  "Within a week": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Monitor":       "bg-green-500/20 text-green-400 border-green-500/30",
}

export default function DiseaseDetectorPage() {
  const [preview, setPreview]   = useState(null)
  const [result,  setResult]    = useState(null)
  const [loading, setLoading]   = useState(false)
  const [selectedCrop, setSelectedCrop] = useState("All Crops")

  const AVAILABLE_CROPS = [
    "All Crops", "Apple", "Blueberry", "Cherry", "Corn", "Grape", 
    "Orange", "Peach", "Pepper", "Potato", "Raspberry", 
    "Soybean", "Squash", "Strawberry", "Tomato"
  ]

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setLoading(true)

    try {
      const form = new FormData()
      form.append("file", file)
      if (selectedCrop && selectedCrop !== "All Crops") {
        form.append("crop", selectedCrop)
      }
      
      const token = localStorage.getItem("kisanai_token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      
      const { data } = await axios.post(`${API}/api/disease/analyze`, form, { headers })
      setResult(data)
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || "Failed to analyze image. Please try again."
      if (error.response?.status === 429) {
        toast.error('Daily AI limit reached. Please try again tomorrow or contact support.', 
          { duration: 6000 })
      } else {
        toast.error(errorMsg, { duration: 4000 })
      }
    } finally {
      setLoading(false)
    }
  }, [selectedCrop])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] }, maxFiles: 1
  })

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="section-heading">Crop Disease Detector</h1>
          <p className="text-white/50 mb-8">Upload a photo of your crop or leaf — our AI will diagnose the disease and suggest treatment.</p>
        </motion.div>

        {/* Crop Selection Dropdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="mb-6 flex flex-col gap-2">
            <label className="text-white/70 text-sm font-medium">Which crop are you uploading? (Optional but improves accuracy)</label>
            <select 
              value={selectedCrop} 
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-black/30 border border-white/20 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-kisan-green-light transition-colors appearance-none"
            >
              {AVAILABLE_CROPS.map(crop => (
                <option key={crop} value={crop} className="bg-kisan-dark text-white">
                  {crop}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Upload Zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div {...getRootProps()} className={`
            relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
            ${isDragActive ? "border-kisan-green-light bg-kisan-green/20" : "border-white/20 hover:border-kisan-green-light/50 hover:bg-white/5"}
          `}>
            <input {...getInputProps()} />
            {preview ? (
              <img src={preview} alt="Crop preview" className="max-h-64 mx-auto rounded-xl object-contain" />
            ) : (
              <div className="py-8">
                <Upload className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/60 text-lg">Drop your crop photo here</p>
                <p className="text-white/30 text-sm mt-2">or click to browse — JPG, PNG, WEBP</p>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 bg-kisan-dark/80 rounded-2xl flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-kisan-green-light animate-spin" />
                <span className="text-white">Analyzing your crop...</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Detection Summary */}
        {result && (
          <div className="mt-4 text-center">
            <p className="text-white/50 text-sm">
              Detected:
              <span className="text-kisan-gold font-medium mx-1">{result.crop_name}</span>
              —
              <span className={`font-medium mx-1 ${result.is_healthy ? 'text-green-400' : 'text-yellow-400'}`}>
                {result.disease}
              </span>
            </p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-8 space-y-4">

              {/* Crop Name Badge */}
              <div className="card-glass p-6">
                {result.crop_name && (
                  <div style={{marginBottom: '12px'}}>
                    <span className="text-white/40 text-xs uppercase tracking-wide">Detected Crop</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl">🌾</span>
                      <span className="font-display text-2xl font-bold text-kisan-gold">
                        {result.crop_name}
                      </span>
                    </div>
                  </div>
                )}
                <div className="border-t border-white/10 mb-4" />

                {/* Disease name card */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {result.is_healthy
                        ? <CheckCircle className="w-5 h-5 text-green-400" />
                        : <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                      <h2 className="font-display text-2xl font-bold text-white">{result.disease}</h2>
                    </div>
                    <p className="text-white/50 text-sm">Confidence: {result.confidence} • {result.cause}</p>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full border ${URGENCY_COLORS[result.urgency] || ""}`}>
                    {result.urgency}
                  </span>
                </div>

                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Symptoms observed</p>
                  <div className="flex flex-wrap gap-2">
                    {result.symptoms?.map((s, i) => (
                      <span key={i} className="bg-white/10 text-white/70 text-xs px-3 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Treatment */}
              <div className="card-glass p-6">
                <h3 className="font-display text-lg font-semibold text-kisan-gold mb-3 flex items-center gap-2">
                  <Leaf className="w-4 h-4" /> Treatment Steps
                </h3>
                <ol className="space-y-2">
                  {result.treatment?.map((step, i) => (
                    <li key={i} className="flex gap-3 text-white/80 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 bg-kisan-green rounded-full text-xs flex items-center justify-center text-white font-bold">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Products + Prevention */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card-glass p-6">
                  <h3 className="text-sm font-medium text-white/60 mb-3">Recommended Products</h3>
                  <ul className="space-y-1">
                    {result.products?.map((p, i) => (
                      <li key={i} className="text-white/80 text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-kisan-gold rounded-full" />{p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card-glass p-6">
                  <h3 className="text-sm font-medium text-white/60 mb-3">Prevention Tips</h3>
                  <ul className="space-y-1">
                    {result.prevention?.map((p, i) => (
                      <li key={i} className="text-white/80 text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-kisan-green-light rounded-full" />{p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
