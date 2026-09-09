import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <Skeleton className="mb-2 h-7 w-32" />
      <Skeleton className="mb-6 h-4 w-72" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="onn-card h-32 w-full" />
        ))}
      </div>
    </div>
  );
}
