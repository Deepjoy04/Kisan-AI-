import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  BarChart,
  MapPin
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

  useEffect(() => {
    fetchMarketData(selectedCrop);
  }, [selectedCrop]);

  const fetchMarketData = async (crop) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/market/prices?commodity=${crop}`);
      if (!res.ok) throw new Error("Failed to fetch data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      // Fallback empty UI will be handled by data || null
    } finally {
      setLoading(false);
    }
  };

  const isPositiveTrend = data?.trend_percentage >= 0;

  return (
    <div className="min-h-screen pt-24 px-6 relative z-10 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Market Price Tracker</h1>
          <p className="text-white/70">Track real-time Mandi prices to sell at the right time.</p>
        </div>
        
        <select 
          value={selectedCrop}
          onChange={(e) => setSelectedCrop(e.target.value)}
          className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-kisan-green-light min-w-[200px]"
        >
          {COMMODITIES.map(c => (
            <option key={c} value={c} className="bg-kisan-dark text-white">{c}</option>
          ))}
        </select>
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
          <div className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            <p>{data.trend_note || "Trend is derived from available market snapshot data."}</p>
            <p className="mt-1 text-yellow-100/80">
              Source: {data.data_source === "fallback_sample" ? "Fallback sample data" : "Data.gov.in live snapshot"}
            </p>
          </div>

          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-start mb-2">
                <span className="text-white/70 text-sm font-medium">Average Price (Today)</span>
                <div className="w-10 h-10 rounded-full bg-kisan-green/20 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-kisan-green-light" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">₹{data.average_price.toLocaleString()}</span>
                <span className="text-white/50 text-sm">/quintal</span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-start mb-2">
                <span className="text-white/70 text-sm font-medium">Price Trend (7 Days)</span>
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
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-start mb-2">
                <span className="text-white/70 text-sm font-medium">Best Market</span>
                <div className="w-10 h-10 rounded-full bg-kisan-gold/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-kisan-gold" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold text-white truncate max-w-full" title={data.best_market.market}>
                  {data.best_market.market.split("(")[0]}
                </span>
              </div>
              <p className="text-white/50 text-sm">₹{data.best_market.price.toLocaleString()}/quintal</p>
            </div>
          </div>

          {/* Main Grid: Chart & Top Markets List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart */}
            <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-semibold text-white mb-6">Price History (Last 7 Days)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.history} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
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
                      itemStyle={{ color: "#A8E6CF" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#A8E6CF" 
                      strokeWidth={3} 
                      dot={{ fill: "#1A2E1A", stroke: "#A8E6CF", strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 6, fill: "#A8E6CF" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Markets Table */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl overflow-hidden flex flex-col">
              <h3 className="text-xl font-semibold text-white mb-4">Top Markets Today</h3>
              
              <div className="grid grid-cols-4 text-sm text-white/50 mb-3 px-2">
                <div className="col-span-3">Market</div>
                <div className="text-right">Price</div>
              </div>
              
              <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 -mr-2">
                <div className="space-y-4">
                  {data.top_markets.map((m, idx) => (
                    <div key={idx} className="grid grid-cols-4 items-center border-b border-white/5 pb-3 px-2">
                      <div className="col-span-3 pr-2">
                        <p className="text-white font-medium truncate" title={m.market}>{m.market}</p>
                        <div className={`text-xs flex items-center mt-0.5 ${m.change >= 0 ? 'text-kisan-green-light' : 'text-kisan-earth-light'}`}>
                          {m.change >= 0 ? '+' : ''}{m.change}% 
                          {m.change >= 0 ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />}
                        </div>
                      </div>
                      <div className="text-right font-bold text-white">
                        ₹{m.price}
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
