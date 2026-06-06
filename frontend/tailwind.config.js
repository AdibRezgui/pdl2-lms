/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f5f1ff',
          100: '#eae4ff',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b6ef2',
          600: '#7c5ce0',
          700: '#6845c4',
        },
        blush: {
          50:  '#fff0f5',
          100: '#ffdde8',
          300: '#ffc7da',
          400: '#fb92ae',
          500: '#fb7299',
          600: '#e85586',
        },
        surface: {
          base:     '#fffdfb',
          DEFAULT:  '#fff7fb',
          card:     '#ffffff',
          elevated: '#fff7fb',
        },
        amber: {
          400: '#f5a524',
          500: '#e2940f',
        },
        emerald: {
          400: '#6ee7b7',
          500: '#34d399',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        'glow-sm': '0 0 16px rgba(167,139,250,0.18)',
        'glow':    '0 0 32px rgba(167,139,250,0.24)',
        'glow-lg': '0 0 48px rgba(167,139,250,0.3)',
      },
    },
  },
  plugins: [],
};
