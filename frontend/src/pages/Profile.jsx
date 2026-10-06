import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Activity, Clock, LogOut, User } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { API_BASE_URL } from "../config/api"

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }
    const token = localStorage.getItem("kisanai_token")
    fetch(`${API_BASE_URL}/api/auth/history`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setHistory(data.history || []))
      .catch(() => toast.error("Failed to load history"))
      .finally(() => setLoading(false))
  }, [user, navigate])

  const handleLogout = () => {
    logout()
    toast.success("Logged out successfully")
    navigate("/")
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 max-w-5xl mx-auto relative z-10">
      <div className="bg-kisan-darker/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-tr from-kisan-green to-kisan-green-light rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
            {user?.name?.[0]?.toUpperCase() || "K"}
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-1">{user?.name}</h1>
            <p className="text-white/60 flex items-center gap-2">
              <User className="w-4 h-4" /> {user?.email}
            </p>
          </div>
        </div>
        <button onClick={handleLogout} className="px-6 py-2.5 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all font-medium flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="bg-kisan-darker/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
          <Activity className="text-kisan-green-light" /> Your Activity History
        </h2>
        
        {history.length === 0 ? (
          <p className="text-white/60 text-center py-12">No activity recorded yet. Start exploring KisanAI!</p>
        ) : (
          <div className="space-y-4">
            {history.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                key={item._id} 
                className="bg-black/30 border border-white/5 rounded-2xl p-5 hover:border-white/15 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-kisan-gold">{item.action}</h3>
                  <span className="text-xs text-white/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-white/70 text-sm space-y-1">
                  {Object.entries(item.details).map(([k, v]) => (
                    <p key={k}><strong className="capitalize text-white/90">{k.replace("_", " ")}:</strong> {v}</p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
