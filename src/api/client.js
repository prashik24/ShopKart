// shopkart/src/api/client.js

// Dynamically choose backend API base
const BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.MODE === "production"
    ? "https://shopkart-backend-o34d.onrender.com/api"
    : "http://localhost:4000/api");

async function req(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // ✅ needed for auth cookies
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    // ignore empty body
  }

  if (!res.ok) {
    const err = data?.error || `Request failed (${res.status})`;
    throw new Error(err);
  }
  return data;
}

export const api = {
  // --- sessions ---
  session: () => req("/session"), // soft (never 401s)
  me: () => req("/me"), // strict (401 if not logged in)

  // --- auth ---
  login: ({ email, password }) =>
    req("/auth/login", { method: "POST", body: { email, password } }),
  logout: () => req("/auth/logout", { method: "POST" }),

  // --- signup + OTP ---
  signupInitiate: ({ name, email, password }) =>
    req("/auth/signup/initiate", {
      method: "POST",
      body: { name, email, password },
    }),
  signupVerify: ({ email, otp }) =>
    req("/auth/signup/verify", { method: "POST", body: { email, otp } }),

  // --- profile ---
  updateProfile: (patch) =>
    req("/me/profile", { method: "PATCH", body: patch }),

  // --- cart ---
  getCart: () => req("/me/cart"),
  saveCart: (cart) => req("/me/cart", { method: "PUT", body: { cart } }),
  putCart: (cart) => req("/me/cart", { method: "PUT", body: { cart } }), // alias

  // --- orders ---
  getOrders: () => req("/me/orders"),
  placeOrder: (order) =>
    req("/me/orders", { method: "POST", body: { order } }),
  postOrder: (order) =>
    req("/me/orders", { method: "POST", body: { order } }),

  // backwards compatibility for Payment.jsx expecting { orderId }
  async createOrder(order) {
    const data = await req("/me/orders", { method: "POST", body: { order } });
    return { orderId: data?.order?.id || data?.id };
  },

  // --- single order ---
  getOrder: (orderId) => req(`/me/orders/${encodeURIComponent(orderId)}`),
};
