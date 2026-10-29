<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// Site-wide defaults; pages override title / description / image.
const route = useRoute()
const origin = useSiteOrigin()
// Query strings (filters, tracking params) never make a different canonical page
const canonical = computed(() => absoluteUrl(origin, route.path))

useHead({
  htmlAttrs: { lang: 'vi' },
  link: [
    { rel: 'canonical', href: canonical },
    // Installable web app (public/manifest.webmanifest, service worker in public/sw.js)
    { rel: 'manifest', href: '/manifest.webmanifest' },
    { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
  ],
  meta: [
    // iOS "Add to Home Screen": full screen, own name under the icon
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-title', content: SHOP.name },
    // Dark bar above the page (not translucent), so the fixed navbar never slides under the clock
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black' },
  ],
})

useSeoMeta({
  description: SHOP.description,
  themeColor: SHOP.themeColor,
  ogSiteName: SHOP.name,
  ogType: 'website',
  ogLocale: 'vi_VN',
  ogUrl: canonical,
  twitterCard: 'summary_large_image',
})
</script>
