const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

async function req(path, { method = 'GET', body } = {}){
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include' // send/receive auth cookie
  });
  if (!res.ok) {
    let err = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) err = data.error;
    } catch {}
    throw new Error(err);
  }
  try { return await res.json(); } catch { return {}; }
}

export const api = {
  // NEW — soft session that never 401s
  session: () => req('/session'),

  // strict session (401 when logged out) — still used by protected views if you want
  me: () => req('/me'),

  login: ({ email, password }) => req('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => req('/auth/logout', { method: 'POST' }),

  // sign-up (OTP)
  signupInitiate: ({ name, email, password }) =>
    req('/auth/signup/initiate', { method: 'POST', body: { name, email, password } }),
  signupVerify: ({ email, otp }) =>
    req('/auth/signup/verify', { method: 'POST', body: { email, otp } }),

  // profile
  updateProfile: (patch) => req('/me/profile', { method: 'PATCH', body: patch }),

  // cart
  getCart: () => req('/me/cart'),
  saveCart: (cart) => req('/me/cart', { method: 'PUT', body: { cart } }),
  putCart: (cart) => req('/me/cart', { method: 'PUT', body: { cart } }), // alias for consistency

  // orders
  getOrders: () => req('/me/orders'),
  placeOrder: (order) => req('/me/orders', { method: 'POST', body: { order } }),
  postOrder: (order) => req('/me/orders', { method: 'POST', body: { order } }),

  // for older code paths expecting { orderId }
  async createOrder(order) {
    const data = await req('/me/orders', { method: 'POST', body: { order } });
    return { orderId: data?.order?.id || data?.id };
  },

  // single order fetch
  getOrder: (orderId) => req(`/me/orders/${encodeURIComponent(orderId)}`)
};
