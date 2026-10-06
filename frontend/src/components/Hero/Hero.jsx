import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { ArrowRight, Sprout } from "lucide-react"

function SeedParticles() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    const seeds = Array.from({ length: 20 }, (_, i) => {
      const el = document.createElement("div")
      el.className = "seed-particle"
      el.style.cssText = `
        left: ${Math.random() * 100}%;
        animation-duration: ${6 + Math.random() * 8}s;
        animation-delay: ${Math.random() * 8}s;
        transform: scale(${0.5 + Math.random()});
        opacity: 0;
      `
      container.appendChild(el)
      return el
    })
    return () => seeds.forEach(s => s.remove())
  }, [])

  return <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none" />
}

const stats = [
  { value: "140M+", label: "Farmers in India" },
  { value: "30%",   label: "Crop loss preventable" },
  { value: "3sec",  label: "AI diagnosis time" },
]

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-kisan-dark via-kisan-green/20 to-kisan-dark" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-kisan-green/10 via-transparent to-transparent" />

      <SeedParticles />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-kisan-green/20 border border-kisan-green-light/30 rounded-full px-4 py-2 mb-8">
          <Sprout className="w-4 h-4 text-kisan-green-light" />
          <span className="text-kisan-green-light text-sm font-medium">AI-Powered Farming Assistant</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="font-display text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Your Crop's Doctor,{" "}
          <span className="text-kisan-gold">Always Available</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload a photo of your crop. Get instant AI diagnosis, treatment advice, and
          soil recommendations — in your language, in seconds.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link to="/disease" className="btn-primary flex items-center justify-center gap-2 text-base">
            Detect Crop Disease <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/chat" className="btn-outline flex items-center justify-center gap-2 text-base">
            Ask in Hindi / Telugu
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }} className="text-center">
              <div className="font-display text-3xl font-bold text-kisan-gold">{s.value}</div>
              <div className="text-white/50 text-xs mt-1">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absoxlute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-kisan-dark to-transparent" />
    </section>
  )
}
