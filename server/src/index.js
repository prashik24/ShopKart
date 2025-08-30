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

// Render sits behind a proxy (Cloudflare). This helps with secure cookies.
app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Support one or more allowed origins (comma-separated)
const allowed = (config.clientOrigin || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: function(origin, cb){
    // allow no-origin (curl/health) or any in the allowlist
    if (!origin || allowed.includes(origin)) return cb(null, true);
    return cb(new Error('CORS: Origin not allowed'), false);
  },
  credentials: true
}));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Soft session
app.get('/api/session', maybeUser, (req, res) => {
  if (!req.user) return res.json({ user: null });
  const u = req.user;
  res.json({
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
