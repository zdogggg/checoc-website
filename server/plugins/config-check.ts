// Production refuses to boot with a missing or weak session secret: sessions would be
// forgeable or reset on every restart. Other gaps only warn.
export default defineNitroPlugin(() => {
  if (import.meta.dev) return
  const secret = process.env.NUXT_SESSION_PASSWORD ?? ''
  if (secret.length < 32) {
    throw new Error('NUXT_SESSION_PASSWORD must be set to at least 32 random characters in production')
  }
  const { public: pub } = useRuntimeConfig()
  if (!pub.siteUrl) console.warn('[config] NUXT_PUBLIC_SITE_URL is not set; canonical URLs use the request host')
  if (!process.env.DATABASE_URL) console.warn('[config] DATABASE_URL is not set')
  // Apple rejects push tokens whose subject is not a real mailto: address (BadJwtToken)
  const { vapidPrivateKey, vapidSubject } = useRuntimeConfig()
  const realMailto = /^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(vapidSubject) && !/\.local$|localhost|@example\./i.test(vapidSubject)
  if (vapidPrivateKey && !realMailto) {
    console.warn(`[config] NUXT_VAPID_SUBJECT "${vapidSubject}" should be mailto: a real address, or iPhone notifications fail`)
  }
})
