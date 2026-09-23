import { Asset } from "@/data/assets";
import { cn } from "@/lib/utils";

interface AssetLogoProps {
  asset: Pick<Asset, "logoInitials" | "logoColor" | "companyName"> & {
    logoUrl?: string;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: { outer: "h-7 w-7", text: "text-xs" },
  md: { outer: "h-9 w-9", text: "text-sm" },
  lg: { outer: "h-11 w-11", text: "text-base" },
  xl: { outer: "h-14 w-14", text: "text-lg" },
};

export function AssetLogo({ asset, size = "md", className }: AssetLogoProps) {
  const { outer, text } = sizeMap[size];

  if (asset.logoUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg overflow-hidden bg-white/5 border border-surface-border flex-shrink-0",
          outer,
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.logoUrl}
          alt={asset.companyName}
          className="h-full w-full object-contain p-0.5"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg font-semibold text-white flex-shrink-0",
        outer,
        className
      )}
      style={{ backgroundColor: asset.logoColor + "33", border: `1px solid ${asset.logoColor}44` }}
      aria-label={asset.companyName}
    >
      <span
        className={cn("font-bold leading-none", text)}
        style={{ color: asset.logoColor === "#555555" ? "#aaaaaa" : asset.logoColor }}
      >
        {asset.logoInitials}
      </span>
    </div>
  );
}
