/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        kisan: {
          green:       "#1a5c2e",
          "green-mid": "#2d7a45",
          "green-light":"#4aab67",
          earth:       "#8B5E3C",
          gold:        "#E6A817",
          cream:       "#FDF6E3",
          dark:        "#0d2b18",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body:    ["'DM Sans'", "sans-serif"],
      },
      animation: {
        "float":     "float 6s ease-in-out infinite",
        "pulse-slow":"pulse 4s ease-in-out infinite",
        "seed-fall": "seedFall 8s linear infinite",
      },
      keyframes: {
        float:    { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-20px)" } },
        seedFall: { "0%": { transform: "translateY(-10px) rotate(0deg)", opacity: 0 }, "10%": { opacity: 1 }, "90%": { opacity: 1 }, "100%": { transform: "translateY(100vh) rotate(360deg)", opacity: 0 } },
      },
    },
  },
  plugins: [],
}
