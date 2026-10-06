import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import Navbar from "./components/Navbar/Navbar"
import Home from "./pages/Home"
import DiseaseDetector from "./pages/DiseaseDetector"
import SoilAdvisor from "./pages/SoilAdvisor"
import ChatBot from "./pages/ChatBot"
import Weather from "./pages/Weather"
import Login from "./pages/Login"
import Profile from "./pages/Profile"
import MarketTracker from "./pages/MarketTracker"
import NotFound from "./pages/NotFound"
import SeedGrowAnimation from "./components/SeedGrowAnimation/SeedGrowAnimation"
import { AuthProvider } from "./context/AuthContext"

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <SeedGrowAnimation />
        <Toaster position="top-right" toastOptions={{ style: { background: "#1a5c2e", color: "#fff" } }} />
        <Navbar />
        <Routes>
          <Route path="/"         element={<Home />} />
          <Route path="/disease"  element={<DiseaseDetector />} />
          <Route path="/soil"     element={<SoilAdvisor />} />
          <Route path="/chat"     element={<ChatBot />} />
          <Route path="/weather"  element={<Weather />} />
          <Route path="/market"   element={<MarketTracker />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/profile"  element={<Profile />} />
          <Route path="*"         element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
