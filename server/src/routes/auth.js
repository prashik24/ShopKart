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

    // Styled OTP email (ShopKart brand colours, similar to order email)
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Verify your email</title>
  </head>
  <body style="margin:0;padding:0;background:#F9FAFB;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F9FAFB;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:12px;border:1px solid #F3F4F6;">
            
            <!-- Logo -->
            <tr>
              <td style="padding:20px 24px 8px 24px;">
                <div style="font:800 20px/1 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827;">
                  Shop<span style="color:#F59E0B">Kart</span>
                </div>
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td style="padding:4px 24px 0 24px;">
                <h1 style="margin:12px 0 8px 0;font:700 22px/1.3 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827;">
                  Verify your email
                </h1>
                <p style="margin:0 0 16px 0;font:400 14px/1.6 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#374151;">
                  Hi ${name}, use the following 6-digit code to finish creating your ShopKart account:
                </p>
              </td>
            </tr>

            <!-- OTP Box -->
            <tr>
              <td style="padding:12px 24px 24px 24px;" align="center">
                <div style="display:inline-block;letter-spacing:6px;font:700 28px/1.3 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#F59E0B;padding:14px 24px;border:2px dashed #F59E0B;border-radius:12px;background:#FFFBEB;">
                  ${otp}
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:18px 24px 22px 24px;">
                <p style="margin:0;font:400 13px/1.6 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#6B7280;">
                  This code will expire in <strong>10 minutes</strong>. If you didn’t request this, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>

          <div style="max-width:640px;padding:14px 10px 0 10px;font:400 12px/1.6 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#9CA3AF;">
            Thanks for choosing <span style="font-weight:700;color:#111827;">Shop</span><span style="font-weight:800;color:#F59E0B;">Kart</span>.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    const text = `Your ShopKart sign-up code is: ${otp}\n\nValid for 10 minutes.`;

    await sendEmail({
      to: email,
      subject: 'Your ShopKart verification code',
      html,
      text
    });

    return res.json({ ok: true, email });
  } catch (err) {
    console.error('[signup/initiate] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/auth/signup/verify
 * body: { email, otp }
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
      orders: []
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

/** POST /api/auth/login */
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
