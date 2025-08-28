// src/pages/ProductDetail.jsx
import { useParams, useNavigate } from 'react-router-dom'
import { products } from '../data/products.js'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'        // NEW
import "../styles/product-detail.css";

export default function ProductDetail(){
  const { id } = useParams()
  const product = products.find(p=>String(p.id)===String(id))
  const { add } = useCart()
  const { user } = useAuth()                                 // NEW
  const navigate = useNavigate()

  if (!product) return <div className="container"><p>Product not found.</p></div>

  const handleAdd = ()=>{
    // NEW: guard add action
    if(!user){
      navigate(`/login?intent=add&pid=${encodeURIComponent(product.id)}&next=${encodeURIComponent('/cart')}`)
      return
    }
    add(product)
  }

  return (
    <div className="page container">
      <div className="pd-row">
        <img src={product.image} alt={product.title} className="pd-image" />
        <div className="pd-info">
          <h2>{product.title}</h2>
          {product.category && (
            <p className="muted">
              Category: {product.category}
              {product.brand ? ` • ${product.brand}` : ""}
            </p>
          )}
          <h3 className="price">₹{product.price.toLocaleString("en-IN")}</h3>
          {product.desc && <p className="pd-desc">{product.desc}</p>}

          {/* CHANGED: use handleAdd instead of add(product) */}
          <button className="btn btn-solid pd-cta" onClick={handleAdd}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
