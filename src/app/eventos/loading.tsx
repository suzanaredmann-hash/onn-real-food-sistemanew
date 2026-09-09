import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="mb-8 p-6 sm:p-8">
        <Skeleton className="mb-2 h-10 w-40 bg-white/50" />
        <Skeleton className="h-4 w-56 bg-white/40" />
      </div>
      <Skeleton className="onn-card mb-6 h-16 w-full" />
      <Skeleton className="onn-card h-32 w-full" />
    </div>
  );
}
