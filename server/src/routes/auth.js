// server/src/routes/auth.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { SignupToken } from '../models/SignupToken.js';
import { generateOtp } from '../utils/generateOtp.js';
import { sendEmail } from '../utils/sendEmail.js';
import { signSession, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';

const router = Router();

/** Small helper to shape user sent to client */
function toClientUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    gender: u.gender,
    createdAt: u.createdAt
  };
}

/**
 * POST /api/auth/signup/initiate
 * body: { name, email, password }
 * - If user exists -> 409
 * - Create/overwrite OTP token, email OTP
 * - IMPORTANT: returns { email } so the client can navigate to /verify-otp
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

    // Remove any previous pending tokens for this email
    await SignupToken.deleteMany({ email });

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp(); // 6-digit code
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await SignupToken.create({ email, name, passwordHash, otp, expiresAt });

    // Styled email (no external images)
    const html = `
      <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;padding:24px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb">
          <tr>
            <td style="padding:18px 22px;border-bottom:1px solid #e5e7eb">
              <div style="font-size:20px;font-weight:800;letter-spacing:.4px;color:#111827">
                <span style="color:#111827">Shop</span><span style="color:#ef4444">Kart</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:22px">
              <h1 style="margin:0 0 10px;font-size:20px;color:#111827">Verify your email</h1>
              <p style="margin:0 0 14px;color:#374151">Hi ${name}, use this one-time code to finish creating your ShopKart account:</p>
              <div style="text-align:center;margin:18px 0 10px">
                <div style="display:inline-block;background:#111827;color:#fff;font-weight:700;font-size:26px;letter-spacing:4px;border-radius:12px;padding:12px 18px">
                  ${otp}
                </div>
              </div>
              <p style="margin:10px 0 0;color:#6b7280;font-size:14px">This code expires in 10 minutes. If you didn’t request this, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 22px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px">
              © ${new Date().getFullYear()} ShopKart
            </td>
          </tr>
        </table>
      </div>`;

    const text = `Your ShopKart sign-up code is: ${otp} (valid 10 minutes)`;

    await sendEmail({
      to: email,
      subject: 'Your ShopKart verification code',
      html,
      text
    });

    // 👇 return the email so the frontend can route to /verify-otp?email=...
    return res.json({ ok: true, email });
  } catch (err) {
    console.error('[signup/initiate] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/auth/signup/verify
 * body: { email, otp }
 * - If token valid -> create user, log in (set cookie), delete token
 */
router.post('/signup/verify', async (req, res) => {
  try {
    const emailRaw = String(req.body?.email || '');
    const otpRaw = String(req.body?.otp || '');
    const email = emailRaw.trim().toLowerCase();
    const otp = otpRaw.trim();

    if (!email || !otp) return res.status(400).json({ error: 'Missing fields' });

    const pending = await SignupToken.findOne({ email }).lean();
    if (!pending) return res.status(400).json({ error: 'No pending sign-up' });

    if (pending.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (pending.expiresAt && new Date(pending.expiresAt).getTime() < Date.now()) {
      await SignupToken.deleteMany({ email });
      return res.status(400).json({ error: 'OTP expired' });
    }

    // Create user
    const created = await User.create({
      name: pending.name,
      email,
      passwordHash: pending.passwordHash,
      gender: 'Prefer not to say',
      cart: [],
      orders: []
    });

    // Cleanup token
    await SignupToken.deleteMany({ email });

    // Start session
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
 * body: { email, password }
 * - Validate & set cookie
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
