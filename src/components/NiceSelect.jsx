import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/select.css";

export default function NiceSelect({
  value,
  options = [],
  onChange,
  label = "Select",
  align = "center", // "left" | "right" | "center"
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef(null);
  const closeTimer = useRef(null);

  const current = useMemo(
    () => options.find((o) => o.value === value) || options[0],
    [options, value]
  );

  // Close on outside click (safe with hover behavior)
  useEffect(() => {
    const onDocClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Hover helpers (tiny delay to prevent flicker)
  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  // Keyboard accessibility
  const onTriggerKey = (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive(0);
    }
  };
  const onMenuKey = (e) => {
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min((i < 0 ? 0 : i) + 1, options.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max((i < 0 ? 0 : i) - 1, 0)); }
    if (e.key === "Enter") {
      e.preventDefault();
      const pick = options[active] || current;
      onChange?.(pick.value);
      setOpen(false);
    }
  };

  return (
    <div
      className={`sk-select${open ? " is-open" : ""}`}
      ref={rootRef}
      data-align={align}
    >
      <button
        type="button"
        className="sk-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        // open on hover, not click
        onMouseEnter={() => { cancelClose(); setOpen(true); }}
        onMouseLeave={scheduleClose}
        onClick={(e) => e.preventDefault()}
        onMouseDown={(e) => e.preventDefault()}
        onKeyDown={onTriggerKey}
      >
        <span className="sk-select-value">{current?.label}</span>
        <svg className="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul
          className="sk-select-menu"
          role="listbox"
          tabIndex={-1}
          onKeyDown={onMenuKey}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {options.map((opt, i) => {
            const selected = value === opt.value;
            const isActive = i === active;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={selected}
                className={`sk-select-item${isActive ? " is-active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => { onChange?.(opt.value); setOpen(false); }}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
