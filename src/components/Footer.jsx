import { Link } from "react-router-dom";
import "../styles/footer.css";

export default function Footer(){
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="wrap">
        <div>
          <div className="brand brand--footer">Shop<span className="accent">Kart</span></div>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/catalog/Women">Women</Link></li>
            <li><Link to="/catalog/Men">Men</Link></li>
            <li><Link to="/catalog/Kids">Kids</Link></li>
          </ul>
        </div>

        <div>
          <h4>Customer Policies</h4>
          <ul>
            <li><Link to="#">Shipping</Link></li>
            <li><Link to="#">Returns</Link></li>
            <li><Link to="#">FAQs</Link></li>
            <li><Link to="#">Support</Link></li>
          </ul>
        </div>

        <div>
          <h4>Useful Links</h4>
          <ul>
            <li><Link to="#">About</Link></li>
            <li><Link to="#">Contact</Link></li>
            <li><Link to="#">Terms</Link></li>
            <li><Link to="#">Privacy</Link></li>
          </ul>
        </div>
      </div>

      <div className="copyright">© {year} ShopKart. All rights reserved.</div>
    </footer>
  );
}
