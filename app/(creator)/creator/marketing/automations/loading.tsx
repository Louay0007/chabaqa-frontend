export default function Loading() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="h-8 w-64 animate-pulse rounded bg-muted" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
                ))}
            </div>
        </div>
    );
}
