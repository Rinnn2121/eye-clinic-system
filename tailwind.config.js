/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'clinic-primary': '#2c7da0',
        'clinic-secondary': '#61a5c2',
        'clinic-success': '#2ecc71',
        'clinic-danger': '#e74c3c',
      }
    },
  },
  plugins: [],
}
