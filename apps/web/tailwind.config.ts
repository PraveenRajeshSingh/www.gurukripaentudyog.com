import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.25rem',
        lg: '1.5rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
    },
    extend: {
      screens: {
        xs: '375px',
        '3xl': '1920px',
      },
      colors: {
        brand: {
          DEFAULT: '#A83226',
          dark: '#7F241C',
          amber: '#D66A45',
          glow: 'rgba(168, 50, 38, 0.08)',
          light: '#F6E8E5',
        },
        surface: {
          bg: '#F8F7F4',
          card: '#FFFFFF',
          subtle: '#F1EEE8',
          muted: '#E8E4DD',
        },
        ink: {
          primary: '#252525',
          secondary: '#3F3F46',
          tertiary: '#6B7280',
        },
        semantic: {
          success: '#198754',
          warning: '#E6A23C',
          danger: '#DC3545',
          info: '#0369A1',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
        body: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '22px',
      },
      boxShadow: {
        card: '0 2px 16px rgba(37, 37, 37, 0.07)',
        hover: '0 10px 36px rgba(168, 50, 38, 0.14)',
        modal: '0 28px 72px rgba(0, 0, 0, 0.22)',
      },
      maxWidth: {
        content: '72rem',
        'content-wide': '80rem',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0.6' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        slideUp: 'slideUp 180ms ease-out',
        slideInRight: 'slideInRight 200ms ease-out',
        fadeIn: 'fadeIn 150ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
