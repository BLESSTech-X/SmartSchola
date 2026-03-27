export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0B1D3A', light: '#122850', dark: '#071326' },
        gold: { DEFAULT: '#F5A623', light: '#F7B84B', dark: '#D4891A' }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif']
      }
    }
  },
  plugins: []
}
