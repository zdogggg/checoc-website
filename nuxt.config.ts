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
  // Overridden by NUXT_* env vars, e.g. NUXT_TELEGRAM_BOT_TOKEN, NUXT_PUBLIC_BANK_ACCOUNT_NO
  runtimeConfig: {
    telegramBotToken: '',
    telegramChatId: '',
    // Email for customer login codes via Resend (server/utils/mail.ts); empty key = not set up
    resendApiKey: '',
    mailFrom: 'Chè Cốc <no-reply@example.com>',
    // SMS provider for customer login codes (see server/utils/sms.ts); empty = not set up
    smsProvider: '',
    public: {
      siteUrl: '',
      // false on staging / preview: robots.txt then blocks every crawler
      indexable: true,
      // VietQR transfers; the option is hidden at checkout until all three are set
      bank: {
        bankId: '',
        accountNo: '',
        accountName: '',
      },
    },
  },
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
