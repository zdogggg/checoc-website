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
  link: [{ rel: 'canonical', href: canonical }],
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
