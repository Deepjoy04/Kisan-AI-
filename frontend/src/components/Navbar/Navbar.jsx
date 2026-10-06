import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Leaf, Menu, X, User } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

const links = [
  { to: "/disease", label: "Crop Doctor" },
  { to: "/soil",    label: "Soil Advisor" },
  { to: "/chat",    label: "Ask KisanAI" },
  { to: "/weather", label: "Weather" },
  { to: "/market",  label: "Market Prices" },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { user } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-kisan-dark/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-kisan-gold">
          <Leaf className="w-5 h-5 text-kisan-green-light" />
          KisanAI
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${pathname === l.to
                  ? "bg-kisan-green text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"}`}>
              {l.label}
            </Link>
          ))}
          <div className="w-px h-5 bg-white/20 mx-2" />
          {user ? (
            <Link to="/profile" className="px-5 py-2 rounded-full text-sm font-medium bg-kisan-green-light/20 border border-kisan-green-light text-white hover:bg-kisan-green transition-all shadow-md flex items-center gap-2">
              <User className="w-4 h-4" /> {user.name}
            </Link>
          ) : (
            <Link to="/login" className="px-5 py-2 rounded-full text-sm font-medium bg-kisan-gold text-kisan-dark hover:bg-white transition-all shadow-md">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-kisan-dark border-b border-white/10 px-6 pb-4">
            {links.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className="block py-3 text-white/80 hover:text-white border-b border-white/5">
                {l.label}
              </Link>
            ))}
            <div className="pt-4 pb-2">
              {user ? (
                <Link to="/profile" onClick={() => setOpen(false)} className="block w-full text-center px-5 py-2.5 rounded-xl font-medium bg-kisan-green border border-kisan-green-light text-white transition-all shadow-md flex items-center justify-center gap-2">
                  <User className="w-4 h-4" /> Profile
                </Link>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} className="block w-full text-center px-5 py-2.5 rounded-xl font-medium bg-kisan-gold text-kisan-dark hover:bg-white transition-all shadow-md">
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
