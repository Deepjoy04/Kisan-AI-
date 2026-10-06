import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import Hero from "../components/Hero/Hero"
import { Microscope, FlaskConical, MessageCircle, CloudSun, ArrowRight } from "lucide-react"

const features = [
  {
    icon:  Microscope,
    title: "Crop Disease Detector",
    desc:  "Upload a photo of your crop. AI identifies diseases instantly and gives a step-by-step treatment plan.",
    to:    "/disease",
    color: "text-red-400",
    bg:    "bg-red-500/10 border-red-500/20",
  },
  {
    icon:  FlaskConical,
    title: "Soil Health Advisor",
    desc:  "Enter your soil NPK values and get personalized fertilizer and crop rotation recommendations.",
    to:    "/soil",
    color: "text-amber-400",
    bg:    "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon:  MessageCircle,
    title: "Multilingual Chatbot",
    desc:  "Ask farming questions in Hindi, Telugu, Tamil or English. Get expert answers in your language.",
    to:    "/chat",
    color: "text-blue-400",
    bg:    "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon:  CloudSun,
    title: "Weather & Crop Calendar",
    desc:  "Real-time weather with sowing and harvesting recommendations based on your location.",
    to:    "/weather",
    color: "text-kisan-green-light",
    bg:    "bg-kisan-green/10 border-kisan-green/20",
  },
]

const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12 } }
}
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function Home() {
  return (
    <main>
      <Hero />

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="section-heading">Everything a farmer needs</h2>
            <p className="text-white/50 max-w-xl mx-auto">Four powerful AI tools built for real farming problems — accessible from any phone, in any language.</p>
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" whileInView="show"
            viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(f => (
              <motion.div key={f.to} variants={cardVariants}>
                <Link to={f.to}
                  className={`block card-glass p-6 border hover:scale-[1.02] transition-all duration-300 group ${f.bg}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.bg}`}>
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-4">{f.desc}</p>
                  <div className={`flex items-center gap-1 text-sm font-medium ${f.color} group-hover:gap-2 transition-all`}>
                    Try now <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Impact section */}
      <section className="py-20 px-6 bg-kisan-green/10 border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="section-heading">Built for Bharat's farmers</h2>
            <p className="text-white/50 max-w-2xl mx-auto mb-8">
              India has 140 million farming families. Most don't have access to an agronomist.
              KisanAI puts expert knowledge in every farmer's pocket — for free.
            </p>
            <Link to="/disease" className="btn-primary inline-flex items-center gap-2">
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 text-center text-white/30 text-sm">
        <p>KisanAI — AI-Powered Smart Agriculture Assistant • Built with React + FastAPI + Google Gemini</p>
      </footer>

    </main>
  )
}
