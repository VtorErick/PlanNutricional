const rateLimitBuckets = globalThis.__planNutricionalRateLimits ?? new Map();

if (!globalThis.__planNutricionalRateLimits) {
  globalThis.__planNutricionalRateLimits = rateLimitBuckets;
}

function normalizeHostCandidate(value) {
  if (!value || typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const normalized = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    return new URL(normalized).host.toLowerCase();
  } catch {
    return trimmed.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
  }
}

function getAllowedHosts(req) {
  return new Set(
    [
      req.headers['x-forwarded-host'],
      req.headers.host,
      process.env.VERCEL_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
      process.env.APP_URL,
      process.env.SITE_URL,
    ]
      .map(normalizeHostCandidate)
      .filter(Boolean)
  );
}

function normalizeWwwHost(host) {
  if (!host) return '';
  return host.startsWith('www.') ? host.slice(4) : host;
}

function hostSharesSuffix(candidateHost, allowedHost) {
  if (!candidateHost || !allowedHost) return false;
  if (candidateHost === allowedHost) return true;
  if (candidateHost.endsWith(`.${allowedHost}`)) return true;
  if (allowedHost.endsWith(`.${candidateHost}`)) return true;
  return false;
}

function isHostAllowed(candidateHost, allowedHosts) {
  if (!candidateHost) return false;
  const normalizedCandidate = candidateHost.toLowerCase();
  const normalizedCandidateNoWww = normalizeWwwHost(normalizedCandidate);

  for (const allowedHost of allowedHosts) {
    const normalizedAllowed = allowedHost.toLowerCase();
    const normalizedAllowedNoWww = normalizeWwwHost(normalizedAllowed);

    if (
      hostSharesSuffix(normalizedCandidate, normalizedAllowed) ||
      hostSharesSuffix(normalizedCandidateNoWww, normalizedAllowedNoWww)
    ) {
      return true;
    }
  }

  return false;
}

function resolveTrustedUrl(rawValue, allowedHosts) {
  if (!rawValue || typeof rawValue !== 'string') return null;

  try {
    const url = new URL(rawValue.trim());
    return isHostAllowed(url.host.toLowerCase(), allowedHosts) ? url : null;
  } catch {
    return null;
  }
}

export function getTrustedRequestMeta(req) {
  const allowedHosts = getAllowedHosts(req);
  const requestOrigin = typeof req.headers.origin === 'string' ? req.headers.origin.trim() : '';
  const requestReferer = typeof req.headers.referer === 'string' ? req.headers.referer.trim() : '';
  const trustedOriginUrl = resolveTrustedUrl(requestOrigin, allowedHosts);
  const trustedRefererUrl = resolveTrustedUrl(requestReferer, allowedHosts);

  return {
    requestOrigin,
    requestReferer,
    allowedOrigin: trustedOriginUrl?.origin || '',
    trustedRequest: Boolean(trustedOriginUrl || trustedRefererUrl),
  };
}

export function applyCorsHeaders(req, res) {
  const meta = getTrustedRequestMeta(req);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (meta.allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', meta.allowedOrigin);
  }

  return meta;
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return req.socket?.remoteAddress || 'unknown';
}

export function enforceRateLimit(req, config) {
  const now = Date.now();
  const ip = getClientIp(req);
  const key = `${config.bucket}:${ip}`;
  const current = rateLimitBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      ok: true,
      remaining: Math.max(config.maxRequests - 1, 0),
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  if (current.count >= config.maxRequests) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
    };
  }

  current.count += 1;
  rateLimitBuckets.set(key, current);

  return {
    ok: true,
    remaining: Math.max(config.maxRequests - current.count, 0),
    retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
  };
}
