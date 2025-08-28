import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopkart',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    cookieName: process.env.JWT_COOKIE_NAME || 'sk_session',
    expiresDays: Number(process.env.JWT_EXPIRES_DAYS || 7)
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    // 465 => secure true, 587/25 => secure false
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'ShopKart <no-reply@example.com>'
  },

  // Branding (used in emails)
  siteName: process.env.SITE_NAME || 'ShopKart',
  siteUrl: process.env.SITE_URL || (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
};
