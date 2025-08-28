import { useMemo } from "react";
import { Link, useParams, Navigate } from "react-router-dom";

/* IMPORTANT: bring in your existing button styles + our page styles */
import "../styles/checkout.css";              // for .co-btn / button effects
import "../styles/order-confirmation.css";    // for .oc-* layout & look

const LS_ORDERS = "shopkart_orders_v1";

export default function OrderConfirmation() {
  const { orderId } = useParams();

  const order = useMemo(() => {
    const list = JSON.parse(localStorage.getItem(LS_ORDERS) || "[]");
    return list.find((o) => String(o.id) === String(orderId));
  }, [orderId]);

  if (!order) return <Navigate to="/" replace />;

  return (
    <div className="page container oc-page">
      <div className="oc-card">
        <div className="oc-head">
          <div className="oc-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none">
              <circle cx="12" cy="12" r="10" />
              <path d="M7 12l3 3 7-7" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <h2 className="oc-title">Order placed successfully!</h2>
            <p className="oc-sub">
              Your order <b>{order.id}</b> has been placed.
            </p>
          </div>
        </div>

        <div className="oc-grid">
          {/* Items */}
          <section>
            <h3 className="oc-section-title">Items</h3>
            <ul className="oc-list">
              {order.items.map((it) => (
                <li key={it.id} className="oc-line">
                  <img src={it.image} alt={it.title} className="oc-thumb" />
                  <div className="oc-meta">
                    <div className="oc-line-title">{it.title}</div>
                    <div className="oc-qty">× {it.qty}</div>
                  </div>
                  <div className="oc-price">₹{it.price.toLocaleString("en-IN")}</div>
                </li>
              ))}
            </ul>
          </section>

          {/* Summary */}
          <aside className="oc-summary">
            <h3 className="oc-section-title">Summary</h3>
            <div className="oc-srow">
              <span>Payment</span>
              <strong>{order.payment?.mode === "UPI" ? "UPI" : "Cash on Delivery"}</strong>
            </div>
            <div className="oc-srow">
              <span>Total</span>
              <strong>₹{order.total.toLocaleString("en-IN")}</strong>
            </div>

            <div className="oc-ship">
              <div className="oc-ship-title">Deliver to</div>
              <div className="oc-ship-text">
                {order.address?.name}
                <br />
                {order.address?.line1}
                <br />
                {order.address?.city}, {order.address?.state} {order.address?.zip}
                <br />
                Phone: {order.address?.phone}
              </div>
            </div>
          </aside>
        </div>

        {/* Actions — use your existing .co-btn styles */}
        <div className="oc-actions">
          <Link to="/catalog" className="co-btn co-btn--outline">Continue shopping</Link>
          {/* point this to your orders/dashboard page as you prefer */}
          <Link to="/dashboard" className="co-btn co-btn--primary">View orders</Link>
        </div>
      </div>
    </div>
  );
}
