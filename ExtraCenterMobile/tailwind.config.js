/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./global.css"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#3086CC',
        secondary: '#73CEC9',
        accent: '#F5360B',
        foreground: '#46587D',
        background: '#FFFFFF',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}