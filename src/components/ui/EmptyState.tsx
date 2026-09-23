import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-surface-border bg-surface-raised text-text-muted">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-sm font-medium text-text-primary">{title}</h3>
      {description && (
        <p className="mb-6 max-w-xs text-sm text-text-secondary leading-relaxed">{description}</p>
      )}
      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent/90"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent/90"
            >
              {action.label}
            </button>
          )}
        </>
      )}
    </div>
  );
}
