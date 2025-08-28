+import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Create a signed session token with a small payload.
 */
export function signSession(user) {
  return jwt.sign(
    { uid: user._id.toString() },
    config.jwt.secret,
    { expiresIn: `${config.jwt.expiresDays}d` }
  );
}

/**
 * Set the auth cookie with environment-aware flags.
 * - Prod: cross-site → SameSite=None; Secure=true (required by browsers)
 * - Dev:  SameSite=Lax; Secure=false (localhost over http)
 */
export function setAuthCookie(res, token) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: config.jwt.expiresDays * 24 * 60 * 60 * 1000,
    path: '/'
  };

  // Optional: if you have a custom API domain and want to scope the cookie
  if (process.env.JWT_COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.JWT_COOKIE_DOMAIN;
  }

  res.cookie(config.jwt.cookieName, token, cookieOptions);
}

/**
 * Clear the auth cookie (mirror flags).
 */
export function clearAuthCookie(res) {
  res.clearCookie(config.jwt.cookieName, {
    path: '/',
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd
  });
}

/**
 * Strict guard — respond 401 when no/invalid session.
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
 * Soft guard — never 401s; sets req.user if a valid cookie is present.
 */
export async function maybeUser(req, _res, next) {
  try {
    const token = req.cookies?.[config.jwt.cookieName];
    if (!token) return next();

    const payload = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(payload.uid).lean();
    if (user) req.user = user;
  } catch {
    // ignore invalid/expired cookies
  }
  next();
}
