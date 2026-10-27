// Public origin of the site. NUXT_PUBLIC_SITE_URL wins so canonical URLs stay stable behind
// a proxy; without it, fall back to the host of the current request.
export function useSiteOrigin(): string {
  const configured = useRuntimeConfig().public.siteUrl
  return (configured || useRequestURL().origin).replace(/\/+$/, '')
}

// Structured data (schema.org JSON-LD) for the current page
export function useJsonLd(data: MaybeRefOrGetter<Record<string, unknown> | null | undefined>) {
  useHead({
    script: computed(() => {
      const value = toValue(data)
      return value ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(value) }] : []
    }),
  })
}
