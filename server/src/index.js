import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { connectDb } from './db.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import { maybeUser } from './middleware/auth.js';

const app = express();

// --- Let Express know it's behind a proxy (Render) so "secure" cookies behave
app.set('trust proxy', 1);

// --- JSON + cookies
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// --- CORS:
// Support a single origin or a comma-separated list in CLIENT_ORIGIN
const allowList = String(config.clientOrigin || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    // allow same-origin / curl / server-to-server (no Origin header)
    if (!origin) return callback(null, true);

    // exact match against allowList
    if (allowList.length === 0 || allowList.includes(origin)) {
      return callback(null, true);
    }

    // optionally allow Render preview domains if you like:
    // if (/\.onrender\.com$/.test(new URL(origin).hostname)) return callback(null, true);

    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  }
};
app.use(cors(corsOptions));

// (Optional) Explicit preflight handler to be nice
app.options('*', cors(corsOptions));

// --- Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --- Soft session probe — always 200; returns { user: null } if no cookie/invalid
app.get('/api/session', maybeUser, (req, res) => {
  if (!req.user) return res.json({ user: null });
  const u = req.user;
  return res.json({
    user: { id: u._id, name: u.name, email: u.email, gender: u.gender, createdAt: u.createdAt }
  });
});

// --- Routes
app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);

// --- 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// --- Boot
await connectDb();
app.listen(config.port, () => {
  console.log(`[server] listening on http://localhost:${config.port}`);
  console.log(`[server] CORS allowList: ${allowList.length ? allowList.join(', ') : '(none — all origins blocked except no-origin requests)'}`);
});
