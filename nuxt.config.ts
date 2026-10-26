// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/motion/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/google-fonts',
    '@nuxt/eslint',
    'nuxt-auth-utils'
  ],
  css: ['~/assets/css/tailwind.css'],
  googleFonts: {
    families: {
      Inter: [400, 500, 600, 700],
      'Be+Vietnam+Pro': [400, 500, 600, 700],
      'Playfair+Display': [400, 500, 600, 700],
      Fraunces: [400, 500, 600, 700],
      'Dancing+Script': [400, 500, 600, 700],
    },
    display: 'swap',
    subsets: ['vietnamese', 'latin'],
  }
})
