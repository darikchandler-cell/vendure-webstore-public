import colors from 'tailwindcss/colors';
import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  plugins: [require('@tailwindcss/forms')],
  important: '#app',

  theme: {
    extend: {
      colors: {
        primary: colors.sky,
        secondary: colors.emerald,
        // Glassmorphism colors
        'glass-bg': 'rgba(255, 255, 255, 0.1)',
        'glass-border': 'rgba(255, 255, 255, 0.2)',
        'glass-hover': 'rgba(255, 255, 255, 0.15)',
        // Premium dark theme
        'navy-dark': '#0f172a',
        'navy-darker': '#020617',
        'grey-dark': '#1e293b',
        'grey-darker': '#0f172a',
      },
      backdropBlur: {
        glass: '10px',
        'glass-strong': '20px',
      },
      fontFamily: {
        sans: [
          'Inter',
          'Montserrat',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        heading: [
          'Montserrat',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-hover': '0 12px 40px 0 rgba(31, 38, 135, 0.5)',
        'glass-inset': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.1)',
      },
      animation: {
        dropIn: 'dropIn 0.2s ease-out',
        'lift-glow': 'liftGlow 0.3s ease-out',
      },
      keyframes: {
        dropIn: {
          '0%': { transform: 'translateY(-100px)' },
          '100%': { transform: 'translateY(0)' },
        },
        liftGlow: {
          '0%': {
            transform: 'translateY(0)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          },
          '100%': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.5)',
          },
        },
      },
    },
  },
} satisfies Config;
