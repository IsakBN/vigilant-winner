import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'cream-bg': '#FEFBF6',
        'pastel-blue': '#A7D9FF',
        'soft-yellow': '#FFEAA7',
        'warm-green': '#C8E6C9',
        'bright-accent': '#5E7CFF',
        'text-dark': '#333333',
        'text-light': '#666666',
      },
      fontFamily: {
        heading: ['Nunito', 'sans-serif'],
        body: ['Quicksand', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        xl: '1.5rem',
        '2xl': '2rem',
        '3xl': '3rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}

export default config
