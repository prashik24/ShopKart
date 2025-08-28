import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";     // NEW
import "../styles/card.css";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { add } = useCart();
  const { user } = useAuth();                             // NEW

  const goDetail = () => navigate(`/product/${product.id}`);

  const onAdd = (e) => {
    e.preventDefault();      // stop <Link> navigation
    e.stopPropagation();     // stop card click

    // NEW: if not logged in, send to login with intent to add this product
    if (!user) {
      navigate(`/login?intent=add&pid=${encodeURIComponent(product.id)}&next=${encodeURIComponent('/cart')}`);
      return;
    }
    add(product);
  };

  return (
    <article
      className="card card--lift"
      onClick={goDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && goDetail()}
      style={{ cursor: "pointer" }}
      aria-label={`${product.title} — details`}
    >
      <div className="img-wrap">
        <img src={product.image} alt={product.title} loading="lazy" />
      </div>

      <div className="card-body">
        <Link
          to={`/product/${product.id}`}
          onClick={(e) => e.preventDefault()}
          className="card-title"
        >
          {product.title}
        </Link>

        {product.desc && <p className="card-desc">{product.desc}</p>}

        <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <div className="price">₹{Number(product.price).toLocaleString("en-IN")}</div>
          <button type="button" className="btn btn-solid" onClick={onAdd}>
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}
