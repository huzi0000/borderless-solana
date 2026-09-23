export default function AssetNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Asset not found</h1>
      <p className="text-sm text-text-secondary mb-6">
        This asset doesn&apos;t exist or isn&apos;t available yet.
      </p>
      <a
        href="/discover"
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent/90"
      >
        Browse markets
      </a>
    </div>
  );
}
