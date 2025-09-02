// postcss.config.mjs

export default {
  plugins: {
    '@tailwindcss/postcss': {}, // <--- This is the new way
    autoprefixer: {},
  },
}