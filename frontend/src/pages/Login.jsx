import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, ArrowRight, Leaf, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"
import { API_BASE_URL } from "../config/api"

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password || (!isLogin && !name)) {
      toast.error("Please fill in all fields")
      return
    }
    
    setLoading(true)
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register"
    const payload = isLogin ? { email, password } : { email, password, name }
    
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed")
      }
      
      login(data.token, { email, name: data.name })
      toast.success(isLogin ? "Welcome back to KisanAI!" : "Account created successfully!")
      navigate("/")
      
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-10 flex items-center justify-center px-6 relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-kisan-green/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-kisan-gold/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <div className="mx-auto w-12 h-12 bg-kisan-green-light/20 rounded-full flex items-center justify-center mb-4">
            <Leaf className="w-6 h-6 text-kisan-green-light" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">{isLogin ? "Welcome Back" : "Join KisanAI"}</h2>
          <p className="text-white/60">{isLogin ? "Sign in to your account" : "Create an account to track your crops"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <label className="block text-sm font-medium text-white/80 mb-1.5 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-kisan-green-light/50 transition-all"
                    placeholder="Ramesh Kumar" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-kisan-green-light/50 transition-all"
                placeholder="farmer@kisanai.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-kisan-green-light/50 transition-all"
                placeholder="••••••••" />
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}
            type="submit" className="w-full bg-gradient-to-r from-kisan-green to-kisan-green-light text-white font-medium py-3.5 rounded-xl shadow-lg shadow-kisan-green/30 flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50">
            {loading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")} <ArrowRight className="w-4 h-4" />
          </motion.button>
        </form>

        <p className="text-center text-sm text-white/60 mt-8 relative z-10">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-kisan-green-light hover:text-white font-medium transition-colors" type="button">
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
