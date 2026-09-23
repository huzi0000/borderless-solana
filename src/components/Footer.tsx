export function Footer() {
  return (
    <footer className="border-t border-surface-border mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-sm font-bold text-text-primary">Borderless</span>
            <p className="mt-1 text-xs text-text-muted leading-relaxed max-w-md">
              Borderless is a product prototype. Market information shown in this version is demo
              data and does not constitute investment advice.
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
