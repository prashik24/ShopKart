import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { SignupToken } from '../models/SignupToken.js';
import { generateOtp } from '../utils/generateOtp.js';
import { sendEmail } from '../utils/sendEmail.js';
import { signSession, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';

const router = Router();

/** Shape user for client */
function toClientUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    gender: u.gender,
    createdAt: u.createdAt,
  };
}

/**
 * POST /api/auth/signup/initiate
 */
router.post('/signup/initiate', async (req, res) => {
  try {
    const nameRaw = String(req.body?.name || '');
    const emailRaw = String(req.body?.email || '');
    const passwordRaw = String(req.body?.password || '');

    const name = nameRaw.trim();
    const email = emailRaw.trim().toLowerCase();
    const password = passwordRaw;

    if (name.length < 2) return res.status(400).json({ error: 'Name is too short' });
    if (!email) return res.status(400).json({ error: 'Email required' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password too short' });

    const exists = await User.findOne({ email }).lean();
    if (exists) return res.status(409).json({ error: 'Already registered' });

    await SignupToken.deleteMany({ email });

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await SignupToken.create({ email, name, passwordHash, otp, expiresAt });

    // ---------- Styled OTP Email (like order confirmation) ----------
    const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Verify your email</title>
</head>
<body style="background:#f6f7fb;margin:0;padding:20px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.08)">
    <tr>
      <td style="background:#111827;color:#fff;padding:16px 22px;font-size:20px;font-weight:700">
        Shop<span style="color:#ef4444">Kart</span>
      </td>
    </tr>
    <tr>
      <td style="padding:24px">
        <h1 style="margin:0 0 12px;font-size:20px;color:#111827">Verify your email</h1>
        <p style="margin:0 0 16px;font-size:15px;color:#374151">
          Hi ${name}, use this one-time code to finish creating your ShopKart account:
        </p>
        <div style="text-align:center;margin:20px 0">
          <div style="display:inline-block;background:#111827;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:6px;padding:14px 20px;border-radius:12px">
            ${otp}
          </div>
        </div>
        <p style="margin:12px 0 0;font-size:14px;color:#6b7280">
          This code expires in 10 minutes. If you didn’t request this, you can safely ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#f9fafb;padding:14px 22px;font-size:12px;color:#9ca3af;text-align:center">
        © ${new Date().getFullYear()} ShopKart. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `Your ShopKart sign-up code is: ${otp} (valid for 10 minutes).`;

    await sendEmail({
      to: email,
      subject: 'Your ShopKart verification code',
      html,
      text,
    });

    return res.json({ ok: true, email });
  } catch (err) {
    console.error('[signup/initiate] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/auth/signup/verify
 */
router.post('/signup/verify', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const otp = String(req.body?.otp || '').trim();

    if (!email || !otp) return res.status(400).json({ error: 'Missing fields' });

    const pending = await SignupToken.findOne({ email }).lean();
    if (!pending) return res.status(400).json({ error: 'No pending sign-up' });

    if (pending.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (pending.expiresAt && new Date(pending.expiresAt).getTime() < Date.now()) {
      await SignupToken.deleteMany({ email });
      return res.status(400).json({ error: 'OTP expired' });
    }

    const created = await User.create({
      name: pending.name,
      email,
      passwordHash: pending.passwordHash,
      gender: 'Prefer not to say',
      cart: [],
      orders: [],
    });

    await SignupToken.deleteMany({ email });

    const token = signSession(created);
    setAuthCookie(res, token);

    return res.json({ user: toClientUser(created) });
  } catch (err) {
    console.error('[signup/verify] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signSession(user);
    setAuthCookie(res, token);

    return res.json({ user: toClientUser(user) });
  } catch (err) {
    console.error('[login] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/** POST /api/auth/logout */
router.post('/logout', async (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

export default router;
