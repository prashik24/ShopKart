import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { connectDb } from './db.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import { maybeUser } from './middleware/auth.js';

const app = express();
const isProd = process.env.NODE_ENV === 'production';

/* ------------------------------------------------------------------ */
/* 1) Behind proxy (Render/NGINX) so Secure cookies behave correctly   */
/* ------------------------------------------------------------------ */
app.set('trust proxy', 1);

/* ------------------------------------------------------------------ */
/* 2) Parsers                                                          */
/* ------------------------------------------------------------------ */
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

/* ------------------------------------------------------------------ */
/* 3) CORS with allow-list (single or comma-separated CLIENT_ORIGIN)   */
/* ------------------------------------------------------------------ */
const allowList = String(config.clientOrigin || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

/**
 * In dev: if no CLIENT_ORIGIN set, allow any origin (easier local testing).
 * In prod: require explicit allowList entries to avoid accidental '*'.
 */
const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    // Allow same-origin (no Origin header), curl, server-to-server
    if (!origin) return callback(null, true);

    if (allowList.length === 0) {
      if (!isProd) return callback(null, true);
      return callback(new Error(`CORS: Origin ${origin} not allowed (empty allowList in production)`));
    }

    if (allowList.includes(origin)) {
      return callback(null, true);
    }

    // Optional: allow Render preview domains while testing
    // const host = (() => { try { return new URL(origin).hostname } catch { return '' } })();
    // if (/\.onrender\.com$/.test(host)) return callback(null, true);

    return callback(new Error(`CORS: Origin ${origin} not in allowList: ${allowList.join(', ')}`));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // explicit preflight

/* ------------------------------------------------------------------ */
/* 4) Simple root & health checks                                      */
/* ------------------------------------------------------------------ */
app.get('/', (_req, res) => {
  res.type('text/plain').send('ShopKart API is running. See /api/health or /api/session.');
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

/* ------------------------------------------------------------------ */
/* 5) Soft session probe — never 401; returns { user: null } if none   */
/* ------------------------------------------------------------------ */
app.get('/api/session', maybeUser, (req, res) => {
  if (!req.user) return res.json({ user: null });
  const u = req.user;
  return res.json({
    user: { id: u._id, name: u.name, email: u.email, gender: u.gender, createdAt: u.createdAt }
  });
});

/* ------------------------------------------------------------------ */
/* 6) API routes                                                       */
/* ------------------------------------------------------------------ */
app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);

/* ------------------------------------------------------------------ */
/* 7) 404 fallback                                                     */
/* ------------------------------------------------------------------ */
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

/* ------------------------------------------------------------------ */
/* 8) Boot                                                             */
/* ------------------------------------------------------------------ */
await connectDb();
app.listen(config.port, () => {
  console.log(`[server] listening on http://localhost:${config.port}`);
  console.log(`[server] NODE_ENV=${process.env.NODE_ENV || 'undefined'}`);
  console.log(`[server] CORS allowList: ${allowList.length ? allowList.join(', ') : '(none set)'}${isProd ? ' [PROD]' : ' [DEV]'}`);
});
