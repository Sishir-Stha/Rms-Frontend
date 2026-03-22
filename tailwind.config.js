/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map Tailwind classes to CSS variables for both themes
        surface: 'var(--surface)',
        'surface-dim': 'var(--surface-dim)',
        'surface-bright': 'var(--surface-bright)',
        'surface-container-lowest': 'var(--surface-container-lowest)',
        'surface-container-low': 'var(--surface-container-low)',
        'surface-container': 'var(--surface-container)',
        'surface-container-high': 'var(--surface-container-high)',
        'surface-container-highest': 'var(--surface-container-highest)',
        'on-surface': 'var(--on-surface)',
        'on-surface-variant': 'var(--on-surface-variant)',
        primary: 'var(--primary)',
        'primary-dim': 'var(--primary-dim)',
        'on-primary': 'var(--on-primary)',
        'primary-container': 'var(--primary-container)',
        secondary: 'var(--secondary)',
        'secondary-container': 'var(--secondary-container)',
        'on-secondary': 'var(--on-secondary)',
        'on-secondary-container': 'var(--on-secondary-container)',
        outline: 'var(--outline)',
        'outline-variant': 'var(--outline-variant)',
        error: 'var(--error)',
        'error-container': 'var(--error-container)',
        warning: 'var(--warning)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        ambient: '0 20px 40px var(--shadow)',
        card: '0 1px 3px var(--shadow)',
        '3d': '0 20px 60px var(--shadow)',
        'glow-green': '0 0 20px rgba(98,223,125,0.3)',
      },
    },
  },
  plugins: [],
}
