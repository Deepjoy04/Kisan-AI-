import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  BarChart,
  MapPin,
  Navigation,
  Sparkles,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../config/api";

const COMMODITIES = [
  "Tomato", "Potato", "Onion", "Garlic", 
  "Ginger(Green)", "Apple", "Banana", "Chikoos(Sapota)", "Cotton"
];

export default function MarketTracker() {
  const [selectedCrop, setSelectedCrop] = useState("Tomato");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [viewMode, setViewMode] = useState("top"); // "top" | "nearest"

  useEffect(() => {
    fetchMarketData(selectedCrop, userLocation);
  }, [selectedCrop, userLocation]);

  const fetchMarketData = async (crop, coords = null) => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/market/prices?commodity=${encodeURIComponent(crop)}`;
      if (coords?.lat && coords?.lon) {
        url += `&lat=${coords.lat}&lon=${coords.lon}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setUserLocation(coords);
        setViewMode("nearest");
        setLocating(false);
      },
      (err) => {
        console.warn("Location error:", err);
        setLocating(false);
        // Fallback default coordinates (e.g. New Delhi)
        const defaultCoords = { lat: 28.6139, lon: 77.2090 };
        setUserLocation(defaultCoords);
        setViewMode("nearest");
      },
      { timeout: 10000 }
    );
  };

  const isPositiveTrend = data?.trend_percentage >= 0;

  // Combine 7-day history and 3-day forecast for the chart
  const combinedChartData = data ? [
    ...(data.history || []).map(h => ({
      day: h.day,
      historicalPrice: h.price,
      projectedPrice: null
    })),
    ...(data.forecast || []).map((f, i) => ({
      day: f.day,
      historicalPrice: i === 0 ? (data.history?.slice(-1)[0]?.price || null) : null,
      projectedPrice: f.projected_price
    }))
  ] : [];

  const displayMarkets = (viewMode === "nearest" && data?.nearest_markets?.length > 0)
    ? data.nearest_markets
    : (data?.top_markets || []);

  return (
    <div className="min-h-screen pt-24 px-6 relative z-10 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-display font-bold text-white">Market Intelligence & Mandi Tracker</h1>
            <span className="text-xs bg-kisan-green/30 text-kisan-green-light border border-kisan-green/40 px-2 py-0.5 rounded-full font-semibold">
              Live & Predictive
            </span>
          </div>
          <p className="text-white/70">Real-time APMC Mandi price discovery, distance sorting & AI harvesting advisory.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDetectLocation}
            disabled={locating}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              userLocation 
                ? "bg-kisan-green/30 border-kisan-green text-kisan-green-light shadow-lg" 
                : "bg-white/10 border-white/20 text-white hover:bg-white/15"
            }`}
          >
            <Navigation className={`w-4 h-4 ${locating ? "animate-spin" : ""}`} />
            {locating ? "Locating..." : userLocation ? "📍 Near Me Active" : "Find Nearest Mandis"}
          </button>

          <select 
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-kisan-green-light min-w-[180px]"
          >
            {COMMODITIES.map(c => (
              <option key={c} value={c} className="bg-kisan-dark text-white">{c}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kisan-green-light"></div>
        </div>
      ) : data ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Smart AI Harvesting Advisory Banner */}
          {data.advisory && (
            <div className={`rounded-2xl border p-5 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              data.advisory.signal === "bullish"
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                : data.advisory.signal === "bearish"
                ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
                : "bg-blue-950/40 border-blue-500/40 text-blue-200"
            }`}>
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/10 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-base tracking-wide uppercase">
                      Smart Advisory: {data.advisory.recommendation}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-medium">
                      3-Day Outlook: {data.advisory.projected_change_pct > 0 ? "+" : ""}{data.advisory.projected_change_pct}%
                    </span>
                  </div>
                  <p className="text-sm opacity-90 leading-relaxed">{data.advisory.advisory}</p>
                </div>
              </div>
            </div>
          )}

          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-start mb-2">
                <span className="text-white/70 text-sm font-medium">Average Mandi Rate</span>
                <div className="w-10 h-10 rounded-full bg-kisan-green/20 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-kisan-green-light" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">₹{data.average_price.toLocaleString()}</span>
                <span className="text-white/50 text-sm">/quintal</span>
              </div>
              <p className="text-xs text-white/40 mt-2">Calculated cross-market modal price</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-start mb-2">
                <span className="text-white/70 text-sm font-medium">7-Day Momentum</span>
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <BarChart className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-bold ${isPositiveTrend ? "text-kisan-green-light" : "text-kisan-earth-light"}`}>
                  {isPositiveTrend ? "+" : ""}{data.trend_percentage}%
                </span>
                {isPositiveTrend ? <TrendingUp className="w-6 h-6 text-kisan-green-light" /> : <TrendingDown className="w-6 h-6 text-kisan-earth-light" />}
              </div>
              <p className="text-xs text-white/40 mt-2">Weekly price movement trajectory</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-start mb-2">
                <span className="text-white/70 text-sm font-medium">Highest Value Mandi</span>
                <div className="w-10 h-10 rounded-full bg-kisan-gold/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-kisan-gold" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold text-white truncate max-w-full" title={data.best_market.market}>
                  {data.best_market.market.split("(")[0]}
                </span>
              </div>
              <p className="text-white/70 text-sm">₹{data.best_market.price.toLocaleString()}/quintal</p>
            </div>
          </div>

          {/* Main Grid: Chart & Mandi Markets Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart: 7-Day History + 3-Day Forecast */}
            <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">Price Trajectory & AI Forecast</h3>
                  <p className="text-xs text-white/50">Historic 7-day trend followed by 3-day projection</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-emerald-400"></span>
                    <span className="text-white/70">Past 7 Days</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-sky-400 border-b border-dashed border-sky-400"></span>
                    <span className="text-white/70">3-Day Forecast</span>
                  </div>
                </div>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedChartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      stroke="rgba(255,255,255,0.4)" 
                      tick={{ fill: "rgba(255,255,255,0.6)" }} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.4)" 
                      tick={{ fill: "rgba(255,255,255,0.6)" }} 
                      axisLine={false} 
                      tickLine={false}
                      domain={['dataMin - 100', 'dataMax + 100']}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1A2E1A", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", color: "white" }} 
                      formatter={(val, name) => [`₹${val}/quintal`, name === "historicalPrice" ? "Historical Price" : "Projected Forecast"]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="historicalPrice" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ fill: "#1A2E1A", stroke: "#10b981", strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 6, fill: "#10b981" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="projectedPrice" 
                      stroke="#38bdf8" 
                      strokeWidth={3} 
                      strokeDasharray="5 5"
                      dot={{ fill: "#0369a1", stroke: "#38bdf8", strokeWidth: 2, r: 5 }} 
                      activeDot={{ r: 6, fill: "#38bdf8" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Markets Table with Distance Sorting & Filtering */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Mandi Rates</h3>
                <div className="flex bg-white/10 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setViewMode("top")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${viewMode === "top" ? "bg-kisan-green-light text-kisan-dark font-semibold" : "text-white/70"}`}
                  >
                    Highest
                  </button>
                  <button
                    onClick={() => {
                      if (!userLocation) handleDetectLocation();
                      else setViewMode("nearest");
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all ${viewMode === "nearest" ? "bg-kisan-green-light text-kisan-dark font-semibold" : "text-white/70"}`}
                  >
                    Nearest
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-4 text-xs text-white/50 mb-3 px-2">
                <div className="col-span-3">Market & Distance</div>
                <div className="text-right">Price</div>
              </div>
              
              <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 -mr-2 max-h-[310px]">
                <div className="space-y-3">
                  {displayMarkets.map((m, idx) => (
                    <div key={idx} className="grid grid-cols-4 items-center border-b border-white/5 pb-2.5 px-2 hover:bg-white/5 rounded-lg transition-colors">
                      <div className="col-span-3 pr-2">
                        <p className="text-white font-medium text-sm truncate" title={m.market}>{m.market}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {m.distance_km != null && (
                            <span className="text-xs bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded font-mono">
                              {m.distance_km} km away
                            </span>
                          )}
                          <span className={`text-xs flex items-center ${m.change >= 0 ? 'text-kisan-green-light' : 'text-kisan-earth-light'}`}>
                            {m.change >= 0 ? '+' : ''}{m.change}% 
                            {m.change >= 0 ? <TrendingUp className="w-3 h-3 ml-0.5" /> : <TrendingDown className="w-3 h-3 ml-0.5" />}
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-bold text-white text-sm">
                        ₹{m.price.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      ) : (
        <div className="py-20 text-center text-white/50">
          <p>No real-time market data available for {selectedCrop} right now.</p>
        </div>
      )}
    </div>
  );
}
