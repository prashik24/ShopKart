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

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(cors({
  origin: config.clientOrigin, // e.g. https://shopkart-frontend.onrender.com
  credentials: true
}));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Soft session probe (recommended endpoint for the client)
app.get('/api/session', maybeUser, (req, res) => {
  if (!req.user) return res.json({ user: null });
  const u = req.user;
  res.json({
    user: { id: u._id, name: u.name, email: u.email, gender: u.gender, createdAt: u.createdAt }
  });
});

// OPTIONAL mirror so requests without the /api prefix (e.g. /session) still work.
// This is only needed if your frontend was already deployed with a wrong base.
app.get('/session', maybeUser, (req, res) => {
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
