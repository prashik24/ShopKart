// shopkart/src/pages/Dashboard.jsx
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext.jsx'
import { api } from '../api/client.js'
import "../styles/dashboard.css"
import "../styles/select.css"

function initialsOf(name = '') {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase() || '').join('') || 'U'
}
function fmtDate(ms) {
  try {
    return new Date(ms).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return '' }
}

/* ---------------- GenderSelect ------------------ */
function GenderSelect({ value, onChange }) {
  const opts = ["Male", "Female", "Prefer not to say"];
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, []);

  const openNow   = () => { clearTimeout(closeTimer.current); setOpen(true); };
  const closeSoon = () => { clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setOpen(false), 120); };

  return (
    <div ref={rootRef} className={`sk-select ${open ? "is-open" : ""}`} data-align="left">
      <button type="button" className="sk-select-trigger" aria-haspopup="listbox" aria-expanded={open}>
        <span className="sk-select-value">{value}</span>
        <span className="chev" onMouseEnter={openNow} onMouseLeave={closeSoon} aria-hidden>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && (
        <ul className="sk-select-menu" role="listbox" aria-label="Gender" onMouseEnter={openNow} onMouseLeave={closeSoon}>
          {opts.map((opt) => (
            <li
              key={opt}
              className="sk-select-item"
              aria-selected={opt === value}
              onMouseDown={(e) => { e.preventDefault(); onChange(opt); setOpen(false); }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------------------- Dashboard ----------------------------- */
export default function Dashboard() {
  const { user, update, logout } = useAuth();
  const { cart } = useCart(); // not used directly, but keeps context in sync if needed
  const navigate = useNavigate();

  // Hooks first
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [reorderingId, setReorderingId] = useState(null);
  const [error, setError] = useState("");

  // Load orders when user is present
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!user) return;
      setOrdersLoading(true);
      setError("");
      try {
        const { orders } = await api.getOrders();
        if (!ignore) setOrders(orders || []);
      } catch (e) {
        if (!ignore) {
          setOrders([]);
          setError(e.message || "Failed to load orders");
        }
      } finally {
        if (!ignore) setOrdersLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [user]);

  const myOrders = useMemo(() => {
    return (orders || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders]);

  const [form, setForm] = useState({
    name: user?.name || '',
    gender: user?.gender || 'Prefer not to say'
  });
  const canSave = form.name.trim().length >= 2;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaved(false);
    try {
      await update?.({ name: form.name.trim(), gender: form.gender });
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  // Reorder: push items into server cart then go to cart
  const reorder = async (o) => {
    if (!o?.items?.length) return;
    setReorderingId(o.id);
    try {
      const cartShape = o.items.map(it => ({
        productId: String(it.id ?? it.productId ?? it.title),
        title: it.title,
        price: Number(it.price || 0),
        image: it.image || "",
        qty: Math.max(1, Number(it.qty || 1))
      }));
      await api.putCart(cartShape);
      navigate('/cart');
    } catch (e) {
      setError(e.message || "Failed to reorder");
    } finally {
      setReorderingId(null);
    }
  };

  // Guard after hooks
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="page container dashboard-page">
      <header className="dash-head">
        <div>
          <h2 className="dash-title">My Profile</h2>
          <p className="dash-sub">Manage your account details and view recent orders.</p>
        </div>
      </header>

      <div className="dash-grid">
        {/* LEFT — Profile card */}
        <section className="card prof-card">
          <div className="prof-top">
            <div className="avatar" aria-hidden="true">{initialsOf(user.name)}</div>
            <div className="who">
              <div className="n">{user.name}</div>
              <div className="e">{user.email}</div>
              {user.createdAt && <div className="m">Member since {fmtDate(user.createdAt)}</div>}
            </div>
          </div>

          <div className="prof-form">
            <div className="field">
              <label htmlFor="pf-name">Full name</label>
              <input
                id="pf-name"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
              />
            </div>

            <div className="field">
              <label>Gender</label>
              <GenderSelect
                value={form.gender}
                onChange={(g) => setForm({ ...form, gender: g })}
              />
            </div>

            {saved && <div className="note ok">Profile updated</div>}
            {error && <div className="note ok" style={{ background:'#fff7f7', border:'1px solid #ffd0c8', color:'#b12704' }}>{error}</div>}

            <div className="prof-actions">
              <button className="dash-btn dash-btn--primary" onClick={onSave} disabled={!canSave || saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button className="dash-btn dash-btn--outline" onClick={onLogout}>
                Logout
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT — Recent Orders */}
        <section className="card orders-card">
          <h3 className="section-title">Recent Orders</h3>

          {ordersLoading ? (
            <p className="muted">Loading your orders…</p>
          ) : myOrders.length === 0 ? (
            <div className="empty">
              <p className="muted">No orders yet.</p>
              <Link className="dash-btn dash-btn--primary" to="/catalog">Start shopping</Link>
            </div>
          ) : (
            <>
              <ul className="orders-list">
                {myOrders.slice(0, 6).map(o => (
                  <li key={o.id} className="order-row">
                    <Link to={`/order-confirmation/${o.id}`} className="oid">{o.id}</Link>
                    <span className="pay">{o.payment?.mode === 'UPI' ? 'UPI' : 'Cash on Delivery'}</span>
                    <span className="amt">₹{Number(o.total).toLocaleString('en-IN')}</span>
                  </li>
                ))}
              </ul>

              {/* Actions under list */}
              <div className="orders-actions">
                <Link className="dash-btn dash-btn--outline" to="/catalog">Shop more</Link>
                {myOrders.length > 0 && (
                  <button
                    className="dash-btn dash-btn--primary"
                    onClick={() => reorder(myOrders[0])}
                    disabled={!!reorderingId}
                    title="Reorder your most recent order"
                  >
                    {reorderingId ? "Reordering…" : "Reorder last order"}
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
