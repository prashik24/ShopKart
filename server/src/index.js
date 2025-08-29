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
 * IMPORTANT for Render/any reverse proxy:
 * Makes Express treat the proxy as trusted so `secure` cookies are honored.
 */
app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

/**
 * CORS must allow the EXACT frontend origin and credentials.
 * Set CLIENT_ORIGIN in Render to your frontend URL, e.g.
 *   https://shopkart-fontent.onrender.com
 */
app.use(cors({
  origin: config.clientOrigin,
  credentials: true
}));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Soft session probe — always 200, returns { user: null } when not logged in
app.get('/api/session', maybeUser, (req, res) => {
  if (!req.user) return res.json({ user: null });
  const u = req.user;
  return res.json({
    user: { id: u._id, name: u.name, email: u.email, gender: u.gender, createdAt: u.createdAt }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

await connectDb();
app.listen(config.port, () => {
  console.log(`[server] listening on http://localhost:${config.port}`);
});
