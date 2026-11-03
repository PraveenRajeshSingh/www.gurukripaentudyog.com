import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#C8460A',
          dark: '#8B2E05',
          amber: '#F5A623',
          glow: 'rgba(200, 70, 10, 0.08)',
          light: '#FBEAE0'
        },
        surface: {
          bg: '#FAFAF9',
          card: '#FFFFFF',
          subtle: '#F5F0EC',
          muted: '#ECE5DE'
        },
        ink: {
          primary: '#1C1009',
          secondary: '#4A3728',
          tertiary: '#6B5545'
        },
        semantic: {
          success: '#15803D',
          warning: '#B45309',
          danger: '#B91C1C',
          info: '#0369A1'
        }
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '16px',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        slideUp: 'slideUp 180ms ease-out',
        fadeIn: 'fadeIn 150ms ease-out',
      }
    },
  },
  plugins: [],
};

export default config;
