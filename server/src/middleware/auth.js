// server/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';

function isProdLike() {
  // Render sets RENDER=... and NODE_ENV=production
  return process.env.NODE_ENV === 'production' || !!process.env.RENDER;
}

export function signSession(user) {
  const token = jwt.sign({ uid: user._id.toString() }, config.jwt.secret, {
    expiresIn: `${config.jwt.expiresDays}d`,
  });
  return token;
}

export function setAuthCookie(res, token) {
  const prod = isProdLike();
  res.cookie(config.jwt.cookieName, token, {
    httpOnly: true,
    sameSite: prod ? 'none' : 'lax', // cross-site cookie needs 'none' in prod
    secure: prod,                    // must be true with SameSite=None
    maxAge: config.jwt.expiresDays * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  const prod = isProdLike();
  res.clearCookie(config.jwt.cookieName, {
    path: '/',
    sameSite: prod ? 'none' : 'lax',
    secure: prod,
  });
}

/** Strict guard — 401 if not authenticated */
export async function requireUser(req, res, next) {
  try {
    const token = req.cookies?.[config.jwt.cookieName];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const payload = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(payload.uid).lean();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

/** Soft guard — never 401s; sets req.user if valid cookie exists */
export async function maybeUser(req, _res, next) {
  try {
    const token = req.cookies?.[config.jwt.cookieName];
    if (!token) return next();

    const payload = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(payload.uid).lean();
    if (user) req.user = user;
  } catch (_e) {
    // ignore invalid cookies
  }
  next();
}
