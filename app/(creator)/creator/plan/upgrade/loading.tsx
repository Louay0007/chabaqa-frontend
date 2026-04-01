export default function UpgradeLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-center"><div className="h-10 w-48 animate-pulse rounded bg-muted" /></div>
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-96 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
