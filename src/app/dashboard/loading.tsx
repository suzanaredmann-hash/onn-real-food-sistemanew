import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="onn-hero mb-8 p-6 sm:p-8">
        <Skeleton className="mb-2 h-8 w-56 bg-white/50" />
        <Skeleton className="mb-6 h-4 w-72 bg-white/40" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-white/50" />
          ))}
        </div>
      </div>
      <Skeleton className="mb-2 h-5 w-24" />
      <Skeleton className="mb-4 h-4 w-64" />
      <div className="flex flex-col gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="mb-2 h-4 w-32" />
            <div className="onn-card flex flex-col gap-2 p-3">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
