import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import "../styles/checkout.css";

function pidOf(item) {
  return String(item?.id ?? item?.productId ?? "");
}

export default function Checkout(){
  const { cart, totals } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const goPayment = ()=>{
    if(!user){
      navigate('/login', { replace:true });
      return;
    }
    navigate('/payment', { replace:true });
  };

  return (
    <div className="page container checkout-page">
      <header className="checkout-head">
        <h2 className="checkout-title">Secure Checkout</h2>
        <p className="checkout-sub">
          Review your items and proceed to payment. COD and UPI are supported.
        </p>
      </header>

      <section className="card checkout-card">
        <h3 className="section-title">Order Summary</h3>

        <ul className="summary-list">
          {cart.map((i, index) => (
            <li key={pidOf(i) || `sum-${index}`} className="summary-line">
              <span className="sl-title">{i.title}</span>
              <span className="sl-mult">× {i.qty}</span>
              <span className="sl-sep">·</span>
              <span className="sl-price">₹{Number(i.price).toLocaleString("en-IN")}</span>
            </li>
          ))}
        </ul>

        <div className="summary-total">
          <span>Total</span>
          <strong>₹{Number(totals.amount).toLocaleString("en-IN")}</strong>
        </div>
      </section>

      <div className="checkout-actions">
        <Link className="co-btn co-btn--outline" to="/cart">Back to Cart</Link>
        <button className="co-btn co-btn--primary" onClick={goPayment}>
          {user ? "Continue to Payment" : "Login to Continue"}
        </button>
      </div>
    </div>
  );
}
