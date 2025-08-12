import { useEffect, useRef, useState } from "react";
import s from "./LightSelect.module.css";

/**
 * Props:
 *  - options: [{ value: string|number, label: string }]
 *  - value: string|number
 *  - onChange: (val) => void
 *  - placeholder?: string ("All Types")
 *  - width?: number (default 270)
 *  - className?: string (optional wrapper class from parent if needed)
 */
export default function LightSelect({
  options = [],
  value,
  onChange,
  placeholder = "All Types",
  width = 270,
  className = ""
}) {
  const [open, setOpen] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(-1);
  const wrapRef = useRef(null);

  const current = options.find(o => String(o.value) === String(value));
  const display = current ? current.label : placeholder;
  const isPlaceholder = !current;

  // Close on outside click or Escape
  useEffect(() => {
    function handleDoc(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    function handleEsc(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", handleDoc);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleDoc);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // Keyboard nav when menu is open
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (!options.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHoverIdx(i => Math.min(options.length - 1, (i < 0 ? 0 : i + 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHoverIdx(i => Math.max(0, (i < 0 ? options.length - 1 : i - 1)));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (hoverIdx >= 0) {
          const opt = options[hoverIdx];
          onChange?.(opt.value);
          setOpen(false);
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, options, hoverIdx, onChange]);

  return (
    <div
      ref={wrapRef}
      className={`${s.lsWrap} ${className || ""}`}
      style={{ width }}
    >
      <button
        type="button"
        className={s.lsControl}
        style={{ width }}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={isPlaceholder ? s.lsPlaceholder : s.lsValue}>
          {display}
        </span>
        <span className={s.lsCaret} />
      </button>

      {open && (
        <div className={s.lsMenu} role="listbox" style={{ width }}>
          {options.map((opt, idx) => {
            const active = String(opt.value) === String(value);
            const hover = idx === hoverIdx;
            return (
              <div
                key={opt.value ?? idx}
                role="option"
                aria-selected={active}
                className={`${s.lsOption} ${hover ? s.isHover : ""} ${active ? s.isActive : ""}`}
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(-1)}
                onClick={() => { onChange?.(opt.value); setOpen(false); }}
                title={opt.label}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
