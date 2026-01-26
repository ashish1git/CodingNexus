// Cache utility for faster data loading
const CACHE_PREFIX = 'codingnexus_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class DataCache {
  constructor() {
    this.memoryCache = new Map();
  }

  // Generate cache key
  getCacheKey(key, userId) {
    return `${CACHE_PREFIX}${userId}_${key}`;
  }

  // Set data in cache (both memory and localStorage)
  set(key, userId, data) {
    const cacheKey = this.getCacheKey(key, userId);
    const cacheItem = {
      data,
      timestamp: Date.now(),
      userId
    };

    // Memory cache (fastest)
    this.memoryCache.set(cacheKey, cacheItem);

    // LocalStorage cache (persists across sessions)
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('LocalStorage cache failed:', error);
    }
  }

  // Get data from cache
  get(key, userId) {
    const cacheKey = this.getCacheKey(key, userId);

    // Try memory cache first (fastest)
    if (this.memoryCache.has(cacheKey)) {
      const cached = this.memoryCache.get(cacheKey);
      if (this.isValid(cached)) {
        return cached.data;
      }
      this.memoryCache.delete(cacheKey);
    }

    // Try localStorage cache
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cacheItem = JSON.parse(cached);
        if (this.isValid(cacheItem)) {
          // Restore to memory cache
          this.memoryCache.set(cacheKey, cacheItem);
          return cacheItem.data;
        }
        localStorage.removeItem(cacheKey);
      }
    } catch (error) {
      console.warn('LocalStorage read failed:', error);
    }

    return null;
  }

  // Check if cache is still valid
  isValid(cacheItem) {
    if (!cacheItem || !cacheItem.timestamp) return false;
    const age = Date.now() - cacheItem.timestamp;
    return age < CACHE_DURATION;
  }

  // Clear cache for specific key
  clear(key, userId) {
    const cacheKey = this.getCacheKey(key, userId);
    this.memoryCache.delete(cacheKey);
    try {
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  }

  // Clear all cache for a user
  clearAll(userId) {
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(userId)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear localStorage cache
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX) && key.includes(userId)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache clearAll failed:', error);
    }
  }

  // Clear expired cache items
  cleanup() {
    // Memory cache
    for (const [key, value] of this.memoryCache.entries()) {
      if (!this.isValid(value)) {
        this.memoryCache.delete(key);
      }
    }

    // localStorage cache
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (!this.isValid(item)) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }
}

// Singleton instance
const dataCache = new DataCache();

// Cleanup expired cache on load
dataCache.cleanup();

// Periodic cleanup (every 10 minutes)
setInterval(() => dataCache.cleanup(), 10 * 60 * 1000);

export default dataCache;
