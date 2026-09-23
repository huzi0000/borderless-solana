import { cn } from "@/lib/utils";

interface PriceChangeProps {
  value: number;
  percent: number;
  className?: string;
  showSign?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PriceChange({
  value,
  percent,
  className,
  showSign = true,
  size = "md",
}: PriceChangeProps) {
  const isPositive = percent >= 0;
  const sign = isPositive ? "+" : "";

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base font-medium",
  };

  return (
    <span
      className={cn(
        sizeClasses[size],
        isPositive ? "text-emerald-400" : "text-red-400",
        className
      )}
    >
      {showSign && sign}
      {value.toFixed(2)} ({sign}
      {percent.toFixed(2)}%)
    </span>
  );
}

interface PercentBadgeProps {
  percent: number;
  className?: string;
}

export function PercentBadge({ percent, className }: PercentBadgeProps) {
  const isPositive = percent >= 0;
  const sign = isPositive ? "+" : "";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium tabular-nums",
        isPositive
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-red-500/10 text-red-400",
        className
      )}
    >
      {sign}
      {percent.toFixed(2)}%
    </span>
  );
}
