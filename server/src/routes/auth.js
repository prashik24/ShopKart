import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { SignupToken } from '../models/SignupToken.js';
import { generateOtp } from '../utils/generateOtp.js';
import { sendEmail } from '../utils/sendEmail.js';
import { signSession, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/signup/initiate
 * body: { name, email, password }
 * - If user exists -> 409
 * - Create OTP token, email OTP
 */
router.post('/signup/initiate', async (req, res) => {
  try{
    const { name, email, password } = req.body || {};
    if(!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const exists = await User.findOne({ email: email.toLowerCase() }).lean();
    if(exists) return res.status(409).json({ error: 'Already registered' });

    // wipe any old pending
    await SignupToken.deleteMany({ email: email.toLowerCase() });

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await SignupToken.create({ email: email.toLowerCase(), name, passwordHash, otp, expiresAt });

    // send real OTP email
    await sendEmail({
      to: email,
      subject: 'Your ShopKart sign-up OTP',
      text: `Your OTP is ${otp} (valid for 10 minutes).`,
      html: `<p>Your OTP is <b style="font-size:18px">${otp}</b></p><p>Valid for 10 minutes.</p>`
    });

    return res.json({ ok: true });
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/auth/signup/verify
 * body: { email, otp }
 * - If token valid -> create user, log in (set cookie), delete token
 */
router.post('/signup/verify', async (req, res) => {
  try{
    const { email, otp } = req.body || {};
    if(!email || !otp) return res.status(400).json({ error: 'Missing fields' });

    const pending = await SignupToken.findOne({ email: email.toLowerCase() }).lean();
    if(!pending) return res.status(400).json({ error: 'No pending sign-up' });

    if(pending.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if(new Date() > new Date(pending.expiresAt)) return res.status(400).json({ error: 'OTP expired' });

    // Create user
    const created = await User.create({
      name: pending.name,
      email: email.toLowerCase(),
      passwordHash: pending.passwordHash,
      gender: 'Prefer not to say',
      cart: [],
      orders: []
    });

    await SignupToken.deleteMany({ email: email.toLowerCase() });

    // session
    const token = signSession(created);
    setAuthCookie(res, token);

    const user = { id: created._id, name: created.name, email: created.email, gender: created.gender, createdAt: created.createdAt };
    return res.json({ user });
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post('/login', async (req, res) => {
  try{
    const { email, password } = req.body || {};
    if(!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if(!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if(!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signSession(user);
    setAuthCookie(res, token);

    return res.json({ user: { id: user._id, name: user.name, email: user.email, gender: user.gender, createdAt: user.createdAt } });
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/** POST /api/auth/logout */
router.post('/logout', async (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

export default router;
