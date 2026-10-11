import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
    './app.vue',
    './app/**/*.{js,vue,ts}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark-green': '#0D241B',
        'brand-cream': '#F7F1E5',
        'brand-peach': '#F6B99F',
        'brand-white': '#FFFDF8',
        'brand-soft-green': '#DDE8D6',
        'brand-gold': '#D9A441',
      },
      fontFamily: {
        sans: ['Inter', 'Be Vietnam Pro', 'sans-serif'],
        serif: ['Playfair Display', 'Fraunces', 'serif'],
        heading: ['Playfair Display', 'Fraunces', 'serif'],
        handwriting: ['Dancing Script', 'cursive'],
      },
    },
  },
  plugins: [],
}
