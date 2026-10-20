import { Skeleton } from "@/components/primitives/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-[34px] w-[46%]" />
      <Skeleton className="mt-2.5 mb-6 h-3.5 w-[30%]" />
      <Skeleton className="h-[190px] rounded-[22px]" />
      <Skeleton className="mt-3 h-[120px] rounded-2xl" />
      <Skeleton className="mt-3 h-[120px] rounded-2xl" />
    </div>
  );
}
