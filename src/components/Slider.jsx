// src/components/Slider.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function Slider({ slides = [], interval = 4500 }) {
  const [idx, setIdx] = useState(0);
  const timer = useRef(null);
  const n = slides.length;

  useEffect(() => {
    start();
    // keep autoplay even if tab focus changes
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line
  }, [idx, n, interval]);

  const start = () => {
    stop();
    if (n > 1) timer.current = setTimeout(() => setIdx((i) => (i + 1) % n), interval);
  };
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  if (!n) return null;
  const slide = slides[idx];

  return (
    <div
      className="slider"
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotional slides"
    >
      <img
        className="slide-img"
        src={slide.img}
        alt={slide.title}
        draggable="false"
      />

      <div className="slide-overlay">
        <h2>{slide.title}</h2>
        {slide.sub && <p className="slide-sub">{slide.sub}</p>}
        {slide.cta && (
          <Link className="btn slide-cta" to={slide.link || "/catalog"}>
            {slide.cta}
          </Link>
        )}
      </div>
      {/* Arrows & dots intentionally removed */}
    </div>
  );
}
