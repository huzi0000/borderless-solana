export function Footer() {
  return (
    <footer className="border-t border-surface-border mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-sm font-bold text-text-primary">Borderless</span>
            <p className="mt-1 text-xs text-text-muted leading-relaxed max-w-md">
              Borderless is a non-custodial interface prototype. Token metadata is sourced from official Backed/xStocks registries. Trade execution operates in paper simulation mode. Does not constitute financial or investment advice.
            </p>
          </div>
          <div className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Borderless
          </div>
        </div>
      </div>
    </footer>
  );
}
