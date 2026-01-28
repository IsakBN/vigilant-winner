import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'cream-bg': '#FEFBF6',
        'pastel-purple': '#E8D5F2',
        'admin-accent': '#7C3AED',
        'admin-accent-dark': '#6D28D9',
        'text-dark': '#1F2937',
        'text-light': '#6B7280',
      },
      fontFamily: {
        heading: ['Nunito', 'sans-serif'],
        body: ['Quicksand', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}

export default config
