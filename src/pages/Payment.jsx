// shopkart/src/pages/Payment.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import "../styles/payment.css";

const isZip = (v) => /^\d{5,6}$/.test(v.trim());
const isPhone = (v) => /^\d{10}$/.test(v.trim());
const isUpi = (v) => /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(v.trim());

// ---------- Per-user local address helpers ----------
const ADDR_PREFIX = "sk_addr:";

function readAddr(email) {
  try {
    if (!email) return null;
    const raw = localStorage.getItem(`${ADDR_PREFIX}${email}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeAddr(email, addr) {
  try {
    if (!email) return;
    localStorage.setItem(`${ADDR_PREFIX}${email}`, JSON.stringify(addr));
  } catch {}
}
function clearAddr(email) {
  try {
    if (!email) return;
    localStorage.removeItem(`${ADDR_PREFIX}${email}`);
  } catch {}
}

export default function Payment() {
  const { user } = useAuth();
  const { cart, totals, clear } = useCart();
  const navigate = useNavigate();

  // Remember whether page loaded with items to avoid a redirect loop
  const loadedWithItemsRef = useRef(cart.length > 0);

  // ---------- State (declare BEFORE any return) ----------
  const [payMode, setPayMode] = useState("COD");
  const [addr, setAddr] = useState({
    name: user?.name || "",
    line1: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
  });
  const [upiId, setUpiId] = useState("");
  const [rememberAddr, setRememberAddr] = useState(true);
  const [tried, setTried] = useState(false);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  // Load the saved address for THIS user (if any) whenever user changes
  useEffect(() => {
    const saved = readAddr(user?.email);
    setAddr(
      saved || {
        name: user?.name || "",
        line1: "",
        city: "",
        state: "",
        zip: "",
        phone: "",
      }
    );
    setUpiId("");
    setTried(false); // ✅ (fixed the earlier typo)
    setError("");
  }, [user?.email, user?.name]);

  const invalid = useMemo(() => {
    const flags = {
      name: addr.name.trim().length < 2,
      line1: addr.line1.trim().length < 3,
      city: addr.city.trim().length < 2,
      state: addr.state.trim().length < 2,
      zip: !isZip(addr.zip),
      phone: !isPhone(addr.phone),
      upi: payMode === "UPI" && !isUpi(upiId),
    };
    return flags;
  }, [addr, upiId, payMode]);

  const validAddress =
    !invalid.name &&
    !invalid.line1 &&
    !invalid.city &&
    !invalid.state &&
    !invalid.zip &&
    !invalid.phone;

  const validPayment = payMode === "COD" ? true : !invalid.upi;
  const formReady = validAddress && validPayment;

  const focusFirstInvalid = () => {
    const order = [
      ["name", "addr-name"],
      ["line1", "addr-line1"],
      ["city", "addr-city"],
      ["state", "addr-state"],
      ["zip", "addr-zip"],
      ["phone", "addr-phone"],
      ["upi", "upi-id"],
    ];
    const firstBad = order.find(([key]) => invalid[key]);
    if (firstBad) {
      const el = document.getElementById(firstBad[1]);
      el?.focus();
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const placeOrder = async () => {
    if (placing) return;
    setPlacing(true);
    setTried(true);
    setError("");

    if (!formReady) {
      focusFirstInvalid();
      setPlacing(false);
      return;
    }

    try {
      // Build full order with items so confirmation page can render them
      const order = {
        id: `SK-${Date.now()}`, // client-side id; server keeps it
        items: cart.map((i) => ({
          id: i.id ?? i.productId ?? String(i.title),
          title: i.title,
          qty: i.qty,
          price: i.price,
          image: i.image,
        })),
        total: totals.amount,
        payment: { mode: payMode, upiId: payMode === "UPI" ? upiId.trim() : null },
        address: addr,
        createdAt: Date.now(),
      };

      const { order: saved } = await api.placeOrder(order);

      // Persist or clear address for THIS user on this device
      if (rememberAddr) writeAddr(user?.email, addr);
      else clearAddr(user?.email);

      // Navigate to confirmation FIRST, then clear cart on next tick
      navigate(`/order-confirmation/${saved.id}`);
      setTimeout(() => clear(), 0);
    } catch (e) {
      setError(e.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  // ---------- Guards (after hooks) ----------
  if (!user) return <Navigate to="/login" replace />;
  // Only redirect if the page originally loaded without items (normal guard),
  // not after we clear the cart ourselves post‑order.
  if (!loadedWithItemsRef.current) return <Navigate to="/cart" replace />;

  return (
    <div className="page container payment-page">
      <header className="pay-head">
        <h2 className="pay-title">Payment &amp; Delivery</h2>
        <p className="pay-sub">Choose your payment method and confirm your delivery address.</p>
      </header>

      <div className="pay-grid">
        <section className="card pay-card">
          <h3 className="section-title">Shipping Address</h3>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="addr-name">Name</label>
              <input
                id="addr-name"
                className={`input ${tried && invalid.name ? "invalid" : ""}`}
                value={addr.name}
                onChange={(e) => setAddr({ ...addr, name: e.target.value })}
                placeholder="Full name"
              />
            </div>

            <div className="field">
              <label htmlFor="addr-line1">Address Line</label>
              <input
                id="addr-line1"
                className={`input ${tried && invalid.line1 ? "invalid" : ""}`}
                value={addr.line1}
                onChange={(e) => setAddr({ ...addr, line1: e.target.value })}
                placeholder="Street address, area"
              />
            </div>

            <div className="field">
              <label htmlFor="addr-city">City</label>
              <input
                id="addr-city"
                className={`input ${tried && invalid.city ? "invalid" : ""}`}
                value={addr.city}
                onChange={(e) => setAddr({ ...addr, city: e.target.value })}
                placeholder="City"
              />
            </div>

            <div className="field">
              <label htmlFor="addr-state">State</label>
              <input
                id="addr-state"
                className={`input ${tried && invalid.state ? "invalid" : ""}`}
                value={addr.state}
                onChange={(e) => setAddr({ ...addr, state: e.target.value })}
                placeholder="State"
              />
            </div>

            <div className="field">
              <label htmlFor="addr-zip">Pincode</label>
              <input
                id="addr-zip"
                className={`input ${tried && invalid.zip ? "invalid" : ""}`}
                value={addr.zip}
                onChange={(e) => setAddr({ ...addr, zip: e.target.value })}
                placeholder="6-digit code"
              />
            </div>

            <div className="field">
              <label htmlFor="addr-phone">Phone</label>
              <input
                id="addr-phone"
                className={`input ${tried && invalid.phone ? "invalid" : ""}`}
                value={addr.phone}
                onChange={(e) => setAddr({ ...addr, phone: e.target.value })}
                placeholder="10-digit mobile"
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: 6 }}>
            <label
              style={{ display: "inline-flex", gap: 8, alignItems: "center", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={rememberAddr}
                onChange={(e) => setRememberAddr(e.target.checked)}
              />
              <span>Remember this address on this device</span>
            </label>
          </div>

          <h3 className="section-title">Payment Method</h3>
          <div className="pay-methods">
            <label className="radio">
              <input
                type="radio"
                name="payMode"
                checked={payMode === "COD"}
                onChange={() => setPayMode("COD")}
              />
              <span>Cash on Delivery (COD)</span>
            </label>

            <label className="radio">
              <input
                type="radio"
                name="payMode"
                checked={payMode === "UPI"}
                onChange={() => setPayMode("UPI")}
              />
              <span>UPI</span>
            </label>
          </div>

          {payMode === "UPI" && (
            <div className="field upi-field">
              <label htmlFor="upi-id">UPI ID</label>
              <input
                id="upi-id"
                className={`input ${tried && invalid.upi ? "invalid" : ""}`}
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@bank"
              />
              <div className="muted">We’ll request a collect payment on this UPI ID.</div>
            </div>
          )}

          {tried && !formReady && (
            <div className="pay-note warn" role="status" aria-live="polite">
              Please fill the form first to place your order.
            </div>
          )}
          {error && (
            <div className="pay-note err" role="status" aria-live="polite">
              {error}
            </div>
          )}

          <button className="co-btn co-btn--primary pay-cta" onClick={placeOrder} disabled={placing}>
            {placing ? "Placing…" : "Place Order"}
          </button>
        </section>

        <aside className="card pay-summary">
          <h3 className="section-title">Order Summary</h3>
          <ul className="sum-list">
            {cart.map((i, idx) => {
              const k = `${String(i.id ?? i.productId ?? "row")}#${idx}`;
              return (
                <li className="sum-line" key={k}>
                  <img src={i.image} alt={i.title} className="sum-thumb" />
                  <div className="sum-meta">
                    <div className="sum-title">{i.title}</div>
                    <div className="sum-sub">× {i.qty}</div>
                  </div>
                  <div className="sum-price">
                    ₹{(i.price * i.qty).toLocaleString("en-IN")}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="sum-total">
            <span>Total</span>
            <strong>₹{totals.amount.toLocaleString("en-IN")}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}
