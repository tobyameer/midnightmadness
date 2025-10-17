const buckets = new Map();

function createKey(keyParts) {
  return keyParts.filter(Boolean).join('::');
}

function cleanup(now) {
  buckets.forEach((value, key) => {
    if (value.reset <= now) {
      buckets.delete(key);
    }
  });
}

function rateLimit(options = {}) {
  const {
    windowMs = 60 * 1000,
    limit = 60,
    keyGenerator = (req) => req.ip,
    message = 'Too many requests, please try again later.',
  } = options;

  return (req, res, next) => {
    const now = Date.now();
    cleanup(now);

    const key = createKey([keyGenerator(req)]);
    const entry = buckets.get(key) || { count: 0, reset: now + windowMs };

    if (entry.reset <= now) {
      entry.count = 0;
      entry.reset = now + windowMs;
    }

    entry.count += 1;

    if (entry.count > limit) {
      res.set('Retry-After', Math.ceil((entry.reset - now) / 1000));
      return res.status(429).json({ message });
    }

    buckets.set(key, entry);
    return next();
  };
}

module.exports = { rateLimit };
