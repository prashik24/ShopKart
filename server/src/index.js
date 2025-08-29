import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { connectDb } from './db.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import { maybeUser } from './middleware/auth.js';

const app = express();

// Trust proxy for Render/Heroku/etc
app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// --- CORS ---
const allowList = (process.env.ALLOWED_ORIGINS || config.clientOrigin || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // allow curl / Postman / same-origin
      if (allowList.includes(origin)) return cb(null, true);
      return cb(null, false); // just deny, don’t throw
    },
    credentials: true,
  })
);

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Session probe (never 401)
app.get('/api/session', maybeUser, (req, res) => {
  if (!req.user) return res.json({ user: null });
  const u = req.user;
  res.json({
    user: {
      id: u._id,
      name: u.name,
      email: u.email,
      gender: u.gender,
      createdAt: u.createdAt,
    },
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);

// 404 fallback
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Boot
await connectDb();
app.listen(config.port, () => {
  console.log(`[server] listening on http://localhost:${config.port}`);
});
