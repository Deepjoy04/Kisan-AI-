import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Send, Loader2, Globe } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"
import { API_BASE_URL } from "../config/api"

const API = API_BASE_URL

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "te", label: "తెలుగు" },
  { code: "ta", label: "தமிழ்" },
]

const QUICK_QUESTIONS = {
  en: ["My tomatoes have yellow spots", "Best fertilizer for wheat", "When to sow rice?"],
  hi: ["मेरे टमाटर में पीले धब्बे हैं", "गेहूं के लिए सबसे अच्छी खाद", "धान कब बोएं?"],
  te: ["నా టమాటాలపై పసుపు మచ్చలు", "గోధుమకు ఉత్తమ ఎరువు", "వరి ఎప్పుడు నాటాలి?"],
  ta: ["என் தக்காளியில் மஞ்சள் புள்ளிகள்", "கோதுமைக்கு சிறந்த உரம்", "நெல் எப்போது விதைக்கணும்?"],
}

export default function ChatBot() {
  const [messages,  setMessages]  = useState([
    { role: "assistant", content: "Namaste! I'm KisanAI. Ask me anything about your crops, soil, or farming — in any language! 🌾" }
  ])
  const [input,     setInput]     = useState("")
  const [language,  setLanguage]  = useState("en")
  const [loading,   setLoading]   = useState(false)
  const [isListening, setIsListening] = useState(false)
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)

  const LANG_CODES = {
    en: 'en-IN',
    hi: 'hi-IN',
    te: 'te-IN',
    ta: 'ta-IN',
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Voice not supported in this browser. Use Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = LANG_CODES[language] || 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
      // Auto send after short delay
      setTimeout(() => sendMessage(transcript), 600)
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      if (event.error === 'no-speech') {
        toast.error('No speech detected. Please try again.')
      } else if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow mic in browser settings.')
      } else if (event.error === 'service-not-allowed') {
        toast.error('Speech Recognition not available. Please check browser settings or enable Web Speech API.')
      } else if (event.error === 'network') {
        toast.error('Network error. Check your internet connection.')
      } else {
        toast.error('Voice error: ' + event.error)
      }
    }

    recognition.onend = () => setIsListening(false)

    try {
      recognition.start()
    } catch (e) {
      toast.error('Could not start voice recording.')
    }
  }

  const stopVoice = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: msg }])
    setLoading(true)

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      
      const token = localStorage.getItem("kisanai_token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      
      const { data } = await axios.post(`${API}/api/chat/message`, { message: msg, language, history }, { headers })
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || "Failed to get response. Please try again."
      if (error.response?.status === 429) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: "Daily AI limit reached. Please try again tomorrow or contact support." 
        }])
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${errorMsg}` }])
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-6 px-6 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="section-heading">Ask KisanAI</h1>
          <p className="text-white/50 mb-4">Get expert farming advice in your language</p>

          {/* Language selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <Globe className="w-4 h-4 text-white/40" />
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => setLanguage(l.code)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${language === l.code
                  ? "bg-kisan-green text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
                {l.label}
              </button>
            ))}
          </div>
          
          {/* Voice hint */}
          <p className="text-white/30 text-xs mt-2 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            </svg>
            Tap the mic button and speak in your selected language — no typing needed
          </p>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 card-glass p-4 mb-4 overflow-y-auto max-h-[50vh] space-y-3">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-kisan-green text-white rounded-br-sm"
                  : "bg-white/10 text-white/90 rounded-bl-sm"
              }`}>
                {m.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-sm">
                <Loader2 className="w-4 h-4 text-kisan-green-light animate-spin" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick questions */}
        <div className="flex gap-2 flex-wrap mb-3">
          {QUICK_QUESTIONS[language]?.map((q, i) => (
            <button key={i} onClick={() => sendMessage(q)}
              className="text-xs bg-white/5 border border-white/10 text-white/60 px-3 py-1.5 rounded-full hover:bg-white/10 transition-all">
              {q}
            </button>
          ))}
        </div>

        {/* Listening status */}
        {isListening && (
          <div className="flex items-center gap-2 mb-2 px-2">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs font-medium">
              Listening in {LANGUAGES.find(l => l.code === language)?.label}... speak now
            </span>
            <span className="text-white/30 text-xs ml-auto">tap mic to stop</span>
          </div>
        )}

        {/* Input with Voice */}
        <div className="flex gap-2 items-center">
          {/* Mic Button */}
          <button
            onClick={isListening ? stopVoice : startVoice}
            className={`relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border
              ${isListening
                ? 'bg-red-500/20 border-red-500 text-red-400 scale-110'
                : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20 hover:text-white'
              }`}
            title={isListening ? 'Stop recording' : 'Speak your question'}
          >
            {/* Pulsing ring when listening */}
            {isListening && (
              <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-60" />
            )}
            {/* Mic icon SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isListening
                ? <><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></>
                : <><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></>
              }
            </svg>
          </button>

          {/* Text input */}
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={isListening
              ? '🎤 Listening...'
              : language === 'hi' ? 'अपना सवाल लिखें या बोलें...'
              : language === 'te' ? 'మీ ప్రశ్న రాయండి లేదా చెప్పండి...'
              : language === 'ta' ? 'உங்கள் கேள்வியை தட்டச்சு செய்யுங்கள்...'
              : 'Type or speak your question...'
            }
            className={`flex-1 bg-white/10 border rounded-full px-5 py-3 text-white text-sm
              placeholder-white/30 focus:outline-none transition-all duration-300
              ${isListening
                ? 'border-red-400/50 bg-red-500/10'
                : 'border-white/20 focus:border-kisan-green-light'
              }`}
          />

          {/* Send Button */}
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="btn-primary px-4 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
