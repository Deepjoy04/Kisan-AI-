import { Link } from "react-router-dom"
import { motion } from "framer-motion"

export default function NotFound() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full text-center card-glass p-10"
      >
        <p className="text-kisan-gold text-sm tracking-wider uppercase mb-3">404</p>
        <h1 className="font-display text-4xl text-white font-bold mb-3">Page Not Found</h1>
        <p className="text-white/60 mb-8">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-kisan-green px-6 py-3 text-white font-medium hover:bg-kisan-green-light transition-colors"
        >
          Go to Home
        </Link>
      </motion.div>
    </div>
  )
}
