import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'cream-bg': '#FFFDF8',
        'pastel-blue': '#D6E6F2',
        'pastel-purple': '#E8D5F2',
        'warm-green': '#4CAF50',
        'bright-accent': '#6366F1',
        'text-dark': '#1F2937',
        'text-light': '#6B7280',
        border: '#E5E7EB',
        muted: '#F3F4F6',
      },
    },
  },
  plugins: [],
}

export default config
