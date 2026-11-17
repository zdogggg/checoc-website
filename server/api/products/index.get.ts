// Cached (see server/utils/menuCache.ts): every page view of the shop asks for the menu
export default defineCachedEventHandler(() => listStoreProducts(), menuCacheOptions('products'))
