// server/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';

export function signSession(user){
  return jwt.sign({ uid: user._id.toString() }, config.jwt.secret, {
    expiresIn: `${config.jwt.expiresDays}d`
  });
}

/**
 * Sets the auth cookie for cross-site usage (frontend.onrender.com -> backend.onrender.com)
 * Requires: SameSite=None; Secure; Partitioned
 */
export function setAuthCookie(res, token){
  const opts = {
    httpOnly: true,
    sameSite: 'none',            // cross-site
    secure: true,                // Render is HTTPS
    partitioned: true,           // CHIPS (Partitioned cookies)
    maxAge: config.jwt.expiresDays * 24 * 60 * 60 * 1000,
    path: '/',
  };

  // Primary (supported on recent cookie libraries)
  res.cookie(config.jwt.cookieName, token, opts);

  // Fallback: force the Partitioned attribute if the lib ignores `partitioned`
  // (harmless duplicate; header will be merged/overwritten by frameworks that support it)
  try {
    const maxAge = opts.maxAge;
    res.append('Set-Cookie',
      `${encodeURIComponent(config.jwt.cookieName)}=${encodeURIComponent(token)}; ` +
      `Path=/; Max-Age=${Math.floor(maxAge/1000)}; HttpOnly; Secure; SameSite=None; Partitioned`
    );
  } catch {}
}

export function clearAuthCookie(res){
  const opts = {
    path: '/',
    sameSite: 'none',
    secure: true,
    partitioned: true,
  };
  res.clearCookie(config.jwt.cookieName, opts);

  // Fallback header to ensure removal in older stacks
  try {
    res.append('Set-Cookie',
      `${encodeURIComponent(config.jwt.cookieName)}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None; Partitioned`
    );
  } catch {}
}

/** Strict guard — 401 if not authenticated */
export async function requireUser(req, res, next){
  try{
    const token = req.cookies?.[config.jwt.cookieName];
    if(!token) return res.status(401).json({ error: 'Unauthorized' });

    const { uid } = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(uid).lean();
    if(!user) return res.status(401).json({ error: 'Unauthorized' });

    req.user = user;
    next();
  }catch{
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

/** Soft guard — never 401s; sets req.user if valid cookie exists */
export async function maybeUser(req, _res, next){
  try{
    const token = req.cookies?.[config.jwt.cookieName];
    if(token){
      const { uid } = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(uid).lean();
      if (user) req.user = user;
    }
  }catch{
    // ignore invalid cookies
  }
  next();
}
