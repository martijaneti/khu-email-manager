export function EmailListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="divide-y divide-gray-100 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-3.5">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-200 mt-0.5" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <div className="h-3 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-100 rounded w-10" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
