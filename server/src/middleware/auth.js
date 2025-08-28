import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Sign a short user payload into a JWT
 */
export function signSession(user) {
  const token = jwt.sign({ uid: user._id.toString() }, config.jwt.secret, {
    expiresIn: `${config.jwt.expiresDays}d`
  });
  return token;
}

/**
 * Set auth cookie with environment-aware flags.
 * - In production (Render), frontend & backend are usually on different domains,
 *   so we need SameSite=None; Secure
 * - In local dev (http), use SameSite=lax; Secure=false
 */
export function setAuthCookie(res, token) {
  const cookieOptions = {
    httpOnly: true,
    // Cross-site cookie support in prod (frontend & backend on different domains)
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd, // must be true when SameSite=None
    maxAge: config.jwt.expiresDays * 24 * 60 * 60 * 1000,
    path: '/'
  };

  // Optional: allow overriding the cookie domain via env (useful with custom domains)
  if (process.env.JWT_COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.JWT_COOKIE_DOMAIN;
  }

  res.cookie(config.jwt.cookieName, token, cookieOptions);
}

/**
 * Clear the auth cookie
 */
export function clearAuthCookie(res) {
  res.clearCookie(config.jwt.cookieName, {
    path: '/',
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd
  });
}

/**
 * Strict guard — responds 401 if not authenticated
 */
export async function requireUser(req, res, next) {
  try {
    const token = req.cookies?.[config.jwt.cookieName];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const payload = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(payload.uid).lean();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    req.user = user;
    next();
  } catch (_err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

/**
 * Soft guard — NEVER 401s; if a valid cookie exists sets req.user, otherwise leaves it undefined
 * Useful for "session probe" endpoints and pages that can render with or without a user.
 */
export async function maybeUser(req, _res, next) {
  try {
    const token = req.cookies?.[config.jwt.cookieName];
    if (!token) return next();

    const payload = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(payload.uid).lean();
    if (user) req.user = user;
  } catch (_e) {
    // ignore invalid/expired tokens
  }
  next();
}
