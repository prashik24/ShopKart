// server/src/routes/auth.js
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
    createdAt: u.createdAt
  };
}

/* ------------------------------------------------------------------ */
/* -----------------  OTP EMAIL (brand-styled, no images) ----------- */
/* ------------------------------------------------------------------ */

function buildOtpEmail({ name, email, otp }) {
  const safe = (s = '') =>
    String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  // Render OTP as spaced digits for readability
  const prettyOtp = safe(otp).split('').join(' ');

  return `<!doctype html>
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
            <tr>
              <td style="padding:20px 24px 8px 24px;">
                <!-- Brand text (no image) -->
                <div style="font:800 20px/1 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827;">
                  Shop<span style="color:#F59E0B">Kart</span>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:4px 24px 0 24px;">
                <h1 style="margin:12px 0 8px 0;font:700 22px/1.3 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827;">
                  Verify your email
                </h1>
                <p style="margin:0 0 10px 0;font:400 14px/1.7 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#374151;">
                  Hi ${safe(name)}, use this one-time code to finish creating your ShopKart account for
                  <strong>${safe(email)}</strong>.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:10px 24px 4px 24px;">
                <!-- OTP block -->
                <div style="text-align:center;margin:12px 0 6px;">
                  <div style="
                    display:inline-block;
                    background:#F59E0B;
                    color:#ffffff;
                    font:700 28px/1 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
                    letter-spacing:6px;
                    border-radius:12px;
                    padding:14px 18px;">
                    ${prettyOtp}
                  </div>
                </div>
                <div style="text-align:center;margin:6px 0 0 0;font:400 12px/1.6 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#6B7280;">
                  This code expires in 10 minutes.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 24px 22px 24px;">
                <div style="font:400 12px/1.7 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#6B7280;">
                  If you didn’t request this, you can safely ignore this email.
                </div>
              </td>
            </tr>
          </table>

          <div style="max-width:640px;padding:14px 10px 0 10px;font:400 12px/1.6 'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#9CA3AF;">
            © ${new Date().getFullYear()}<span style="font-weight:700;color:#111827;">Shop</span><span style="font-weight:800;color:#F59E0B;">Kart</span>.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* ---------------------------  ROUTES  ----------------------------- */
/* ------------------------------------------------------------------ */

/**
 * POST /api/auth/signup/initiate
 * body: { name, email, password }
 * - If user exists -> 409 (Already registered)
 * - Creates/overwrites an OTP signup token and sends styled email
 * - Returns { email } so the client can immediately route to /verify-otp
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

    // If already registered, tell the client (they can show "Already registered — log in")
    const exists = await User.findOne({ email }).lean();
    if (exists) return res.status(409).json({ error: 'Already registered' });

    // Overwrite any older pending tokens for this email
    await SignupToken.deleteMany({ email });

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp(); // 6-digit numeric code
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await SignupToken.create({ email, name, passwordHash, otp, expiresAt });

    // Send brand-styled OTP email
    await sendEmail({
      to: email,
      subject: 'Your ShopKart verification code',
      html: buildOtpEmail({ name, email, otp }),
      text: `Your ShopKart verification code is ${otp}. It expires in 10 minutes.`
    });

    // Let the client route to /verify-otp right away
    return res.json({ ok: true, email });
  } catch (err) {
    console.error('[signup/initiate] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/auth/signup/verify
 * body: { email, otp }
 * - If token valid -> create user, log in (cookie), delete token
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
