import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';

export function signSession(user){
  const token = jwt.sign({ uid: user._id.toString() }, config.jwt.secret, {
    expiresIn: `${config.jwt.expiresDays}d`
  });
  return token;
}

export function setAuthCookie(res, token){
  res.cookie(config.jwt.cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,              // set true when served over HTTPS in production
    maxAge: config.jwt.expiresDays * 24 * 60 * 60 * 1000,
    path: '/'
  });
}

export function clearAuthCookie(res){
  res.clearCookie(config.jwt.cookieName, { path: '/' });
}

/** Strict guard — 401 if not authenticated */
export async function requireUser(req, res, next){
  try{
    const token = req.cookies?.[config.jwt.cookieName];
    if(!token) return res.status(401).json({ error: 'Unauthorized' });

    const payload = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(payload.uid).lean();
    if(!user) return res.status(401).json({ error: 'Unauthorized' });

    req.user = user;
    next();
  }catch(err){
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

/** Soft guard — never 401s; sets req.user if valid cookie exists */
export async function maybeUser(req, _res, next){
  try{
    const token = req.cookies?.[config.jwt.cookieName];
    if(!token) return next();

    const payload = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(payload.uid).lean();
    if (user) req.user = user;
  }catch(_e){
    // ignore invalid cookies
  }
  next();
}
