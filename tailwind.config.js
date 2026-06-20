/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F9FB',
        bordergray: '#C6C6CD',
        accentblue: '#D5E3FD',
        darknavy: '#0D1C2F',
      }
    },
  },
  plugins: [],
}
