import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MapPin, Thermometer, Droplets, Wind, Loader2 } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"
import { API_BASE_URL } from "../config/api"

const API = API_BASE_URL

const CROP_ADVICE = {
  rain:  "Good time to sow seeds. Ensure proper drainage to avoid waterlogging.",
  hot:   "Water your crops early morning or evening. Avoid spraying pesticides.",
  cold:  "Protect young plants from frost. Delay sowing if temp below 10°C.",
  ideal: "Ideal conditions for most crops. Good time for fertilizer application.",
}

function getCropAdvice(weather) {
  const desc = weather?.description?.toLowerCase() || ""
  if (desc.includes("rain") || desc.includes("drizzle")) return CROP_ADVICE.rain
  if (weather?.temp > 35) return CROP_ADVICE.hot
  if (weather?.temp < 15) return CROP_ADVICE.cold
  return CROP_ADVICE.ideal
}

export default function Weather() {
  const [weather,   setWeather]   = useState(null)
  const [forecast,  setForecast]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [locating,  setLocating]  = useState(false)

  const fetchWeather = async (lat, lon) => {
    setLoading(true)
    try {
      const [curr, fore] = await Promise.all([
        axios.get(`${API}/api/weather/current`, { params: { lat, lon } }),
        axios.get(`${API}/api/weather/forecast`, { params: { lat, lon } }),
      ])
      setWeather(curr.data)
      setForecast(fore.data.forecast)
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || "Could not fetch weather. Check API key."
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const getLocation = () => {
    setLocating(true)
    if (!navigator.geolocation) {
      // fallback to Delhi
      fetchWeather(28.6139, 77.2090); setLocating(false); return
    }
    navigator.geolocation.getCurrentPosition(
      pos => { fetchWeather(pos.coords.latitude, pos.coords.longitude); setLocating(false) },
      ()  => {
        toast.error("Location denied — showing Delhi weather.")
        fetchWeather(28.6139, 77.2090)   // fallback: Delhi
        setLocating(false)
      },
      { timeout: 6000 }
    )
  }

  useEffect(() => { getLocation() }, [])

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="section-heading">Weather & Crop Calendar</h1>
          <p className="text-white/50 mb-8">Location-based weather with farming advice.</p>
        </motion.div>

        {(loading || locating) && (
          <div className="flex items-center justify-center py-20 gap-3 text-white/50">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{locating ? "Getting your location..." : "Fetching weather..."}</span>
          </div>
        )}

        {weather && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Current weather */}
            <div className="card-glass p-6">
              <div className="flex items-center gap-2 text-white/40 text-sm mb-4">
                <MapPin className="w-4 h-4" />{weather.city}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="font-display text-7xl font-bold text-white">
                    {Math.round(weather.temp)}°
                  </div>
                  <div className="text-white/50 capitalize mt-1">{weather.description}</div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="flex items-center gap-2 justify-end text-white/60 text-sm">
                    <Droplets className="w-4 h-4" /> {weather.humidity}% humidity
                  </div>
                  <div className="flex items-center gap-2 justify-end text-white/60 text-sm">
                    <Wind className="w-4 h-4" /> {weather.wind_speed} m/s wind
                  </div>
                </div>
              </div>
            </div>

            {/* Farming advice */}
            <div className="bg-kisan-green/20 border border-kisan-green-light/30 rounded-2xl p-4">
              <p className="text-kisan-green-light text-sm font-medium mb-1">Farming Advice Today</p>
              <p className="text-white/70 text-sm">{getCropAdvice(weather)}</p>
            </div>

            {/* 5-day forecast */}
            <div className="card-glass p-6">
              <h3 className="font-display text-lg font-semibold text-white mb-4">5-Day Forecast</h3>
              <div className="grid grid-cols-5 gap-2">
                {forecast.map((day, i) => (
                  <div key={i} className="text-center bg-white/5 rounded-xl p-3">
                    <p className="text-white/40 text-xs mb-2">
                      {new Date(day.date).toLocaleDateString("en-IN", { weekday: "short" })}
                    </p>
                    <p className="text-white font-medium text-sm">{Math.round(day.temp_max)}°</p>
                    <p className="text-white/40 text-xs">{Math.round(day.temp_min)}°</p>
                    <p className="text-blue-400 text-xs mt-1">{Math.round(day.rain_chance)}%</p>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={getLocation} className="btn-outline w-full flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" /> Refresh Location
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
