import { Skeleton } from "@/components/states";

export default function Loading() {
  return (
    <div className="space-y-5 pt-11" aria-busy="true">
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-40 rounded-full" />
      </div>
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-16 shrink-0 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-11" />
        ))}
      </div>
    </div>
  );
}
