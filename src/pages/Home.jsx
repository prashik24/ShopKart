// src/pages/Home.jsx
import { Link } from "react-router-dom";
import Slider from "../components/Slider.jsx";
import "../styles/home.css";

/* Make sure these files exist with the exact names/case:
   src/assets/home/Slider1.png
   src/assets/home/Slider2.png
   src/assets/home/Slider3.png
   src/assets/home/hero1.png
   src/assets/home/hero2.png
   src/assets/home/hero3.png
   src/assets/home/hero4.png
*/

// Hero slides
import heroSlide1 from "../assets/home/Slider3.png";
import heroSlide2 from "../assets/home/Slider1.png";
import heroSlide3 from "../assets/home/Slider2.png";

// Tile images
import tileWomenImg from "../assets/home/image3.png";
import tileMenImg   from "../assets/home/image1.png";
import tileKidsImg  from "../assets/home/image2.png";
import tileNewImg   from "../assets/home/image4.png";

const slides = [
  { img: heroSlide1, title: "Fresh Fits for Men",  sub: "Shirt • Pants • Shoes • Watch", cta: "Shop Men",   link: "/catalog/Men" },
  { img: heroSlide2, title: "Styling for Women",     sub: "Dress •  Bags • Kurti • Makeup", cta: "Shop Women", link: "/catalog/Women" },
  { img: heroSlide3, title: "Kids’ Play Edit",     sub: "T-Shirt • Toys • Fork •Caps",     cta: "Shop Kids",  link: "/catalog/Kids" },
];

export default function Home() {
  return (
    <div className="home-page page container">
      {/* Hero */}
      <Slider slides={slides} interval={4500} />

      {/* Value propositions */}
      <div className="valuebar">
        <div className="value">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 7h18v10H3z"/><path d="M3 7l9 6 9-6"/>
          </svg>
          <div><h4>Free Delivery</h4><p>On orders over ₹999</p></div>
        </div>
        <div className="value">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M4 4h16v16H4z"/><path d="M4 10h16"/><path d="M10 4v16"/>
          </svg>
          <div><h4>Easy Returns</h4><p>Within 14 days</p></div>
        </div>
        <div className="value">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="8"/><path d="M8 12h8M12 8v8"/>
          </svg>
          <div><h4>Secure Payments</h4><p>UPI / Cards / Netbanking</p></div>
        </div>
      </div>

      {/* Category tiles (square) */}
      <div className="tile-grid">
        <Link to="/catalog/Women" className="tile">
          <img src={tileWomenImg} alt="Women" loading="lazy" />
          <span className="label">Women</span>
        </Link>
        <Link to="/catalog/Men" className="tile">
          <img src={tileMenImg} alt="Men" loading="lazy" />
          <span className="label">Men</span>
        </Link>
        <Link to="/catalog/Kids" className="tile">
          <img src={tileKidsImg} alt="Kids" loading="lazy" />
          <span className="label">Kids</span>
        </Link>
        <Link to="/catalog" className="tile">
          <img src={tileNewImg} alt="New arrivals" loading="lazy" />
          <span className="label">New Arrivals</span>
        </Link>
      </div>
    </div>
  );
}
