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
  routeRules: {
    // Browsers must pick up a new service worker on the next visit
    '/sw.js': { headers: { 'cache-control': 'no-cache' } },
    '/manifest.webmanifest': { headers: { 'cache-control': 'public, max-age=3600' } },
  },
  // Overridden by NUXT_* env vars, e.g. NUXT_TELEGRAM_BOT_TOKEN, NUXT_PUBLIC_BANK_ACCOUNT_NO
  runtimeConfig: {
    telegramBotToken: '',
    telegramChatId: '',
    // Email for customer login codes via Resend (server/utils/mail.ts); empty key = not set up
    resendApiKey: '',
    mailFrom: 'Chè Cốc <no-reply@example.com>',
    // SMS provider for customer login codes (see server/utils/sms.ts); empty = not set up
    smsProvider: '',
    // Web push (order status notifications); generate with `npx web-push generate-vapid-keys`
    vapidPrivateKey: '',
    vapidSubject: 'mailto:admin@example.com',
    // SePay webhook key (Authorization: Apikey <key>); empty = automatic transfer matching off
    sepayWebhookKey: '',
    // Accept orders at any hour (automated tests, staging); never set on the real shop
    ignoreOpeningHours: false,
    public: {
      siteUrl: '',
      // false on staging / preview: robots.txt then blocks every crawler
      indexable: true,
      // Web push public key (pairs with vapidPrivateKey); empty hides the notification button
      vapidPublicKey: '',
      // VietQR transfers; the option is hidden at checkout until all three are set
      bank: {
        bankId: '',
        accountNo: '',
        accountName: '',
      },
    },
  },
  // Only the families and weights the pages use (all three cover Vietnamese). Downloaded at
  // build time and served from the site itself: no request to Google, one origin fewer.
  googleFonts: {
    families: {
      Inter: [400, 500, 600, 700],
      'Playfair+Display': [500, 700],
      'Dancing+Script': [400],
    },
    display: 'swap',
    subsets: ['vietnamese', 'latin'],
    download: true,
    inject: true,
  }
})
