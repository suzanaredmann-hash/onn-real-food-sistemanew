import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Skeleton className="mb-2 h-6 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border-t border-zinc-100 px-4 py-4 first:border-t-0">
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
