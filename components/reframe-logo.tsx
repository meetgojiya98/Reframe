"use client";

import { cn } from "@/lib/utils";

type ReframeLogoProps = {
  /** "mark" = icon only, "full" = mark + wordmark "Reframe" */
  variant?: "mark" | "full";
  /** Size: numeric (px) or Tailwind-style. For "full", height controls overall scale. */
  size?: number | "sm" | "md" | "lg" | "xl";
  className?: string;
  /** When true, wordmark uses gradient text (hero style) */
  gradientWordmark?: boolean;
};

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64
};

export function ReframeLogo({
  variant = "full",
  size = "md",
  className,
  gradientWordmark = false
}: ReframeLogoProps) {
  const px = typeof size === "number" ? size : sizeMap[size as keyof typeof sizeMap];
  const markSize = px;

  return (
    <span
      className={cn("inline-flex items-center gap-2 font-serif font-semibold tracking-tight", className)}
      style={variant === "mark" ? { width: markSize, height: markSize } : undefined}
    >
      <ReframeMark size={markSize} />
      {variant === "full" && (
        <span
          className={gradientWordmark ? "gradient-text" : "text-foreground"}
          style={{ fontSize: markSize * 0.65, lineHeight: 1 }}
        >
          Reframe
        </span>
      )}
    </span>
  );
}

/** Icon-only mark: abstract "reframe" symbol — frame opening to new perspective. */
function ReframeMark({ size = 32 }: { size?: number }) {
  const v = 40; // viewBox 0 0 40 40 for crisp scaling
  const pad = 4;
  const c = (v - pad * 2) / 2 + pad; // center 20,20
  const r = 12; // outer radius
  const r2 = 6; // inner arc

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${v} ${v}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden
    >
      <defs>
        <linearGradient
          id="reframe-logo-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="hsl(168, 52%, 42%)" />
          <stop offset="50%" stopColor="hsl(160, 60%, 48%)" />
          <stop offset="100%" stopColor="hsl(145, 50%, 38%)" />
        </linearGradient>
        <linearGradient
          id="reframe-logo-subtle"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="hsl(168, 52%, 38%)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="hsl(145, 50%, 35%)" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* Outer frame arc — open circle (reframe = new view) */}
      <path
        d={`M ${c - r * 0.6} ${c + r * 0.8} A ${r} ${r} 0 0 1 ${c + r} ${c} A ${r} ${r} 0 0 1 ${c - r * 0.6} ${c - r * 0.8}`}
        stroke="url(#reframe-logo-gradient)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner "shift" arc */}
      <path
        d={`M ${c - r2 * 0.8} ${c + r2 * 0.6} Q ${c} ${c - r2} ${c + r2 * 0.8} ${c + r2 * 0.6}`}
        stroke="url(#reframe-logo-subtle)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Focal point */}
      <circle cx={c} cy={c} r="2.2" fill="url(#reframe-logo-gradient)" />
    </svg>
  );
}

export { ReframeMark };
