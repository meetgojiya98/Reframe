"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CircularGaugeProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  valueClassName?: string;
  label?: string;
}

export function CircularGauge({
  value,
  max = 10,
  size = 80,
  strokeWidth = 8,
  className,
  trackClassName,
  valueClassName,
  label
}: CircularGaugeProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const normalized = Math.min(max, Math.max(0, value));
  const offset = circumference - (normalized / max) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className={cn("text-muted/40", trackClassName)}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className={cn("text-primary", valueClassName)}
          />
        </svg>
        {label && (
          <span
            className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-muted-foreground"
            style={{ fontSize: size * 0.14 }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
