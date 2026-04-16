/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  '#FAFAFA',
          100: '#F2F2F2',
          200: '#E4E4E4',
          300: '#CCCCCC',
          400: '#AAAAAA',
          500: '#888888',
        },
        charcoal: {
          50:  '#F5F5F5',
          100: '#EBEBEB',
          200: '#D5D5D5',
          300: '#ADADAD',
          400: '#888888',
          500: '#6B6B6B',
          600: '#555555',
          700: '#3D3D3D',
          800: '#2A2A2A',
          900: '#141414',
          950: '#0A0A0A',
        },
        gold: {
          50:  '#F7F7F7',
          100: '#EFEFEF',
          200: '#DEDEDE',
          300: '#C2C2C2',
          400: '#9E9E9E',
          500: '#707070',
          600: '#505050',
          700: '#363636',
          800: '#1F1F1F',
          900: '#111111',
        },
        sage: {
          50:  '#F5F5F5',
          100: '#EBEBEB',
          200: '#D5D5D5',
          300: '#B8B8B8',
          400: '#8A8A8A',
          500: '#5E5E5E',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        logo:    ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in':  'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.97)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};
