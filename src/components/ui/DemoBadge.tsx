import { cn } from "@/lib/utils";

interface DemoBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function DemoBadge({ className, size = "sm" }: DemoBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 font-medium tracking-wide uppercase",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
      Demo data
    </span>
  );
}
