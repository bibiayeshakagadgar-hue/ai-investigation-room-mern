function authRateLimit({ windowMs = 15 * 60 * 1000, max = 10 } = {}) {
  const attempts = new Map();
  return (request, response, next) => {
    const now = Date.now();
    const key = request.ip || request.socket.remoteAddress || "unknown";
    const current = attempts.get(key);
    const entry = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : current;
    entry.count += 1;
    attempts.set(key, entry);
    if (entry.count > max) {
      response.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return response.status(429).json({ error: "Too many attempts. Try again later." });
    }
    if (attempts.size > 10000) {
      for (const [address, value] of attempts) if (value.resetAt <= now) attempts.delete(address);
    }
    return next();
  };
}

module.exports = { authRateLimit };
