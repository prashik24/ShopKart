import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { sendEmail, buildOrderEmail, buildOrderText } from '../utils/sendEmail.js';

const router = Router();

/** GET /api/me — current user (auth required) */
router.get('/', requireUser, async (req, res) => {
  const u = req.user;
  return res.json({
    user: { id: u._id, name: u.name, email: u.email, gender: u.gender, createdAt: u.createdAt }
  });
});

/** PATCH /api/me/profile — update profile (name, gender) */
router.patch('/profile', requireUser, async (req, res) => {
  const { name, gender } = req.body || {};
  const update = {};
  if (typeof name === 'string' && name.trim().length >= 2) update.name = name.trim();
  if (typeof gender === 'string' && gender) update.gender = gender;

  const saved = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true });
  return res.json({
    user: { id: saved._id, name: saved.name, email: saved.email, gender: saved.gender, createdAt: saved.createdAt }
  });
});

/** GET /api/me/cart — read cart */
router.get('/cart', requireUser, async (req, res) => {
  const u = await User.findById(req.user._id).lean();
  res.json({ cart: u?.cart || [] });
});

/** PUT /api/me/cart — replace cart */
router.put('/cart', requireUser, async (req, res) => {
  const { cart } = req.body || {};
  if (!Array.isArray(cart)) return res.status(400).json({ error: 'cart must be an array' });

  const sanitized = cart.map(i => ({
    productId: String(i.productId ?? i.id ?? ''),
    title: String(i.title ?? ''),
    price: Number.isFinite(Number(i.price)) ? Number(i.price) : 0,
    image: typeof i.image === 'string' ? i.image : '',
    qty: Math.max(1, Number.isFinite(Number(i.qty)) ? Number(i.qty) : 1)
  }));

  const saved = await User.findByIdAndUpdate(req.user._id, { $set: { cart: sanitized } }, { new: true }).lean();
  res.json({ cart: saved.cart || [] });
});

/** GET /api/me/orders — list orders */
router.get('/orders', requireUser, async (req, res) => {
  const u = await User.findById(req.user._id).lean();
  res.json({ orders: u?.orders || [] });
});

/** GET /api/me/orders/:id — single order for confirmation page */
router.get('/orders/:id', requireUser, async (req, res) => {
  const orderId = String(req.params.id || '');
  const u = await User.findById(req.user._id).lean();
  const order = (u?.orders || []).find(o => String(o.id) === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

/** POST /api/me/orders — place an order; clears cart + emails receipt */
router.post('/orders', requireUser, async (req, res) => {
  const { order } = req.body || {};
  if (!order) return res.status(400).json({ error: 'Missing order' });

  const doc = await User.findById(req.user._id);

  // If client didn't send items (or sent empty), fallback to server cart
  const sourceItems = Array.isArray(order.items) && order.items.length
    ? order.items
    : (doc.cart || []);

  const normalized = {
    id: String(order.id || `SK-${Date.now()}`),
    total: Number(order.total || 0),
    payment: {
      mode: order.payment?.mode === 'UPI' ? 'UPI' : 'COD',
      upiId: order.payment?.mode === 'UPI' ? String(order.payment?.upiId || '') : null
    },
    address: {
      name: String(order.address?.name || ''),
      line1: String(order.address?.line1 || ''),
      city: String(order.address?.city || ''),
      state: String(order.address?.state || ''),
      zip: String(order.address?.zip || ''),
      phone: String(order.address?.phone || '')
    },
    items: sourceItems.map(i => ({
      id: String(i.id ?? i.productId ?? ''),
      productId: String(i.productId ?? i.id ?? ''),
      title: String(i.title ?? ''),
      price: Number.isFinite(Number(i.price)) ? Number(i.price) : 0,
      image: typeof i.image === 'string' ? i.image : '',
      qty: Math.max(1, Number.isFinite(Number(i.qty)) ? Number(i.qty) : 1)
    })),
    createdAt: new Date(Number(order.createdAt || Date.now()))
  };

  // Persist (prepend new order) and clear cart
  doc.orders = doc.orders || [];
  doc.orders.unshift(normalized);
  doc.cart = [];
  await doc.save();

  // Fire-and-forget email (don't block the API if email fails)
  try {
    const html = buildOrderEmail({ user: doc, order: normalized });
    const text = buildOrderText({ order: normalized });
    await sendEmail({
      to: doc.email,
      subject: `Your ShopKart order ${normalized.id} has been placed`,
      html,
      text
    });
  } catch (err) {
    // Optional: log but do not fail the request
    console.error('[email] order confirmation failed:', err?.message);
  }

  res.json({ ok: true, order: normalized });
});

export default router;
