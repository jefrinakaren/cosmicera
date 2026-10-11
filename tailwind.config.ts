import type { Config } from 'tailwindcss'

// Every colour below comes from the CSS variables at the top of app/globals.css.
// To re-theme the whole app, change those variables - nothing else.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          600: v('bg-600'),
          700: v('bg-700'),
          800: v('bg-800'),
          900: v('bg-900'),
        },
        // "cyan" is the accent colour used all over the app (now aurora green)
        cyan: {
          300: v('accent-300'),
          400: v('accent-400'),
          500: v('accent-500'),
          600: v('accent-600'),
          700: v('accent-700'),
        },
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        glow: 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgb(var(--accent-500) / 0.45)' },
          '50%': { boxShadow: '0 0 40px rgb(var(--accent-500) / 0.75)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
