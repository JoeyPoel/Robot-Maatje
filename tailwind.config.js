/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        robot: {
          bg: '#0B0E14',
          surface: '#131822',
          surfaceElevated: '#1A2130',
          border: '#232D42',
          primary: '#FF375D',
          secondary: '#2AC3FF',
          telemetry: '#FFC107',
        },
      },
    },
  },
  plugins: [],
};

