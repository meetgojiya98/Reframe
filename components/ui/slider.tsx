"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SliderProps = {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
  label: string;
};

export function Slider({
  min = 0,
  max = 10,
  step = 1,
  value,
  onValueChange,
  className,
  label
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <input
        aria-label={label}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary"
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onValueChange(Number(event.target.value))}
        style={{
          background: `linear-gradient(90deg, hsl(var(--primary)) ${percent}%, hsl(var(--secondary)) ${percent}%)`
        }}
      />
    </div>
  );
}
