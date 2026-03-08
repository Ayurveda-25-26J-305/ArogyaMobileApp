module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./utils/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ayurveda: {
          primary: '#2d5016',
          secondary: '#4a7c2c',
          tertiary: '#6a8759',
          vata: '#a8b5c8',
          pitta: '#e67e73',
          kapha: '#8bc34a',
        },
      },
    },
  },
  plugins: [],
};