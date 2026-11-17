// Cached (see server/utils/menuCache.ts)
export default defineCachedEventHandler(() => listStoreOptions(), menuCacheOptions('options'))
