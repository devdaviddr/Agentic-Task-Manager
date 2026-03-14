/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#0D1220',
        panel: '#1A2438',
        primary: '#7DD3FC',
        secondary: '#88B4CC',
        tertiary: '#C8A0F0',
        danger: '#EF4444',
        heading: '#FFFFFF',
        body: '#E0E8F0',
        muted: '#8090B0',
        border: '#3D4F75',
        blue: {
          50: '#E6F7FF',
          100: '#C3EDFF',
          200: '#99E0FF',
          300: '#66D0FF',
          400: '#35C0FF',
          500: '#7DD3FC',
          600: '#7DD3FC',
          700: '#5BB9E8',
          800: '#3D9CCF',
          900: '#2D78A3',
        },
        gray: {
          50: '#0F172A',
          100: '#1A2438',
          200: '#2A3B5A',
          300: '#3D4F75',
          400: '#5E6F9C',
          500: '#8090B0',
          600: '#A7B6CE',
          700: '#C9D4E7',
          800: '#E0E8F0',
          900: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        card: '1rem',
        pill: '9999px',
      },
      ringColor: {
        DEFAULT: '#7DD3FC',
      },
    },
  },
  plugins: [],
}