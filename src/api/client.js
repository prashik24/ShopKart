// shopkart/src/api/client.js

/**
 * Normalizes the API base so it ALWAYS ends with `/api`
 * and has no trailing slash before that.
 */
function normalizeBase(input) {
  // Default when env var is missing
  let base =
    input ||
    (import.meta.env.MODE === "production"
      ? "https://shopkart-backend-a55g.onrender.com/api"
      : "http://localhost:4000/api");

  // Trim trailing slashes
  base = base.replace(/\/+$/, "");

  // Ensure it ends with /api
  if (!/\/api$/i.test(base)) base += "/api";

  return base;
}

// Prefer VITE_API_BASE if present; normalize either way
const BASE = normalizeBase(import.meta.env.VITE_API_BASE);

async function req(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // send/receive auth cookies
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    // allow empty body
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
  me: () => req("/me"),           // strict (401 if not logged in)

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

  // Back-compat for code that expects { orderId }
  async createOrder(order) {
    const data = await req("/me/orders", { method: "POST", body: { order } });
    return { orderId: data?.order?.id || data?.id };
  },

  // --- single order ---
  getOrder: (orderId) => req(`/me/orders/${encodeURIComponent(orderId)}`),
};
