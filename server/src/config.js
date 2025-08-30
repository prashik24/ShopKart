// server/src/config.js
import 'dotenv/config';

// Smart defaults: treat Render/production as cross-site HTTPS
const isProd =
  process.env.NODE_ENV === 'production' ||
  process.env.RENDER === 'true' ||
  typeof process.env.RENDER !== 'undefined';

const defaultSameSite = isProd ? 'none' : 'lax';
const defaultSecure   = isProd ? true  : false;

function parseBool(v, fallback) {
  if (v === undefined || v === null) return fallback;
  const s = String(v).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(s)) return true;
  if (['0', 'false', 'no', 'n'].includes(s)) return false;
  return fallback;
}

export const config = {
  port: Number(process.env.PORT || 4000),

  // Frontend origin for CORS (must match your Render static site URL in prod)
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  // MongoDB connection
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopkart',

  // JWT/session
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    cookieName: process.env.JWT_COOKIE_NAME || 'sk_session',
    expiresDays: Number(process.env.JWT_EXPIRES_DAYS || 7)
  },

  // Cross-site cookie flags (important for Render)
  cookie: {
    sameSite: (process.env.COOKIE_SAMESITE || defaultSameSite).toLowerCase(), // 'none' on Render/prod
    secure: parseBool(process.env.COOKIE_SECURE, defaultSecure),              // true on Render/prod
  },

  // SMTP for OTP + order emails
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    // 465 => secure true, 587/25 => secure false
    secure: parseBool(process.env.SMTP_SECURE, true),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'ShopKart <no-reply@example.com>'
  },

  // Branding (used in emails/links)
  siteName: process.env.SITE_NAME || 'ShopKart',
  siteUrl: process.env.SITE_URL || (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
};
