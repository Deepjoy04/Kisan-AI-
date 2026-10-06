import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, FlaskConical, Sprout } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"
import { API_BASE_URL } from "../config/api"

const API = API_BASE_URL

const HEALTH_COLORS = {
  "Poor":      "text-red-400",
  "Fair":      "text-yellow-400",
  "Good":      "text-green-400",
  "Excellent": "text-emerald-400",
}

const defaultForm = {
  nitrogen: "", phosphorus: "", potassium: "",
  ph: "", moisture: "", crop_type: "", location: ""
}

export default function SoilAdvisor() {
  const [form,    setForm]    = useState(defaultForm)
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const payload = {
        ...form,
        nitrogen: parseFloat(form.nitrogen),
        phosphorus: parseFloat(form.phosphorus),
        potassium: parseFloat(form.potassium),
        ph: parseFloat(form.ph),
        moisture: parseFloat(form.moisture),
      }
      
      const token = localStorage.getItem("kisanai_token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      
      const { data } = await axios.post(`${API}/api/soil/analyze`, payload, { headers })
      setResult(data)
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || "Analysis failed. Check your inputs and try again."
      if (error.response?.status === 429) {
        toast.error('Daily AI limit reached. Please try again tomorrow or contact support.', 
          { duration: 6000 })
      } else {
        toast.error(errorMsg, { duration: 4000 })
      }
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name: "nitrogen",   label: "Nitrogen (N)",   unit: "kg/ha", placeholder: "e.g. 40" },
    { name: "phosphorus", label: "Phosphorus (P)", unit: "kg/ha", placeholder: "e.g. 20" },
    { name: "potassium",  label: "Potassium (K)",  unit: "kg/ha", placeholder: "e.g. 30" },
    { name: "ph",         label: "Soil pH",        unit: "0–14",  placeholder: "e.g. 6.5" },
    { name: "moisture",   label: "Moisture",       unit: "%",     placeholder: "e.g. 45" },
  ]

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="section-heading">Soil Health Advisor</h1>
          <p className="text-white/50 mb-8">Enter your soil test values to get fertilizer and crop recommendations.</p>
        </motion.div>

        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }} className="card-glass p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {fields.map(f => (
              <div key={f.name}>
                <label className="block text-xs text-white/50 mb-1">{f.label} <span className="text-white/30">({f.unit})</span></label>
                <input name={f.name} value={form[f.name]} onChange={handleChange} required
                  type="number" step="0.1" placeholder={f.placeholder}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-kisan-green-light" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs text-white/50 mb-1">Desired Crop</label>
              <input name="crop_type" value={form.crop_type} onChange={handleChange} required
                placeholder="e.g. Wheat, Rice, Cotton"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-kisan-green-light" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Location (State/District)</label>
              <input name="location" value={form.location} onChange={handleChange} required
                placeholder="e.g. Punjab, Andhra Pradesh"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-kisan-green-light" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Soil...</>
              : <><FlaskConical className="w-4 h-4" /> Analyze My Soil</>}
          </button>
        </motion.form>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} className="space-y-4">

              {/* Overall health */}
              <div className="card-glass p-6 flex items-center justify-between">
                <div>
                  <p className="text-white/50 text-sm mb-1">Soil Health</p>
                  <p className={`font-display text-3xl font-bold ${HEALTH_COLORS[result.soil_health]}`}>
                    {result.soil_health}
                  </p>
                  <p className="text-white/40 text-sm mt-1">{result.ph_status} soil • {result.crop_suitability} suitability for {form.crop_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-xs mb-1">Estimated Yield</p>
                  <p className="text-kisan-gold font-semibold">{result.estimated_yield}</p>
                </div>
              </div>

              {/* Deficiencies */}
              {result.deficiencies?.length > 0 && (
                <div className="card-glass p-6">
                  <p className="text-white/50 text-sm mb-3">Nutrient Deficiencies</p>
                  <div className="flex flex-wrap gap-2">
                    {result.deficiencies.map((d, i) => (
                      <span key={i} className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs px-3 py-1 rounded-full">{d}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fertilizer recommendations */}
              <div className="card-glass p-6">
                <h3 className="font-display text-lg font-semibold text-kisan-gold mb-4 flex items-center gap-2">
                  <Sprout className="w-4 h-4" /> Fertilizer Recommendations
                </h3>
                <div className="space-y-3">
                  {result.fertilizer_recommendation?.map((f, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white">{f.name}</span>
                        <span className="text-kisan-gold text-sm">{f.quantity}</span>
                      </div>
                      <p className="text-white/40 text-xs">{f.timing}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best crops + tips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card-glass p-6">
                  <p className="text-white/50 text-sm mb-3">Best Crops for Your Soil</p>
                  <div className="flex flex-wrap gap-2">
                    {result.best_crops?.map((c, i) => (
                      <span key={i} className="bg-kisan-green/30 text-kisan-green-light text-sm px-3 py-1 rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="card-glass p-6">
                  <p className="text-white/50 text-sm mb-3">Improvement Tips</p>
                  <ul className="space-y-2">
                    {result.improvement_tips?.map((t, i) => (
                      <li key={i} className="text-white/70 text-sm flex gap-2">
                        <span className="w-1.5 h-1.5 bg-kisan-green-light rounded-full mt-1.5 flex-shrink-0" />{t}
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
