/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Instrument Serif', 'serif'],
        body: ['Barlow', 'sans-serif'],
        script: ['Great Vibes', 'cursive'],
      },
      borderRadius: { DEFAULT: '9999px' },
    },
  },
  plugins: [],
}
