// server/src/index.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { connectDb } from './db.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import { maybeUser } from './middleware/auth.js';

const app = express();

/**
 * IMPORTANT behind any reverse proxy (Render, Vercel, Netlify, Nginx):
 * Needed so Express knows it's behind HTTPS and will honor `secure` cookies.
 */
app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

/**
 * Robust CORS:
 * - Use CLIENT_ORIGIN for your *primary* frontend (Render static site)
 * - Optionally ALLOWED_ORIGINS lets you add multiple, comma-separated
 *   (e.g., your local dev origin AND your deployed site)
 */
const allowList = (process.env.ALLOWED_ORIGINS || config.clientOrigin || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // allow same-origin / curl / server-to-server
      if (!origin) return cb(null, true);
      if (allowList.includes(origin)) return cb(null, true);
      return cb(new Error('CORS: origin not allowed: ' + origin), false);
    },
    credentials: true,
  })
);

// Simple probe for health checks
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// SOFT session probe — never 401. Returns { user: null } when no session.
// Your React app can call this on boot to hydrate session silently.
app.get('/api/session', maybeUser, (req, res) => {
  if (!req.user) return res.json({ user: null });
  const u = req.user;
  return res.json({
    user: {
      id: u._id,
      name: u.name,
      email: u.email,
      gender: u.gender,
      createdAt: u.createdAt,
    },
  });
});

// Business routes
app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Start
await connectDb();
app.listen(config.port, () => {
  console.log(`[server] listening on http://localhost:${config.port}`);
});
