import { Skeleton } from "@/components/states";

export default function Loading() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-9 w-64" />
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  );
}
