/**
 * 通用中间件：内存缓存 + 请求限流
 */

// ── 内存缓存 ──
const apiCache = new Map();
const DEFAULT_CACHE_TTL = 10000; // 10 秒

export function cacheMiddleware(ttlMs = DEFAULT_CACHE_TTL) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    const key = req.originalUrl || req.url;
    const now = Date.now();
    const hit = apiCache.get(key);
    if (hit && now < hit.expires) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(hit.data);
    }
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        apiCache.set(key, { data, expires: now + ttlMs });
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };
    next();
  };
}

// 每分钟清理过期缓存和限流记录
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of apiCache) {
    if (now > v.expires) apiCache.delete(k);
  }
  for (const [k, v] of rateLimitStore) {
    if (now > v.resetTime) rateLimitStore.delete(k);
  }
}, 60000);

// ── 限流 ──
const rateLimitStore = new Map();

export function rateLimitMiddleware(windowMs = 60000, maxRequests = 1) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const record = rateLimitStore.get(ip);
    if (!record || now > record.resetTime) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ error: '请求过于频繁，请稍后再试', retryAfter });
    }
    record.count++;
    next();
  };
}
