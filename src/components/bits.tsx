import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

/* ---------- scene image with crossfade + ken burns ---------- */
export function SceneImage({
  src,
  alt,
  className = "",
  imgClassName = "",
  pan,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  pan?: { x: string; y: string; scale: number };
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <AnimatePresence mode="sync">
        <motion.img
          key={src + (pan ? pan.x + pan.y + pan.scale : "")}
          src={src}
          alt={alt}
          draggable={false}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`${pan ? "" : "kenburns"} scene-fade absolute inset-0 h-full w-full select-none object-contain transition-transform duration-500 ${imgClassName}`}
          style={
            pan
              ? {
                  objectPosition: `${pan.x} ${pan.y}`,
                  transform: `scale(${pan.scale})`,
                  transformOrigin: `${pan.x} ${pan.y}`,
                }
              : undefined
          }
        />
      </AnimatePresence>
    </div>
  );
}

/* ---------- pulsing hotspot ---------- */
export function Hotspot({
  x,
  y,
  label,
  onClick,
  active = false,
  done = false,
  color = "var(--gold)",
  size = 34,
}: {
  x: string;
  y: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  done?: boolean;
  color?: string;
  size?: number;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="hotspot-ring absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full transition-transform hover:scale-110 active:scale-95"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background: done ? "var(--leaf)" : color,
        boxShadow: `0 0 14px 2px ${done ? "rgba(76,138,90,.7)" : "rgba(206,168,78,.65)"}`,
        border: "2px solid rgba(255,255,255,.9)",
        opacity: active || !done ? 1 : 0.85,
      }}
    >
      <span className="sr-only">{label}</span>
      {done && (
        <svg viewBox="0 0 24 24" className="m-auto h-4 w-4" fill="none" stroke="#fff" strokeWidth={3}>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

/* ---------- narration panel ---------- */
export function NarrationPanel({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
      className="pointer-events-auto relative z-30 border-l-2 bg-marine/95 px-5 py-4 shadow-lg backdrop-blur-sm md:px-6"
      style={{ borderColor: "var(--gold)" }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- gold button ---------- */
export function GoldButton({
  children,
  onClick,
  disabled = false,
  variant = "solid",
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "solid" | "outline";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[44px] cursor-pointer px-5 py-2 text-sm font-semibold tracking-[0.14em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        variant === "solid"
          ? "bg-gold text-marine hover:bg-[#ddba63] active:scale-[0.97]"
          : "border border-gold text-golddeep hover:bg-gold/10 active:scale-[0.97]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------- counting number ---------- */
import { useEffect, useRef, useState } from "react";
export function CountUp({
  to,
  decimals = 0,
  duration = 1.4,
  start,
  suffix = "",
  className = "",
}: {
  to: number;
  decimals?: number;
  duration?: number;
  start: boolean;
  suffix?: string;
  className?: string;
}) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (!start) return;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(to * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [start, to, duration]);
  return (
    <span className={className}>
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}
