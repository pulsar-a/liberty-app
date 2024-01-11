const plugin = require('tailwindcss/plugin')
const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['RedHat', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        voodoo: {
          50: '#f6f3fa',
          100: '#f0e9f6',
          200: '#e4d7ee',
          300: '#d4bee3',
          400: '#c6a4d5',
          500: '#b88cc8',
          600: '#ac74b7',
          700: '#9762a0',
          800: '#7a5182',
          900: '#624669',
          950: '#453149',
        },
        woodsmoke: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d',
          950: '#191919',
        },
        mako: {
          50: '#f7f8f8',
          100: '#ededf1',
          200: '#d8dadf',
          300: '#b5b8c4',
          400: '#8d92a3',
          500: '#6f7588',
          600: '#595e70',
          700: '#494d5b',
          800: '#414450',
          900: '#373943',
          950: '#25262c',
        },

        'bright-gray': {
          50: '#f6f7f9',
          100: '#ededf1',
          200: '#d7d8e1',
          300: '#b3b7c6',
          400: '#8a90a6',
          500: '#6b728c',
          600: '#565b73',
          700: '#46495e',
          800: '#3a3d4c',
          900: '#363844',
          950: '#24252d',
        },

        martinique: {
          50: '#f4f6fa',
          100: '#e6e9f3',
          200: '#d3d8ea',
          300: '#b5bfdb',
          400: '#929fc8',
          500: '#7784ba',
          600: '#656dab',
          700: '#595e9c',
          800: '#4d4f80',
          900: '#383a59',
          950: '#2b2c40',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    plugin(function ({ addVariant }) {
      addVariant('not-last', '&:not(:last-child)')
      addVariant('not-first', '&:not(:first-child)')
    }),
  ],
}
