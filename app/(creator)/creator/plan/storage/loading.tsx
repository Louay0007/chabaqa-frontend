export default function StorageLoading() {
  return (
    <div className="space-y-6">
      <div className="h-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
