import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import "../styles/cart.css";

function pidOf(item) {
  // Some items might be shaped { id, ... } and others { productId, ... }
  return String(item?.id ?? item?.productId ?? "");
}

export default function Cart() {
  const { cart, inc, dec, remove, clear, totals } = useCart();

  /* ================== EMPTY STATE ================== */
  if (!cart.length) {
    return (
      <div className="main container cart-empty">
        <div className="empty-card">
          <h2 className="empty-title">Your cart is empty</h2>

          {/* friendly bag illustration */}
          <div className="empty-illustration" aria-hidden="true">
            <svg viewBox="0 0 160 160" width="160" height="160">
              <defs>
                <linearGradient id="bagGrad" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="var(--primary)" stopOpacity=".12" />
                  <stop offset="1" stopColor="var(--primary)" stopOpacity=".22" />
                </linearGradient>
              </defs>
              <rect x="10" y="24" width="140" height="118" rx="18" fill="url(#bagGrad)" />
              <rect x="24" y="48" width="112" height="86" rx="14" fill="#fff" stroke="var(--border)" />
              <path
                d="M56 65v-7c0-13 11-23 24-23s24 10 24 23v7"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="56" cy="70" r="4" fill="var(--primary)" />
              <circle cx="104" cy="70" r="4" fill="var(--primary)" />
            </svg>
          </div>

          <p className="empty-sub">
            Looks like you haven’t added anything yet. Let’s find something you’ll love.
          </p>

          <div className="empty-actions">
            <Link to="/catalog" className="btn btn-solid">Start shopping</Link>
            <Link to="/" className="btn">Go to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ================== CART LIST + SUMMARY ================== */
  return (
    <div className="main container cart-wrap">
      <h2 className="cart-page-title">Your Cart</h2>

      <div className="cart-grid">
        {/* Items */}
        <div className="cart-list">
          {cart.map((it, index) => {
            const pid = pidOf(it);
            return (
              <div key={pid || `row-${index}`} className="cart-row">
                <img src={it.image} alt={it.title} className="cart-thumb" />

                <div>
                  <div className="cart-title">{it.title}</div>
                  <div className="cart-price">
                    ₹{Number(it.price).toLocaleString("en-IN")}
                  </div>

                  <div className="cart-qty">
                    <button
                      className="btn qty-btn"
                      aria-label={`Decrease ${it.title}`}
                      onClick={() => dec(pid)}
                    >
                      −
                    </button>
                    <span className="qty" aria-live="polite">{it.qty}</span>
                    <button
                      className="btn qty-btn"
                      aria-label={`Increase ${it.title}`}
                      onClick={() => inc(pid)}
                    >
                      +
                    </button>

                    <button
                      className="btn remove-btn"
                      onClick={() => remove(pid)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="row-total">
                  ₹{(Number(it.price) * Number(it.qty)).toLocaleString("en-IN")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <aside className="summary">
          <h3 className="summary-title">Order Summary</h3>
          <div className="sum-line">
            <span>Total Sum</span>
            <strong>₹{Number(totals.amount).toLocaleString("en-IN")}</strong>
          </div>
          <Link className="btn btn-solid block" to="/checkout">
            Continue to Checkout
          </Link>
          <button className="btn block" onClick={clear}>
            Clear Cart
          </button>
        </aside>
      </div>
    </div>
  );
}
