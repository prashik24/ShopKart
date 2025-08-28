// shopkart/src/pages/OrderConfirm.jsx
import { Link, useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { api } from "../api/client.js";
import "../styles/order-confirm.css";

export default function OrderConfirm() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { order } = await api.getOrder(orderId);
        if (!mounted) return;
        setOrder(order || null);
        setNotFound(!order);
      } catch {
        if (!mounted) return;
        setNotFound(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [orderId]);

  const items = useMemo(
    () => (Array.isArray(order?.items) ? order.items : []),
    [order]
  );

  const keyFor = (it, idx) =>
    String(it?.productId ?? it?.id ?? it?.sku ?? it?.title ?? "row") + "#" + idx;

  if (loading) {
    return (
      <div className="page container confirm-page">
        <div className="card confirm-card">
          <h2 className="confirm-title">Loading your order…</h2>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="page container confirm-page">
        <div className="card confirm-card">
          <h2 className="confirm-title">Order not found</h2>
          <p className="muted">
            We couldn’t find that order. Try the <Link to="/">home page</Link>.
          </p>
        </div>
      </div>
    );
  }

  // From here on, we have a valid order object.
  const paymentMode =
    order?.payment?.mode === "UPI"
      ? `UPI${order?.payment?.upiId ? ` (${order.payment.upiId})` : ""}`
      : "Cash on Delivery";

  const totalINR = Number(order?.total || 0).toLocaleString("en-IN");

  return (
    <div className="page container confirm-page">
      <div className="card confirm-card">
        <div className="confirm-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <path d="M7 13l3 3 7-7" />
          </svg>
        </div>

        <h2 className="confirm-title">Order placed successfully!</h2>
        <p className="muted">
          Your order <b>{order?.id || `SK-${orderId}`}</b> has been placed.
        </p>

        <div className="confirm-grid">
          <section>
            <h3 className="section-title">Items</h3>
            {items.length === 0 ? (
              <p className="muted">No line items were returned for this order.</p>
            ) : (
              <ul className="items">
                {items.map((i, idx) => (
                  <li key={keyFor(i, idx)} className="item">
                    {i?.image ? (
                      <img src={i.image} alt={i?.title || "Item"} />
                    ) : (
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 10,
                          border: "1px solid var(--ring)",
                          background: "#fff7ed",
                        }}
                        aria-hidden
                      />
                    )}
                    <div className="meta">
                      <div className="t">{i?.title || "Item"}</div>
                      <div className="s">× {i?.qty || 1}</div>
                    </div>
                    <div className="p">
                      ₹{Number((i?.price || 0) * (i?.qty || 1)).toLocaleString("en-IN")}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="sum">
            <h3 className="section-title">Summary</h3>
            <div className="line">
              <span>Payment</span>
              <span>{paymentMode}</span>
            </div>
            <div className="line">
              <span>Total</span>
              <b>₹{totalINR}</b>
            </div>

            <h3 className="section-title">Deliver to</h3>
            <div className="addr">
              {order?.address?.name && <div>{order.address.name}</div>}
              {order?.address?.line1 && <div>{order.address.line1}</div>}
              {(order?.address?.city || order?.address?.state || order?.address?.zip) && (
                <div>
                  {order.address.city ? `${order.address.city}, ` : ""}
                  {order.address.state ? `${order.address.state} ` : ""}
                  {order.address.zip || ""}
                </div>
              )}
              {order?.address?.phone && <div>Phone: {order.address.phone}</div>}
            </div>
          </aside>
        </div>

        <div className="actions">
          <Link className="co-btn co-btn--outline" to="/catalog">
            Continue shopping
          </Link>
          <Link className="co-btn co-btn--primary" to="/dashboard">
            View orders
          </Link>
        </div>
      </div>
    </div>
  );
}
