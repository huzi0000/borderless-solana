"use client";

import { useMemo, useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  generateMockPriceHistory,
  generateMockIntradayHistory,
  type PricePoint,
} from "@/data/assets";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Timeframe = "1D" | "1W" | "1M" | "3M" | "1Y";

const TIMEFRAMES: Timeframe[] = ["1D", "1W", "1M", "3M", "1Y"];

function getDaysForTimeframe(tf: Timeframe): number {
  switch (tf) {
    case "1D":
      return 0;
    case "1W":
      return 7;
    case "1M":
      return 30;
    case "3M":
      return 90;
    case "1Y":
      return 365;
  }
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="rounded-lg border border-surface-border bg-surface px-3 py-2 shadow-lg">
      <p className="text-sm font-medium tabular-nums text-text-primary">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

interface PriceChartProps {
  basePrice: number;
  isPositive: boolean;
  className?: string;
}

export function PriceChart({ basePrice, isPositive, className }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = useMemo((): PricePoint[] => {
    if (timeframe === "1D") {
      return generateMockIntradayHistory(basePrice);
    }
    const days = getDaysForTimeframe(timeframe);
    return generateMockPriceHistory(basePrice, days);
  }, [basePrice, timeframe]);

  const color = isPositive ? "#22c55e" : "#f87171";
  const gradientId = `gradient-${isPositive ? "pos" : "neg"}`;

  const minPrice = Math.min(...data.map((d) => d.price));
  const maxPrice = Math.max(...data.map((d) => d.price));
  const padding = (maxPrice - minPrice) * 0.1;

  // Format X axis labels
  const formatXAxis = (timestamp: number) => {
    if (timeframe === "1D") {
      return new Date(timestamp).toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      });
    }
    return formatDate(timestamp);
  };

  // Reduce tick count for readability
  const tickCount = timeframe === "1D" ? 6 : 5;
  const step = Math.floor(data.length / tickCount);
  const ticks = data
    .filter((_, i) => i % step === 0 || i === data.length - 1)
    .map((d) => d.timestamp);

  return (
    <div className={cn("w-full", className)}>
      {/* Timeframe selector */}
      <div className="mb-4 flex items-center gap-1">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              timeframe === tf
                ? "bg-surface-raised text-text-primary border border-surface-border"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-48 sm:h-56">
        {!mounted ? (
          <div className="h-full w-full animate-pulse rounded-lg bg-surface-raised/40" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={["dataMin", "dataMax"]}
              scale="time"
              ticks={ticks}
              tickFormatter={formatXAxis}
              tick={{ fontSize: 10, fill: "#4a5252" }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              domain={[minPrice - padding, maxPrice + padding]}
              tick={{ fontSize: 10, fill: "#4a5252" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
