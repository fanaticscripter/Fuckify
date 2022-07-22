const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    screens: {
      xs: '360px',
      ...defaultTheme.screens,
    },
    extend: {
      colors: {
        pink: {
          25: '#fefbfd',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
