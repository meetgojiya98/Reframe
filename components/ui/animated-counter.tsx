"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export function AnimatedCounter({ value, duration = 0.5, className = "", suffix = "", prefix = "" }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = display;
    const startTime = performance.now();
    const cancel = () => rafRef.current && cancelAnimationFrame(rafRef.current);

    const step = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplay(Math.round(start + (value - start) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- display is derived from value, adding it would loop
  }, [value, duration]);

  return (
    <motion.span
      className={className}
      key={value}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {prefix}{display}{suffix}
    </motion.span>
  );
}
